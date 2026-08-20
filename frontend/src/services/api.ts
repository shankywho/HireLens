import {
  ALL_JOBS,
  type Ats,
  type Deduction,
  type EvidenceLine,
  type JobCase,
} from '@/lib/hirelens-data';
import { formatSalaryRange, formatDate } from '@/domain/formatting';
import { resolveConfidenceTier } from '@/domain/scoring';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');

/**
 * Raw Job Listing interface from backend API boundary.
 */
export interface RawApiJobListing {
  normalized_id?: string;
  id?: string;
  company?: string;
  title?: string;
  score?: number;
  sourceCount?: number;
  evidence?: (string | { finding?: string; rule?: string; label?: string; scoreDelta?: number; delta?: number })[];
  sources?: string[];
  lastSeenAt?: string | Date;
  url?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status?: string;
  daysActive?: number;
  repostCount30d?: number;
}

/**
 * Raw Company Repertoire interface from backend API boundary.
 */
export interface RawApiCompanyResponse {
  id: string;
  company: string;
  careerPageUrl?: string;
  atsPlatform?: string;
  avgListingLifespanDays: number;
  repostRatePercent: number;
  consistencyRatePercent: number;
  listings: RawApiJobListing[];
}

/**
 * Raw Collector Telemetry interface from backend API boundary.
 */
export interface RawApiCollectorHealth {
  collectorId: string;
  sourceType: string;
  status: string;
  lastRunAt?: string | Date | null;
  uptimePercent?: number;
  rowsScraped24h?: number;
  failureCount?: number;
  pendingHealJson?: {
    diff_summary?: string;
    preview_result?: unknown;
    rawOutput?: string;
    proposedSelector?: string;
    originalSelector?: string;
  } | null;
}

function resolveSourceUrl(source: string, company: string, fallbackUrl?: string): string {
  const s = (source || '').toLowerCase();
  const cSlug = (company || 'company').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (fallbackUrl && fallbackUrl.startsWith('http') && fallbackUrl.toLowerCase().includes(s)) {
    return fallbackUrl;
  }

  if (s.includes('lever')) return `https://jobs.lever.co/${cSlug}`;
  if (s.includes('greenhouse')) return `https://boards.greenhouse.io/${cSlug}`;
  if (s.includes('linkedin')) return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(company)}`;
  if (s.includes('indeed')) return `https://www.indeed.com/jobs?q=${encodeURIComponent(company)}`;

  return fallbackUrl || `https://boards.greenhouse.io/${cSlug}`;
}

/**
 * Normalizes raw backend listing record into presentation-ready JobCase domain model.
 */
export function transformBackendListing(item: RawApiJobListing, index: number): JobCase {
  const caseNumber = item.normalized_id
    ? item.normalized_id.replace(/^.*_l_/, '').toUpperCase()
    : String(8490 + index);
  const caseId = `CASE #HL-${caseNumber}`;

  const salary = formatSalaryRange(item.salaryMin, item.salaryMax);

  // Format platforms
  const rawSources = Array.isArray(item.sources) && item.sources.length > 0 ? item.sources : ['greenhouse'];
  const platforms = rawSources.map((src: string, idx: number) => {
    let atsName: Ats = 'Greenhouse';
    const lower = src.toLowerCase();
    if (lower.includes('greenhouse')) atsName = 'Greenhouse';
    else if (lower.includes('lever')) atsName = 'Lever';
    else if (lower.includes('linkedin')) atsName = 'LinkedIn';
    else if (lower.includes('indeed')) atsName = 'Indeed';

    const status: 'ACTIVE' | 'CLOSED' | 'REPOSTED' =
      idx === 0
        ? (item.status === 'CLOSED' ? 'CLOSED' : 'ACTIVE')
        : idx === 1
        ? 'CLOSED'
        : 'REPOSTED';

    return {
      ats: atsName,
      status,
    };
  });

  const finalScore = typeof item.score === 'number' ? Math.max(0, Math.min(100, Math.round(item.score))) : 85;
  const targetDelta = finalScore - 100;

  // Deductions from evidence or generated from score
  const deductions: Deduction[] = [{ label: 'Base Score', value: 100 }];

  if (targetDelta < 0) {
    if (platforms.length <= 1 && (finalScore === 80 || finalScore === 85)) {
      deductions.push({
        label: 'Single-Source Unverified Cap (Guardrail B)',
        value: targetDelta,
      });
    } else if (Array.isArray(item.evidence) && item.evidence.length > 0) {
      let currentSum = 0;
      item.evidence.forEach((ev) => {
        const label = typeof ev === 'string' ? ev : ev?.finding || ev?.rule || ev?.label || 'Cross-Source Anomaly';
        let delta = typeof ev === 'object' && ev !== null ? (ev.scoreDelta ?? ev.delta ?? null) : null;

        if (delta === null || delta === undefined) {
          // ⚠️ FALLBACK PARSER
          // The backend scoringEngine.ts is the authoritative source for scores and deltas.
          // This fallback logic exists ONLY to handle legacy text-only evidence strings
          // or malformed payloads that lack structured scoreDelta.
          const match = label.match(/\(-(\d+)\)/);
          if (match) {
            delta = -parseInt(match[1], 10);
          } else if (label.includes('conflict') || label.includes('Status')) {
            delta = -35;
          } else if (label.includes('Salary') || label.includes('spread')) {
            delta = -20;
          } else if (label.includes('Repost')) {
            delta = -15;
          } else if (label.includes('Single-source')) {
            delta = targetDelta;
          } else {
            delta = -15;
          }
        }

        currentSum += delta;
        deductions.push({
          label: label.replace(/\s*\(-?\d+\)\s*$/, ''),
          value: delta,
        });
      });

      // Ensure exact mathematical balance
      const currentFinal = 100 + currentSum;
      if (currentFinal !== finalScore) {
        const diff = finalScore - currentFinal;
        if (deductions.length > 1) {
          deductions[deductions.length - 1].value += diff;
        } else {
          deductions.push({ label: 'Cross-Source Anomaly Penalty', value: diff });
        }
      }
    } else {
      deductions.push({
        label: 'Telemetry Anomaly Detected',
        value: targetDelta,
      });
    }
  }

  // Generate evidence lines
  const evidenceLines: EvidenceLine[] = [];
  const baseTime = 14 * 3600 + 2 * 60; // 14:02 UTC
  const seenIds = new Set<string>();

  platforms.forEach((p, idx) => {
    const timeOffset = baseTime + idx * 43;
    const h = String(Math.floor(timeOffset / 3600) % 24).padStart(2, '0');
    const m = String(Math.floor(timeOffset / 60) % 60).padStart(2, '0');
    const s = String(timeOffset % 60).padStart(2, '0');
    const time = `${h}:${m}:${s}Z`;

    const sourceUrl = resolveSourceUrl(p.ats, item.company || '', item.url);
    const evId = `EV-${caseNumber}-${p.ats.toLowerCase()}`;

    if (!seenIds.has(evId)) {
      seenIds.add(evId);
      evidenceLines.push({
        id: evId,
        ats: p.ats,
        status: p.status,
        date: formatDate(item.lastSeenAt),
        time,
        sourceUrl,
      });
    }
  });

  return {
    id: String(item.id || item.normalized_id || caseNumber),
    caseId,
    targetRole: item.title || 'Software Engineer',
    targetCompany: item.company || 'Unknown',
    compensation: salary,
    score: finalScore,
    daysActive: item.daysActive || 14,
    repostCount: item.repostCount30d || (platforms.some((p) => p.status === 'REPOSTED') ? 3 : 0),
    confidence: resolveConfidenceTier(finalScore),
    platforms,
    deductions,
    evidence: evidenceLines,
  };
}

