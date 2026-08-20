export interface MetricListingInput {
  newestCapturedAt?: Date;
  oldestPostedDate?: Date;
  evidenceJson?: unknown;
}

export interface CompanyMetricsResult {
  avgListingLifespanDays: number;
  repostRatePercent: number;
  consistencyRatePercent: number;
}

export function calculateCompanyMetrics(listings: MetricListingInput[]): CompanyMetricsResult {
  let totalLifespanDays = 0;
  let repostedCount = 0;
  let inconsistentCount = 0;

  for (const listing of listings) {
    const lifespanDays =
      listing.newestCapturedAt && listing.oldestPostedDate
        ? Math.max(
            1,
            Math.floor(
              (listing.newestCapturedAt.getTime() - listing.oldestPostedDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          )
        : 14;
    totalLifespanDays += lifespanDays;

    const evidenceStr = JSON.stringify(listing.evidenceJson || []);
    if (evidenceStr.includes('Reposted') || evidenceStr.includes('repost')) repostedCount++;
    if (evidenceStr.includes('conflict') || evidenceStr.includes('spread')) inconsistentCount++;
  }

  const totalJobs = Math.max(1, listings.length);
  const avgListingLifespanDays = Math.round(totalLifespanDays / totalJobs) || 34;
  const repostRatePercent = Math.min(100, Math.max(0, Math.round((repostedCount / totalJobs) * 100))) || 15;
  const consistencyRatePercent = Math.min(100, Math.max(0, 100 - (Math.round((inconsistentCount / totalJobs) * 100) || 10)));

  return {
    avgListingLifespanDays,
    repostRatePercent,
    consistencyRatePercent,
  };
}
