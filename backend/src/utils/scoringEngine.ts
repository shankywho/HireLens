import { ScoringInput, ScoreResult } from '../types';

/**
 * Domain Scoring Constants & Rule Thresholds
 */
export const BASE_AUTHENTICITY_SCORE = 100;
export const MIN_AUTHENTICITY_SCORE = 0;
export const MAX_AUTHENTICITY_SCORE = 100;

export const REPOST_PENALTY_PER_CYCLE = 15;
export const MAX_REPOST_PENALTY = 45;

export const STATUS_CONFLICT_PENALTY = 35;

export const SALARY_SPREAD_THRESHOLD_PERCENT = 20;
export const SALARY_SPREAD_PENALTY = 20;

export const STALENESS_THRESHOLD_DAYS = 45;
export const STALENESS_INTERVAL_DAYS = 5;
export const STALENESS_PENALTY_PER_INTERVAL = 5;
export const MAX_STALENESS_PENALTY = 25;

/** Guardrail A: A listing flagged by only a single weak anomaly is capped at a minimum score of 80 */
export const SINGLE_WEAK_SIGNAL_SCORE_FLOOR = 80;

/** Guardrail B: A listing indexed from only a single platform cannot exceed a maximum score of 85 */
export const SINGLE_SOURCE_SCORE_CAP = 85;

/**
 * Calculates penalty points for repetitive reposting of identical job requisitions.
 * -15 points per cycle, up to a maximum penalty of -45 points.
 */
export function calculateRepostPenalty(reposts: number): { penalty: number; formatted: string | null } {
  const safeCount = Math.max(0, Math.floor(Number(reposts) || 0));
  if (safeCount <= 0) return { penalty: 0, formatted: null };

  const penalty = Math.min(safeCount * REPOST_PENALTY_PER_CYCLE, MAX_REPOST_PENALTY);
  return {
    penalty,
    formatted: `Reposted ${safeCount}x in 30 days (-${penalty})`,
  };
}

/**
 * Calculates penalty points for salary discrepancy across scraping sources.
 * If spread between maximum and minimum reported salary exceeds 20%, deducts 20 points.
 */
export function calculateSalarySpreadPenalty(spreadPercent: number): { penalty: number; formatted: string | null } {
  const safeSpread = Math.max(0, Number(spreadPercent) || 0);
  if (safeSpread <= SALARY_SPREAD_THRESHOLD_PERCENT) return { penalty: 0, formatted: null };

  return {
    penalty: SALARY_SPREAD_PENALTY,
    formatted: `Salary spread ${safeSpread}% across sources (-${SALARY_SPREAD_PENALTY})`,
  };
}

/**
 * Calculates staleness penalty for job requisitions open longer than 45 days.
 * Deducts -5 points for every 5 days active beyond 45 days (max -25 points).
 */
export function calculateStalenessPenalty(daysActive: number): { penalty: number; formatted: string | null } {
  const safeDays = Math.max(0, Math.floor(Number(daysActive) || 0));
  if (safeDays <= STALENESS_THRESHOLD_DAYS) return { penalty: 0, formatted: null };

  const intervals = Math.floor((safeDays - STALENESS_THRESHOLD_DAYS) / STALENESS_INTERVAL_DAYS);
  const penalty = Math.min(intervals * STALENESS_PENALTY_PER_INTERVAL, MAX_STALENESS_PENALTY);
  if (penalty <= 0) return { penalty: 0, formatted: null };

  return {
    penalty,
    formatted: `Stale ${safeDays} days (-${penalty})`,
  };
}

/**
 * Computes a deterministic Hiring Authenticity Score for a cross-scraped job listing.
 *
 * Scoring Rules:
 * - Baseline: 100 points
 * - Repost Loop Penalty: -15 points per cycle (up to -45 points max)
 * - Status Conflict Penalty: -35 points (e.g. Active on ATS portal, Closed on aggregator)
 * - Compensation Drift Penalty: -20 points (when salary spread across sources exceeds 20%)
 * - Staleness Penalty: -5 points for every 5 days active beyond 45 days (up to -25 points max)
 * - Guardrail A: A listing flagged by only a single weak anomaly is capped at a minimum score of 80.
 * - Guardrail B: A listing indexed from only a single platform cannot exceed a maximum score of 85.
 *
 * All scores are deterministically clamped between 0 and 100 inclusive.
 *
 * @param input - The multi-source telemetry metrics for the listing
 * @returns ScoreResult containing the integer score and itemized evidence deductions
 */
export function computeHiringScore(input: ScoringInput): ScoreResult {
  let score = BASE_AUTHENTICITY_SCORE;
  const evidence: string[] = [];
  let signalCount = 0;

  // Defensive parameter extraction
  const sourceCount = Math.max(0, Number(input.sourceCount) || 1);
  const reposts = input.repostCount30d ?? input.repostCount30Days ?? 0;
  const hasConflict = Boolean(input.hasStatusConflict ?? input.statusMismatch);
  const salarySpread = input.salarySpreadPercent ?? input.salaryRangeSpreadPercent ?? 0;
  const daysActive = input.daysActive ?? input.daysActiveWithoutUpdate ?? 0;

  // 1. Repost Frequency Penalty
  const repostResult = calculateRepostPenalty(Number(reposts));
  if (repostResult.penalty > 0 && repostResult.formatted) {
    score -= repostResult.penalty;
    signalCount++;
    evidence.push(repostResult.formatted);
  }

  // 2. Cross-Source Status Conflict Penalty
  if (hasConflict) {
    score -= STATUS_CONFLICT_PENALTY;
    signalCount++;
    evidence.push(`Status conflict across sources (-${STATUS_CONFLICT_PENALTY})`);
  }

  // 3. Compensation Range Spread Penalty (> 20%)
  const spreadResult = calculateSalarySpreadPenalty(Number(salarySpread));
  if (spreadResult.penalty > 0 && spreadResult.formatted) {
    score -= spreadResult.penalty;
    signalCount++;
    evidence.push(spreadResult.formatted);
  }

  // 4. Listing Staleness Penalty (> 45 Days)
  const stalenessResult = calculateStalenessPenalty(Number(daysActive));
  if (stalenessResult.penalty > 0 && stalenessResult.formatted) {
    score -= stalenessResult.penalty;
    signalCount++;
    evidence.push(stalenessResult.formatted);
  }

  // Guardrail A: Single weak signal cannot tank a legitimate listing below 80
  if (signalCount === 1 && score < SINGLE_WEAK_SIGNAL_SCORE_FLOOR) {
    score = SINGLE_WEAK_SIGNAL_SCORE_FLOOR;
  }

  // Guardrail B: Unverified single-source listing capped at 85
  if (sourceCount < 2) {
    score = Math.min(score, SINGLE_SOURCE_SCORE_CAP);
    evidence.push('Single-source listing — cross-platform verification pending');
  }

  // Deterministic clamping between 0 and 100
  const finalScore = Math.max(MIN_AUTHENTICITY_SCORE, Math.min(MAX_AUTHENTICITY_SCORE, Math.round(score)));

  return {
    score: finalScore,
    evidence,
  };
}
