import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../errors/AppError';
import { CompanyMetricsResponse, JobListingItem, EvidenceJsonEntry } from '../types';
import { calculateCompanyMetrics, MetricListingInput } from '../domain/companyMetrics';

interface SnapshotRecord {
  id: string;
  source: string;
  rawTitle: string;
  salaryMin: number | null;
  salaryMax: number | null;
  status: string;
  postedDate: Date;
  capturedAt: Date;
  url: string | null;
  normalizedJobId: string;
}

interface CompanyWithSnapshots {
  id: string;
  name: string;
  careerPageUrl: string | null;
  atsPlatform: string | null;
  snapshots: SnapshotRecord[];
}

/**
 * Retrieves all monitored employer entities with their aggregate listing snapshot counts.
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns Promise<Response> containing array of companies
 */
export async function getCompanies(req: Request, res: Response): Promise<Response> {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { snapshots: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json(companies);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[COMPANY CONTROLLER] Error fetching companies:', message);
    return res.status(500).json({ error: 'Failed to fetch companies', message });
  }
}

/**
 * Retrieves a detailed employer hiring intelligence dossier by company name or UUID.
 *
 * @param req - Express Request with id / company name in path params
 * @param res - Express Response
 * @returns Promise<Response> containing CompanyMetricsResponse
 */
export async function getCompanyById(req: Request, res: Response): Promise<Response> {
  try {
    const rawId = String(req.params.id || '').trim();
    if (!rawId) {
      throw new NotFoundError('Company', 'empty_id');
    }

    // Support lookup by company name (case-insensitive) or ID
    const company = (await prisma.company.findFirst({
      where: {
        OR: [
          { id: rawId },
          { name: { equals: rawId, mode: 'insensitive' } },
        ],
      },
      include: {
        snapshots: {
          orderBy: { capturedAt: 'desc' },
        },
      },
    })) as unknown as CompanyWithSnapshots | null;

    if (!company) {
      throw new NotFoundError('Company', rawId);
    }

    const uniqueJobIds: string[] = Array.from(new Set(company.snapshots.map((s: SnapshotRecord) => s.normalizedJobId)));

    const jobScores = await prisma.jobScore.findMany({
      where: { normalizedJobId: { in: uniqueJobIds } }
    });
    const jobScoreMap = new Map<string, typeof jobScores[0]>();
    for (const score of jobScores) jobScoreMap.set(score.normalizedJobId, score);

    const metricInputs: MetricListingInput[] = [];

    const companyListings: JobListingItem[] = uniqueJobIds.map((normalizedJobId: string) => {
      const jobScore = jobScoreMap.get(normalizedJobId);
      const jobSnapshots = company.snapshots.filter((s: SnapshotRecord) => s.normalizedJobId === normalizedJobId);
      const newest = jobSnapshots[0];
      const oldest = jobSnapshots[jobSnapshots.length - 1];
      const uniqueSources: string[] = Array.from(new Set(jobSnapshots.map((s: SnapshotRecord) => s.source)));
      const rawEvidence = (jobScore?.evidenceJson as unknown) as (EvidenceJsonEntry[] | string[] | undefined);

      metricInputs.push({
        newestCapturedAt: newest?.capturedAt,
        oldestPostedDate: oldest?.postedDate,
        evidenceJson: rawEvidence,
      });

      return {
        normalized_id: normalizedJobId,
        company: company.name,
        title: newest?.rawTitle || 'Untitled Position',
        score: jobScore?.score ?? 100,
        sourceCount: jobScore?.sourceCount ?? uniqueSources.length,
        evidence: rawEvidence || [],
        sources: uniqueSources,
        lastSeenAt: newest?.capturedAt || new Date(),
        url: newest?.url || null,
        salaryMin: newest?.salaryMin || null,
        salaryMax: newest?.salaryMax || null,
        status: newest?.status || 'ACTIVE',
      };
    });

    const metrics = calculateCompanyMetrics(metricInputs);

    const responsePayload: CompanyMetricsResponse = {
      id: company.id,
      company: company.name,
      careerPageUrl: company.careerPageUrl || `https://boards.greenhouse.io/${company.name.toLowerCase()}`,
      atsPlatform: company.atsPlatform || 'greenhouse',
      avgListingLifespanDays: metrics.avgListingLifespanDays,
      repostRatePercent: metrics.repostRatePercent,
      consistencyRatePercent: metrics.consistencyRatePercent,
      listings: companyListings,
    };

    return res.json(responsePayload);
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[COMPANY CONTROLLER] Error fetching company profile:', message);
    return res.status(500).json({ error: 'Failed to fetch company profile', message });
  }
}
