import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../errors/AppError';
import { JobListingItem, EvidenceJsonEntry } from '../types';

interface SnapshotWithCompany {
  id: string;
  source: string;
  rawTitle: string;
  salaryMin: number | null;
  salaryMax: number | null;
  status: string;
  postedDate: Date;
  capturedAt: Date;
  url: string | null;
  company: {
    id: string;
    name: string;
    careerPageUrl: string | null;
    atsPlatform: string | null;
  };
}

/**
 * Retrieves multi-source verified job listings with authenticity scores and itemized evidence deductions.
 * Supports optional search, company, and minimum score filtering.
 *
 * @param req - Express Request with optional query parameters (search, company, minScore)
 * @param res - Express Response
 * @returns Promise<Response> containing list of JobListingItem objects
 */
export async function getListings(req: Request, res: Response): Promise<Response> {
  try {
    const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const rawCompany = typeof req.query.company === 'string' ? req.query.company.trim() : '';
    const rawMinScore = parseInt(String(req.query.minScore || '0'), 10);
    const minScore = Number.isFinite(rawMinScore) ? Math.max(0, Math.min(100, rawMinScore)) : 0;

    const scores = await prisma.jobScore.findMany({
      where: {
        score: { gte: minScore },
      },
      orderBy: { computedAt: 'desc' },
    });

    const scoreIds = scores.map(s => s.normalizedJobId);

    const allSnapshots = (await prisma.listingSnapshot.findMany({
      where: { normalizedJobId: { in: scoreIds } },
      include: { company: true },
      orderBy: { capturedAt: 'desc' },
    })) as unknown as (SnapshotWithCompany & { normalizedJobId: string })[];

    const snapshotsByJobId = new Map<string, (SnapshotWithCompany & { normalizedJobId: string })[]>();
    for (const snap of allSnapshots) {
      if (!snapshotsByJobId.has(snap.normalizedJobId)) {
        snapshotsByJobId.set(snap.normalizedJobId, []);
      }
      snapshotsByJobId.get(snap.normalizedJobId)!.push(snap);
    }

    const listingsWithDetails = scores.map((jobScore: { normalizedJobId: string; score: number; sourceCount: number; evidenceJson: unknown }) => {
      const latestSnapshots = snapshotsByJobId.get(jobScore.normalizedJobId) || [];

      if (latestSnapshots.length === 0) return null;

      const newest = latestSnapshots[0]!;
      const uniqueSources: string[] = Array.from(new Set(latestSnapshots.map(s => s.source)));

      // Filtering by search term or company if requested
      if (rawCompany && newest.company.name.toLowerCase() !== rawCompany.toLowerCase()) {
        return null;
      }

      if (rawSearch) {
        const matchTitle = newest.rawTitle.toLowerCase().includes(rawSearch.toLowerCase());
        const matchCompany = newest.company.name.toLowerCase().includes(rawSearch.toLowerCase());
        const matchId = jobScore.normalizedJobId.toLowerCase().includes(rawSearch.toLowerCase());
        if (!matchTitle && !matchCompany && !matchId) return null;
      }

      const rawEvidence = (jobScore.evidenceJson as unknown) as (EvidenceJsonEntry[] | string[]);

      const item: JobListingItem = {
        normalized_id: jobScore.normalizedJobId,
        company: newest.company.name,
        title: newest.rawTitle,
        score: jobScore.score,
        sourceCount: jobScore.sourceCount,
        evidence: rawEvidence || [],
        sources: uniqueSources,
        lastSeenAt: newest.capturedAt,
        url: newest.url,
        salaryMin: newest.salaryMin,
        salaryMax: newest.salaryMax,
        status: newest.status,
      };

      return item;
    });

    const filteredListings = listingsWithDetails.filter((item: JobListingItem | null): item is JobListingItem => item !== null);
    return res.json(filteredListings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[LISTING CONTROLLER] Error fetching listings:', message);
    return res.status(500).json({ error: 'Failed to fetch listings', message });
  }
}

/**
 * Retrieves complete raw snapshot history and evidence trail for a specific normalized job requisition.
 *
 * @param req - Express Request with normalizedJobId in path params
 * @param res - Express Response
 * @returns Promise<Response> containing detailed listing case file and snapshot history
 */
export async function getListingById(req: Request, res: Response): Promise<Response> {
  try {
    const normalizedJobId = String(req.params.normalizedJobId || '').trim();
    if (!normalizedJobId) {
      throw new NotFoundError('Listing Case File', 'empty_id');
    }

    const jobScore = await prisma.jobScore.findUnique({
      where: { normalizedJobId },
    });

    if (!jobScore) {
      throw new NotFoundError('Listing Case File', normalizedJobId);
    }

    const snapshots = (await prisma.listingSnapshot.findMany({
      where: { normalizedJobId },
      include: { company: true },
      orderBy: { capturedAt: 'desc' },
    })) as unknown as SnapshotWithCompany[];

    const newest = snapshots[0];
    const uniqueSources: string[] = Array.from(new Set(snapshots.map((s: SnapshotWithCompany) => s.source)));
    const rawEvidence = (jobScore.evidenceJson as unknown) as (EvidenceJsonEntry[] | string[]);

    return res.json({
      normalized_id: jobScore.normalizedJobId,
      company: newest?.company?.name || 'Unknown',
      title: newest?.rawTitle || 'Untitled Position',
      score: jobScore.score,
      sourceCount: jobScore.sourceCount,
      evidence: rawEvidence || [],
      sources: uniqueSources,
      lastSeenAt: newest?.capturedAt || new Date(),
      url: newest?.url,
      snapshots: snapshots.map((s: SnapshotWithCompany) => ({
        id: s.id,
        source: s.source,
        rawTitle: s.rawTitle,
        salaryMin: s.salaryMin,
        salaryMax: s.salaryMax,
        status: s.status,
        postedDate: s.postedDate,
        capturedAt: s.capturedAt,
        url: s.url,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[LISTING CONTROLLER] Error fetching listing details:', message);
    return res.status(500).json({ error: 'Failed to fetch listing details', message });
  }
}
