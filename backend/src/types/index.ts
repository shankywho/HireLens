/**
 * HireLens Domain Type Definitions
 * Enterprise-grade strongly-typed interfaces eliminating any usage across the platform.
 */

export interface ScoringInput {
  /** Total number of unique platforms where this job was scraped (e.g. Greenhouse, LinkedIn, Indeed) */
  sourceCount: number;
  /** Number of times an identical job requisition was reposted in the trailing 30 days */
  repostCount30Days?: number;
  /** Alias for repostCount30Days for scoring test compatibility */
  repostCount30d?: number;
  /** Whether the job status is mismatched across sources (e.g. Active on Greenhouse but Closed on LinkedIn) */
  statusMismatch?: boolean;
  /** Alias for statusMismatch */
  hasStatusConflict?: boolean;
  /** Percentage spread between min and max compensation scraped across sources */
  salaryRangeSpreadPercent?: number;
  /** Alias for salaryRangeSpreadPercent */
  salarySpreadPercent?: number;
  /** Number of calendar days since the earliest matching requisition posting */
  daysActiveWithoutUpdate?: number;
  /** Alias for daysActiveWithoutUpdate */
  daysActive?: number;
}

export interface ScoreResult {
  /** Deterministic authenticity score clamped between 0 and 100 */
  score: number;
  /** Itemized evidence deduction lines explaining score adjustments */
  evidence: string[];
}

export type AtsSource = 'greenhouse' | 'lever' | 'linkedin' | 'indeed';

export interface RawScrapedJob {
  company: string;
  source: AtsSource;
  rawTitle: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  status: 'open' | 'closed';
  postedDate: string;
  url: string;
}

export interface NormalizationOutput {
  normalized_id: string;
  confidence: number;
  reasoning: string;
}

/**
 * Exact verified output shape of `bdata scraper heal <collector_id> "<prompt>" --json`
 */
export interface HealResult {
  collector_id: string;
  status: 'awaiting_approval' | string;
  completed_steps: string[];
  prompt: string;
  view_url: string;
  next_step: string;
  preview_result: Array<Record<string, unknown>>;
  diff_summary: string;
  rawOutput?: string;
}

/**
 * Exact verified output shape of `bdata scraper approve <collector_id> --json`
 */
export interface ApproveResult {
  collector_id: string;
  status: 'done' | string;
  completed_steps: string[];
  prompt: string;
  view_url: string;
  next_step: string;
  rawOutput?: string;
}

export interface PendingHealPatch {
  targetCollector?: string;
  collectorId?: string;
  collector_id?: string;
  status?: 'awaiting_approval' | 'done' | 'error' | string;
  completed_steps?: string[];
  prompt?: string;
  view_url?: string;
  next_step?: string;
  diff_summary?: string;
  preview_result?: Array<Record<string, unknown>> | unknown;
  originalSelector?: string;
  proposedSelector?: string;
  confidence?: number;
  diffExplanation?: string;
  diff?: string;
  suggestedSelectors?: Record<string, string>;
  rawOutput?: string;
  draftedAt?: string;
  error?: string;
}

export type CollectorState = 'HEALTHY' | 'INVESTIGATING' | 'PATCH_READY' | 'DEGRADED' | 'HEALING' | 'awaiting_approval' | 'ERROR';

export interface CollectorHealthStatus {
  id?: string;
  collectorId: string;
  sourceType: string;
  status: CollectorState;
  lastRunAt: Date | string;
  failureCount: number;
  pendingHealJson?: PendingHealPatch | Record<string, unknown> | null;
  uptimePercentage?: number;
  totalExtractions?: number;
  errorLogSnippet?: string | null;
}

export interface EvidenceJsonEntry {
  timestamp?: string;
  finding?: string;
  source?: string;
  confidence?: number;
  rule?: string;
  scoreDelta?: number;
  delta?: number;
  label?: string;
  url?: string;
}

export interface JobListingItem {
  normalized_id: string;
  company: string;
  title: string;
  score: number;
  sourceCount: number;
  evidence: EvidenceJsonEntry[] | string[];
  sources: string[];
  lastSeenAt: Date | string;
  url?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status?: string;
}

export interface CompanyMetricsResponse {
  id: string;
  company: string;
  careerPageUrl: string;
  atsPlatform: string;
  avgListingLifespanDays: number;
  repostRatePercent: number;
  consistencyRatePercent: number;
  listings: JobListingItem[];
}