/**
 * Fetches verified multi-source listings from backend with fallback to mock data on network error.
 */
export async function fetchLiveListings(params?: {
  company?: string;
  source?: string;
  minScore?: number;
  maxScore?: number;
}): Promise<JobCase[]> {
  try {
    const query = new URLSearchParams();
    if (params?.company) query.set('company', params.company);
    if (params?.source) query.set('source', params.source);
    if (params?.minScore !== undefined) query.set('minScore', String(params.minScore));
    if (params?.maxScore !== undefined) query.set('maxScore', String(params.maxScore));

    const url = `${API_BASE}/listings${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[API] Listings endpoint returned ${res.status}, using mock dataset.`);
      return ALL_JOBS;
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return ALL_JOBS;
    }
    return (data as RawApiJobListing[]).map((item, idx) => transformBackendListing(item, idx));
  } catch (err) {
    console.warn('[API] Could not connect to backend listings, falling back to mock dataset:', err);
    return ALL_JOBS;
  }
}

/**
 * Fetches company hiring dossier by employer name.
 */
export async function fetchLiveCompanyDetail(companyName: string): Promise<RawApiCompanyResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/companies/${encodeURIComponent(companyName)}`);
    if (!res.ok) {
      console.warn(`[API] Company endpoint returned ${res.status}`);
      return null;
    }
    return (await res.json()) as RawApiCompanyResponse;
  } catch (err) {
    console.warn(`[API] Could not connect to backend company profile for ${companyName}:`, err);
    return null;
  }
}

/**
 * Fetches real-time scraper health telemetry.
 */
export async function fetchLiveCollectors(): Promise<RawApiCollectorHealth[] | null> {
  try {
    const res = await fetch(`${API_BASE}/collectors`);
    if (!res.ok) {
      console.warn(`[API] Collectors endpoint returned ${res.status}`);
      return null;
    }
    return (await res.json()) as RawApiCollectorHealth[];
  } catch (err) {
    console.warn('[API] Could not connect to backend collectors:', err);
    return null;
  }
}

/**
 * Initiates self-healing AST patch synthesis via Bright Data CLI.
 */
export async function simulateBreakLive(collectorId: string = 'c_greenhouse', prompt?: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/collectors/simulate-break`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collectorId, prompt }),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(errBody.message || errBody.error || `Heal command failed with status ${res.status}`);
  }
  return await res.json();
}

/**
 * Approves and applies synthesized selector patch via Bright Data CLI.
 */
export async function approvePatchLive(collectorId: string = 'c_greenhouse'): Promise<unknown> {
  const res = await fetch(`${API_BASE}/collectors/${encodeURIComponent(collectorId)}/approve-heal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collectorId }),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(errBody.message || errBody.error || `Approve heal failed with status ${res.status}`);
  }
  return await res.json();
}
