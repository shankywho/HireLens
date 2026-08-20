import { describe, it, expect } from 'vitest';
import { calculateCompanyMetrics } from '../companyMetrics';

describe('companyMetrics', () => {
  it('handles empty snapshots', () => {
    const result = calculateCompanyMetrics([]);
    expect(result.avgListingLifespanDays).toBe(34); // 0 || 34
    expect(result.repostRatePercent).toBe(15); // 0 || 15
    expect(result.consistencyRatePercent).toBe(90); // 100 - (0 || 10)
  });

  it('calculates metrics with normal snapshots', () => {
    const date1 = new Date('2026-08-01T00:00:00Z');
    const date2 = new Date('2026-08-15T00:00:00Z'); // 14 days difference

    const result = calculateCompanyMetrics([
      {
        newestCapturedAt: date2,
        oldestPostedDate: date1,
        evidenceJson: ['conflict', 'repost'], // 1 repost, 1 conflict
      },
      {
        newestCapturedAt: date2,
        oldestPostedDate: date1, // 14 days
        evidenceJson: [], // 0 repost, 0 conflict
      },
    ]);
    // Total jobs: 2
    // Lifespan: 14 + 14 = 28 -> avg = 14
    // Reposts: 1/2 = 50%
    // Inconsistent: 1/2 = 50% -> consistency = 50%

    expect(result.avgListingLifespanDays).toBe(14);
    expect(result.repostRatePercent).toBe(50);
    expect(result.consistencyRatePercent).toBe(50);
  });

  it('handles division-by-zero boundary for jobs', () => {
    const result = calculateCompanyMetrics([]);
    expect(result.avgListingLifespanDays).toBe(34); // 0 || 34
    expect(result.repostRatePercent).toBe(15); // 0 || 15
    expect(result.consistencyRatePercent).toBe(90); // 100 - (0 || 10)
  });
});
