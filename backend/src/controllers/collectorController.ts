import { Request, Response } from 'express';
import { HealthMonitorService } from '../services/healthMonitor';
import { BrightDataService } from '../services/brightDataService';
import { scrapeQueue } from '../queues/scrapeQueue';
import { prisma } from '../utils/prisma';
import { ValidationError } from '../errors/AppError';
import { AtsSource } from '../types';
import { env } from '../config/env';

/**
 * Retrieves the real-time health telemetry of all active scrapers.
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns Promise<Response> containing the list of collector health status objects
 */
export async function getCollectors(req: Request, res: Response): Promise<Response> {
  try {
    const collectors = await HealthMonitorService.getAllHealth();
    return res.json(collectors);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[COLLECTOR CONTROLLER] Error fetching collector health:', message);
    return res.status(500).json({ error: 'Failed to fetch collector health', message });
  }
}

/**
 * Approves a self-healing selector patch via `bdata scraper approve <id>`.
 *
 * @param req - Express Request containing collector id in params or body
 * @param res - Express Response
 * @returns Promise<Response> confirming collector patch application and state reset
 */
export async function approveHeal(req: Request, res: Response): Promise<Response> {
  const id = String(req.params.id || req.body?.collectorId || req.body?.id || 'c_greenhouse').trim();
  try {
    const updated = await HealthMonitorService.approveHeal(id);
    return res.json({
      message: `Collector ${id} successfully approved via bdata scraper approve and marked HEALTHY.`,
      collector: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[COLLECTOR CONTROLLER] Error approving heal for collector ${id}:`, message);
    return res.status(500).json({
      error: `Failed to approve collector heal for ${id}`,
      message,
      collectorId: id,
    });
  }
}

/**
 * Initiates a self-healing selector synthesis command via `bdata scraper heal <id> "<prompt>"`.
 * Transitions the collector to 'awaiting_approval' upon success.
 *
 * @param req - Express Request with optional collectorId and prompt in body
 * @param res - Express Response
 * @returns Promise<Response> detailing the healing draft outcome and state transition
 */
export async function healCollector(req: Request, res: Response): Promise<Response> {
  const body = (req.body || {}) as { collectorId?: string; prompt?: string };
  const collectorId = String(body.collectorId || 'c_greenhouse').trim();
  const prompt = String(body.prompt || 'Selector drift detected on job title node').trim();

  try {
    const updated = await HealthMonitorService.healCollector(collectorId, prompt);
    return res.json({
      message: `Collector ${collectorId} heal initiated via bdata scraper heal. State transitioned to awaiting_approval.`,
      collector: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[COLLECTOR CONTROLLER] Error executing heal for collector ${collectorId}:`, message);
    return res.status(500).json({
      error: `Bright Data CLI heal failed for ${collectorId}`,
      message,
      collectorId,
    });
  }
}

/**
 * Alias for healCollector / break trigger to initiate heal workflow.
 */
export async function simulateBreak(req: Request, res: Response): Promise<Response> {
  return healCollector(req, res);
}

/**
 * Manually triggers a scraper sweep job for a target company and ATS platform.
 * Runs directly or enqueues if Redis is active.
 *
 * @param req - Express Request with companyName and sourceType in body
 * @param res - Express Response
 * @returns Promise<Response> with jobId or extracted listings confirmation
 */
export async function triggerCollector(req: Request, res: Response): Promise<Response> {
  try {
    const { companyName, sourceType, collectorId, targetUrl } = req.body as {
      companyName?: string;
      sourceType?: string;
      collectorId?: string;
      targetUrl?: string;
    };

    if (!companyName || !sourceType) {
      throw new ValidationError('companyName and sourceType are required in request body');
    }

    const trimmedCompany = companyName.trim();
    let company = await prisma.company.findFirst({
      where: { name: { equals: trimmedCompany, mode: 'insensitive' } },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: trimmedCompany,
          careerPageUrl: targetUrl || `https://boards.greenhouse.io/${trimmedCompany.toLowerCase()}`,
          atsPlatform: 'greenhouse',
        },
      });
    }

    const validSourceTypes: AtsSource[] = ['greenhouse', 'lever', 'linkedin', 'indeed'];
    const normalizedSource = sourceType.toLowerCase().trim() as AtsSource;
    const finalSourceType: AtsSource = validSourceTypes.includes(normalizedSource) ? normalizedSource : 'greenhouse';

    const rawCId = collectorId || (finalSourceType === 'greenhouse' ? (env.GREENHOUSE_COLLECTOR_ID || 'c_greenhouse') : `c_${finalSourceType}`);
    const cId = rawCId === 'c_greenhouse' ? (env.GREENHOUSE_COLLECTOR_ID || rawCId) : rawCId;

    try {
      const job = (await Promise.race([
        scrapeQueue.add('scrape-sweep', {
          companyId: company.id,
          companyName: company.name,
          sourceType: finalSourceType,
          collectorId: cId,
          targetUrl,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Queue timeout / Redis offline')), 800)),
      ])) as { id?: string };

      return res.status(202).json({
        message: `Scrape job queued for ${trimmedCompany} via ${finalSourceType}`,
        jobId: job.id,
      });
    } catch {
      // Direct synchronous execution fallback when Redis is offline or unavailable
      console.log(`[COLLECTOR] Redis queue unavailable — running collector synchronously for ${trimmedCompany}`);
      const rawJobs = await BrightDataService.runCollector(cId, trimmedCompany, finalSourceType, targetUrl);

      return res.json({
        message: `Scrape completed synchronously for ${trimmedCompany} (${rawJobs.length} listings parsed)`,
        company: trimmedCompany,
        source: finalSourceType,
        collectorId: cId,
        count: rawJobs.length,
        jobs: rawJobs,
      });
    }
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[COLLECTOR CONTROLLER] Error triggering collector:', message);
    return res.status(500).json({ error: 'Failed to trigger collector', message });
  }
}
