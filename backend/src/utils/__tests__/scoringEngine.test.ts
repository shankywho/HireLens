import { describe, it, expect } from 'vitest';
import {
  computeHiringScore,
  calculateRepostPenalty,
  calculateSalarySpreadPenalty,
  calculateStalenessPenalty,
  BASE_AUTHENTICITY_SCORE,
  MAX_REPOST_PENALTY,
  SINGLE_SOURCE_SCORE_CAP,
  SINGLE_WEAK_SIGNAL_SCORE_FLOOR,
} from '../scoringEngine';

describe('HireLens Scoring Engine & Domain Calculations', () => {
  describe('calculateRepostPenalty()', () => {
    it('returns 0 penalty for 0 reposts', () => {
      const res = calculateRepostPenalty(0);
      expect(res.penalty).toBe(0);
      expect(res.formatted).toBeNull();
    });

    it('deducts 15 points for 1 cycle', () => {
      const res = calculateRepostPenalty(1);
      expect(res.penalty).toBe(15);
      expect(res.formatted).toBe('Reposted 1x in 30 days (-15)');
    });

    it('deducts 30 points for 2 cycles', () => {
      const res = calculateRepostPenalty(2);
      expect(res.penalty).toBe(30);
      expect(res.formatted).toBe('Reposted 2x in 30 days (-30)');
    });

    it('caps penalty at -45 points for 3 or more cycles', () => {
      expect(calculateRepostPenalty(3).penalty).toBe(MAX_REPOST_PENALTY);
      expect(calculateRepostPenalty(5).penalty).toBe(MAX_REPOST_PENALTY);
      expect(calculateRepostPenalty(100).penalty).toBe(MAX_REPOST_PENALTY);
    });

    it('handles negative or NaN repost counts gracefully', () => {
      expect(calculateRepostPenalty(-5).penalty).toBe(0);
      expect(calculateRepostPenalty(NaN).penalty).toBe(0);
    });
  });

  describe('calculateSalarySpreadPenalty()', () => {
    it('applies no penalty when spread is 20% or below (threshold boundary)', () => {
      expect(calculateSalarySpreadPenalty(0).penalty).toBe(0);
      expect(calculateSalarySpreadPenalty(19).penalty).toBe(0);
      expect(calculateSalarySpreadPenalty(20).penalty).toBe(0);
    });

    it('deducts 20 points when spread strictly exceeds 20% (threshold + 1)', () => {
      const res = calculateSalarySpreadPenalty(21);
      expect(res.penalty).toBe(20);
      expect(res.formatted).toBe('Salary spread 21% across sources (-20)');
    });

    it('handles extreme salary spreads and negative values', () => {
      expect(calculateSalarySpreadPenalty(150).penalty).toBe(20);
      expect(calculateSalarySpreadPenalty(-10).penalty).toBe(0);
    });
  });

  describe('calculateStalenessPenalty()', () => {
    it('applies no penalty for listings active <= 45 days (threshold boundary)', () => {
      expect(calculateStalenessPenalty(10).penalty).toBe(0);
      expect(calculateStalenessPenalty(45).penalty).toBe(0);
    });

    it('deducts 5 points for every 5 days active beyond 45 days', () => {
      expect(calculateStalenessPenalty(49).penalty).toBe(0); // not yet a full 5d interval
      expect(calculateStalenessPenalty(50).penalty).toBe(5);
      expect(calculateStalenessPenalty(55).penalty).toBe(10);
      expect(calculateStalenessPenalty(60).penalty).toBe(15);
    });

    it('caps staleness penalty at 25 points maximum (70+ days)', () => {
      expect(calculateStalenessPenalty(70).penalty).toBe(25);
      expect(calculateStalenessPenalty(200).penalty).toBe(25);
    });
  });

  describe('computeHiringScore()', () => {
    it('returns BASE_AUTHENTICITY_SCORE (100) for clean multi-source listings', () => {
      const result = computeHiringScore({
        sourceCount: 3,
        repostCount30d: 0,
        hasStatusConflict: false,
        salarySpreadPercent: 5,
        daysActive: 10,
      });
      expect(result.score).toBe(BASE_AUTHENTICITY_SCORE);
      expect(result.evidence).toHaveLength(0);
    });

    it('caps single-source unverified listings at SINGLE_SOURCE_SCORE_CAP (85)', () => {
      const result = computeHiringScore({
        sourceCount: 1,
        repostCount30d: 0,
        hasStatusConflict: false,
        salarySpreadPercent: 0,
        daysActive: 5,
      });
      expect(result.score).toBe(SINGLE_SOURCE_SCORE_CAP);
      expect(result.evidence).toContain('Single-source listing — cross-platform verification pending');
    });

    it('enforces Guardrail A: single weak signal cannot drop score below 80', () => {
      // Status conflict alone = 100 - 35 = 65, but single signal -> capped at 80
      const result = computeHiringScore({
        sourceCount: 3,
        repostCount30d: 0,
        hasStatusConflict: true,
        salarySpreadPercent: 0,
        daysActive: 10,
      });
      expect(result.score).toBe(SINGLE_WEAK_SIGNAL_SCORE_FLOOR);
    });

    it('correctly aggregates multiple severe penalties without floor capping', () => {
      const result = computeHiringScore({
        sourceCount: 3,
        repostCount30d: 2, // -30
        hasStatusConflict: true, // -35
        salarySpreadPercent: 25, // -20
        daysActive: 75, // -25
      });
      // 100 - 30 - 35 - 20 - 25 = -10 -> clamped to 0
      expect(result.score).toBe(0);
      expect(result.evidence).toHaveLength(4);
    });

    it('handles null, undefined, and non-numeric fields defensively', () => {
      const result = computeHiringScore({
        sourceCount: null as unknown as number,
        repostCount30d: undefined,
        hasStatusConflict: undefined,
        salarySpreadPercent: 'invalid' as unknown as number,
        daysActive: -10,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.score)).toBe(true);
    });
  });
});
