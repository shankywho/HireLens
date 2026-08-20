export interface JobListing {
  normalized_id: string;
  company: string;
  title: string;
  score: number;
  sourceCount: number;
  evidence: string[];
  sources: string[];
  lastSeenAt: string;
  url?: string;
  salaryMin?: number;
  salaryMax?: number;
  status?: string;
}

export interface JobSnapshot {
  id: string;
  source: string;
  rawTitle: string;
  salaryMin?: number;
  salaryMax?: number;
  status: string;
  postedDate: string;
  capturedAt: string;
  url: string;
}

export interface JobListingDetail extends JobListing {
  snapshots: JobSnapshot[];
}

export interface CompanyMetrics {
  id: string;
  company: string;
  careerPageUrl: string;
  atsPlatform: string;
  avgListingLifespanDays: number;
  repostRatePercent: number;
  consistencyRatePercent: number;
  listings: JobListing[];
}

export interface CollectorHealth {
  collectorId: string;
  sourceType: string;
  status: 'HEALTHY' | 'DEGRADED' | 'HEALING';
  lastRunAt: string;
  failureCount: number;
  pendingHealJson?: {
    collectorId?: string;
    diff?: string;
    suggestedSelectors?: Record<string, string>;
    timestamp?: string;
    reason?: string;
  } | null;
}
