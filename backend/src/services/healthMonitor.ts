import { Prisma } from '@prisma/client';
import { BrightDataService } from './brightDataService';
import { CollectorHealthStatus, PendingHealPatch } from '../types';
import { env } from '../config/env';
import { prisma } from '../utils/prisma';

/**
 * Health Monitor Service
 * Tracks uptime, detects scraper failure thresholds, and initiates auto-healing workflows.
 */
export class HealthMonitorService {
  /**
   * Records a successful scraping sweep, resetting failure counters and marking status as HEALTHY.
   *
   * @param collectorId - Target collector ID
   * @param sourceType - ATS platform type
   */
  public static async updateHealthOnSuccess(
    collectorId: string,
    sourceType: string,
    rowCount: number = 0
  ): Promise<void> {
    await prisma.collectorHealth.upsert({
      where: { collectorId },
      update: {
        lastRunAt: new Date(),
        status: 'HEALTHY',
        failureCount: 0,
        rows24h: rowCount > 0 ? { increment: rowCount } : undefined,
      },
      create: {
        collectorId,
        sourceType,
        status: 'HEALTHY',
        lastRunAt: new Date(),
        failureCount: 0,
        rows24h: rowCount,
      },
    });
  }

  /**
   * Handles scraper failure or null extraction events. When failures reach threshold (>= 2),
   * initiates real Bright Data CLI heal (`bdata scraper heal <id>`) and transitions collector
   * to 'awaiting_approval' state.
   *
   * Surfaces real CLI errors rather than masking them.
   *
   * @param collectorId - Target collector ID
   * @param sourceType - ATS platform type
   * @param errorReason - Diagnostic failure description
   */
  public static async handleCollectorFailure(
    collectorId: string,
    sourceType: string,
    errorReason: string
  ): Promise<void> {
    const existing = await prisma.collectorHealth.findUnique({
      where: { collectorId },
    });

    const failureCount = (existing?.failureCount || 0) + 1;
    let status = existing?.status || 'HEALTHY';
    let pendingHealJson: PendingHealPatch | Prisma.InputJsonValue | null =
      (existing?.pendingHealJson as unknown as PendingHealPatch) || null;

    if (failureCount >= 2) {
      console.warn(
        `[HEALTH MONITOR] Collector ${collectorId} failure threshold reached (${errorReason}). Initiating Bright Data CLI heal...`
      );

      try {
        const healResult = await BrightDataService.healCollector(collectorId, errorReason);
        status = 'awaiting_approval';
        pendingHealJson = healResult as unknown as Prisma.InputJsonValue;
      } catch (cliError: unknown) {
        const errorMessage = cliError instanceof Error ? cliError.message : String(cliError);
        console.error(`[HEALTH MONITOR] Real Bright Data heal failed for ${collectorId}:`, errorMessage);
        status = 'DEGRADED';
        pendingHealJson = {
          targetCollector: collectorId,
          collectorId,
          status: 'error',
          error: errorMessage,
          draftedAt: new Date().toISOString(),
        } as unknown as Prisma.InputJsonValue;
        // Re-throw so caller/controller can surface the genuine failure
        throw cliError;
      }
    }

    const healData = pendingHealJson ? (pendingHealJson as Prisma.InputJsonValue) : Prisma.DbNull;

    await prisma.collectorHealth.upsert({
      where: { collectorId },
      update: {
        lastRunAt: new Date(),
        lastDriftAt: new Date(),
        failureCount,
        status,
        pendingHealJson: healData,
      },
      create: {
        collectorId,
        sourceType,
        status,
        lastRunAt: new Date(),
        lastDriftAt: new Date(),
        failureCount,
        pendingHealJson: healData,
      },
    });
  }

  /**
   * Directly triggers the real Bright Data CLI heal command and transitions the collector state
   * to 'awaiting_approval'.
   *
   * @param collectorId - Target collector ID
   * @param prompt - Optional diagnostic prompt
   */
  public static async healCollector(collectorId: string, prompt?: string): Promise<CollectorHealthStatus> {
    const resolvedId = collectorId === 'c_greenhouse' ? (env.GREENHOUSE_COLLECTOR_ID || collectorId) : collectorId;
    const existing = await prisma.collectorHealth.findUnique({ where: { collectorId: resolvedId } });
    const sourceType = existing?.sourceType || 'greenhouse';

    const healResult = await BrightDataService.healCollector(
      resolvedId,
      prompt || 'Fix drifted job title and salary selectors'
    );

    const updated = await prisma.collectorHealth.upsert({
      where: { collectorId: resolvedId },
      update: {
        status: 'awaiting_approval',
        lastDriftAt: new Date(),
        pendingHealJson: healResult as unknown as Prisma.InputJsonValue,
      },
      create: {
        collectorId: resolvedId,
        sourceType,
        status: 'awaiting_approval',
        lastRunAt: new Date(),
        lastDriftAt: new Date(),
        failureCount: 1,
        pendingHealJson: healResult as unknown as Prisma.InputJsonValue,
      },
    });

    return updated as unknown as CollectorHealthStatus;
  }

  /**
   * Approves a pending selector patch via `bdata scraper approve <id>` and resets collector health state to HEALTHY.
   *
   * @param collectorId - Target collector to heal and restore
   * @returns Promise<CollectorHealthStatus> the updated database record
   */
  public static async approveHeal(collectorId: string): Promise<CollectorHealthStatus> {
    const resolvedId = collectorId === 'c_greenhouse' ? (env.GREENHOUSE_COLLECTOR_ID || collectorId) : collectorId;
    await BrightDataService.approveHeal(resolvedId);

    const updated = await prisma.collectorHealth.upsert({
      where: { collectorId: resolvedId },
      update: {
        status: 'HEALTHY',
        failureCount: 0,
        pendingHealJson: Prisma.DbNull,
        lastRunAt: new Date(),
        lastHealedAt: new Date(),
      },
      create: {
        collectorId: resolvedId,
        sourceType: 'greenhouse',
        status: 'HEALTHY',
        failureCount: 0,
        pendingHealJson: Prisma.DbNull,
        lastRunAt: new Date(),
        lastHealedAt: new Date(),
      },
    });

    return updated as unknown as CollectorHealthStatus;
  }

  /**
   * Retrieves all collector health monitoring records.
   *
   * @returns Promise<CollectorHealthStatus[]> list of all collectors
   */
  public static async getAllHealth(): Promise<CollectorHealthStatus[]> {
    const records = await prisma.collectorHealth.findMany({
      orderBy: { lastRunAt: 'desc' },
    });

    return records as unknown as CollectorHealthStatus[];
  }
}
