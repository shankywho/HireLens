import type { ConfidenceTier, Deduction } from '@/types';

/**
 * Score Classification Thresholds
 */
export const HIGH_CONFIDENCE_MIN_SCORE = 85;
export const MEDIUM_CONFIDENCE_MIN_SCORE = 70;

/**
 * Resolves high-level confidence classification tier from numerical authenticity score.
 * - HIGH: 85 - 100
 * - MEDIUM: 70 - 84
 * - LOW: 0 - 69
 */
export function resolveConfidenceTier(score: number): ConfidenceTier {
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  if (safeScore >= HIGH_CONFIDENCE_MIN_SCORE) return 'HIGH';
  if (safeScore >= MEDIUM_CONFIDENCE_MIN_SCORE) return 'MEDIUM';
  return 'LOW';
}

/**
 * Reconciles itemized score deduction ledger to ensure mathematical balance between base score and final score.
 */
export function reconcileDeductionLedger(baseScore: number, finalScore: number, rawDeductions: Deduction[]): Deduction[] {
  const deductions: Deduction[] = [{ label: 'Base Score', value: baseScore }];
  const targetDelta = finalScore - baseScore;

  if (targetDelta === 0) {
    return deductions;
  }

  if (rawDeductions.length === 0) {
    deductions.push({
      label: 'Telemetry Anomaly Detected',
      value: targetDelta,
    });
    return deductions;
  }

  let totalDelta = 0;
  rawDeductions.forEach((d) => {
    totalDelta += d.value;
    deductions.push(d);
  });

  const remainingDiff = targetDelta - totalDelta;
  if (remainingDiff !== 0) {
    if (deductions.length > 1) {
      deductions[deductions.length - 1].value += remainingDiff;
    } else {
      deductions.push({ label: 'Cross-Source Anomaly Penalty', value: remainingDiff });
    }
  }

  return deductions;
}
