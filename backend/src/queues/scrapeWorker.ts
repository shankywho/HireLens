import { Worker, Job } from 'bullmq';
import { prisma } from '../utils/prisma';
import { redisConnection } from '../config/redis';
import { ScrapeJobData } from './scrapeQueue';
import { BrightDataService } from '../services/brightDataService';
import { normalizeJob } from '../services/normalizer';
import { computeHiringScore } from '../utils/scoringEngine';
import { HealthMonitorService } from '../services/healthMonitor';
import { ScoringInput } from '../types';

/**
 * Sets up and starts the BullMQ background scraper queue consumer worker.
 * Processes sweep jobs, extracts listings via Bright Data, normalizes canonical IDs via Gemini,
 * writes database snapshots, and recalculates cross-source hiring authenticity scores.
 *
 * @returns Worker<ScrapeJobData>
 */
export function setupScrapeWorker(): Worker<ScrapeJobData> {
  const worker = new Worker<ScrapeJobData>(
    'scrapeQueue',
    async (job: Job<ScrapeJobData>) => {
      const { companyId, companyName, sourceType, collectorId, targetUrl } = job.data;
      console.log(`[WORKER] Processing scrape job for ${companyName} (${sourceType}) via collector ${collectorId}${targetUrl ? ` targeting ${targetUrl}` : ''}`);

      try {
        const rawListings = await BrightDataService.runCollector(collectorId, companyName, sourceType, targetUrl);

        if (!rawListings || rawListings.length === 0) {
          throw new Error(`Null extraction / zero listings returned for ${companyName} on ${sourceType}`);
        }

        for (const raw of rawListings) {
          // Step 1: Normalize Title via Gemini API (@google/genai)
          const normResult = await normalizeJob(companyName, raw.rawTitle, raw.location || 'Remote');

          // Step 2: Write Snapshot to DB
          await prisma.listingSnapshot.create({
            data: {
              normalizedJobId: normResult.normalized_id,
              companyId: companyId,
              source: raw.source || sourceType,
              rawTitle: raw.rawTitle,
              salaryMin: raw.salaryMin || null,
              salaryMax: raw.salaryMax || null,
              status: raw.status || 'open',
              postedDate: raw.postedDate ? new Date(raw.postedDate) : new Date(),
              url: raw.url || `https://careers.${companyName.toLowerCase()}.com`,
            },
          });

          // Step 3: Recompute Hiring Confidence Score across all snapshots for this normalizedJobId
          await recomputeJobScore(normResult.normalized_id);
        }

        // Mark collector run healthy and increment 24h extracted rows
        await HealthMonitorService.updateHealthOnSuccess(collectorId, sourceType, rawListings.length);
        console.log(`[WORKER] Successfully processed ${rawListings.length} snapshots for ${companyName}`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[WORKER ERROR] Job failed for ${companyName} (${collectorId}):`, message);
        await HealthMonitorService.handleCollectorFailure(collectorId, sourceType, message);
        throw error;
      }
    },
    { connection: redisConnection }
  );

  worker.on('failed', (job, err) => {
    console.error(`[WORKER] Job ${job?.id} failed permanently: ${err.message}`);
  });

  return worker;
}

/**
 * Recalculates the hiring score for a normalized job across its historical multi-platform snapshots.
 *
 * @param normalizedJobId - Canonical identifier (e.g. stripe-l2-infrastructure)
 */
export async function recomputeJobScore(normalizedJobId: string): Promise<void> {
  const snapshots = await prisma.listingSnapshot.findMany({
    where: { normalizedJobId },
    orderBy: { capturedAt: 'desc' },
  });

  if (snapshots.length === 0) return;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Sources count
  const uniqueSources = new Set(snapshots.map((s) => s.source));
  const sourceCount = uniqueSources.size;

  // Repost count in 30 days
  const snapshots30Days = snapshots.filter((s) => s.capturedAt >= thirtyDaysAgo);
  const repostCount30Days = Math.max(0, snapshots30Days.length - sourceCount);

  // Status mismatch check
  const statuses = new Set(snapshots.map((s) => s.status));
  const statusMismatch = statuses.has('open') && statuses.has('closed');

  // Salary range spread calculation
  let salaryRangeSpreadPercent = 0;
  const validMinSalaries = snapshots.map((s) => s.salaryMin).filter((s): s is number => s !== null && s > 0);
  const validMaxSalaries = snapshots.map((s) => s.salaryMax).filter((s): s is number => s !== null && s > 0);

  if (validMinSalaries.length > 0 && validMaxSalaries.length > 0) {
    const minSalary = Math.min(...validMinSalaries);
    const maxSalary = Math.max(...validMaxSalaries);
    if (minSalary > 0) {
      salaryRangeSpreadPercent = Math.round(((maxSalary - minSalary) / minSalary) * 100);
    }
  }

  // Days active without update
  const oldestPostedDate = new Date(Math.min(...snapshots.map((s) => s.postedDate.getTime())));
  const daysActiveWithoutUpdate = Math.floor((now.getTime() - oldestPostedDate.getTime()) / (1000 * 60 * 60 * 24));

  const scoringInput: ScoringInput = {
    sourceCount,
    repostCount30Days,
    statusMismatch,
    salaryRangeSpreadPercent,
    daysActiveWithoutUpdate,
  };

  const { score, evidence } = computeHiringScore(scoringInput);

  await prisma.jobScore.upsert({
    where: { normalizedJobId },
    update: {
      score,
      evidenceJson: evidence,
      sourceCount,
      computedAt: new Date(),
    },
    create: {
      normalizedJobId,
      score,
      evidenceJson: evidence,
      sourceCount,
      computedAt: new Date(),
    },
  });
}
