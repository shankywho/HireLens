export type Ats = "Greenhouse" | "Lever" | "LinkedIn" | "Indeed";

export type Deduction = { label: string; value: number };

export type EvidenceLine = { ts: string; text: string; source: string; url: string };

export type JobCase = {
  id: string;
  caseId: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  daysActive: number;
  score: number;
  platforms: { ats: Ats; status: "ACTIVE" | "CLOSED" | "REPOSTED" }[];
  deductions: Deduction[];
  evidence: EvidenceLine[];
  capturedAt: string;
};

export const TICKER_LOGS = [
  "[14:02:11] SYNCED STRIPE VIA GREENHOUSE (c_mspqhy3e)",
  "[14:02:08] SALARY DRIFT DETECTED: COINBASE +27%",
  "[14:01:54] SELECTORS VERIFIED ACROSS 4 COLLECTORS",
  "1,420 ACTIVE LISTINGS AUDITED",
  "[14:01:31] CROSS-SOURCE CONFLICT: LEVER ACTIVE / LINKEDIN CLOSED",
  "[14:00:04] INDEED COLLECTOR gd_l1viktl72bvl7bjuj0 — 1,204 ROWS",
];

export const JOBS: JobCase[] = [
  {
    id: "hl-8491",
    caseId: "CASE #HL-8491",
    title: "Senior Backend Engineer, Payments Core",
    company: "Stripe",
    location: "Remote — US",
    salary: "$198,000 – $246,000",
    daysActive: 187,
    score: 30,
    platforms: [
      { ats: "Greenhouse", status: "ACTIVE" },
      { ats: "LinkedIn", status: "CLOSED" },
      { ats: "Indeed", status: "REPOSTED" },
    ],
    capturedAt: "2026-08-15T14:02:11Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Repost Frequency Penalty (-15 per cycle)", value: -15 },
      { label: "Cross-Source Status Conflict (Active on GH, Closed on LI)", value: -35 },
      { label: "Salary Drift > 20%", value: -20 },
    ],
    evidence: [
      {
        ts: "2026-02-09T08:11:04Z",
        text: "FIRST INDEXED ON GREENHOUSE BOARD",
        source: "GREENHOUSE",
        url: "https://boards.greenhouse.io/stripe",
      },
      {
        ts: "2026-05-22T17:40:52Z",
        text: "REPOSTED WITH IDENTICAL REQ BODY (HASH MATCH 0.99)",
        source: "GREENHOUSE",
        url: "https://boards.greenhouse.io/stripe",
      },
      {
        ts: "2026-07-30T09:02:17Z",
        text: "LINKEDIN LISTING MARKED NO LONGER ACCEPTING APPLICATIONS",
        source: "LINKEDIN",
        url: "https://www.linkedin.com/jobs",
      },
    ],
  },
  {
    id: "hl-8492",
    caseId: "CASE #HL-8492",
    title: "Product Designer, Multiplayer Canvas",
    company: "Figma",
    location: "San Francisco, CA",
    salary: "$164,000 – $205,000",
    daysActive: 11,
    score: 88,
    platforms: [
      { ats: "Greenhouse", status: "ACTIVE" },
      { ats: "LinkedIn", status: "ACTIVE" },
    ],
    capturedAt: "2026-08-15T13:58:02Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Recruiter Response Latency > 7d", value: -8 },
      { label: "Minor Salary Band Drift (4%)", value: -4 },
    ],
    evidence: [
      {
        ts: "2026-08-04T10:22:41Z",
        text: "NEW REQ CREATED — NO PRIOR HASH MATCH",
        source: "GREENHOUSE",
        url: "https://boards.greenhouse.io/figma",
      },
      {
        ts: "2026-08-12T15:03:09Z",
        text: "HIRING MANAGER ACTIVITY CONFIRMED ON LINKEDIN",
        source: "LINKEDIN",
        url: "https://www.linkedin.com/jobs",
      },
    ],
  },
  {
    id: "hl-8493",
    caseId: "CASE #HL-8493",
    title: "Staff Security Engineer, Custody",
    company: "Coinbase",
    location: "Remote — Global",
    salary: "$210,000 – $268,000",
    daysActive: 264,
    score: 32,
    platforms: [
      { ats: "Lever", status: "ACTIVE" },
      { ats: "Indeed", status: "REPOSTED" },
      { ats: "LinkedIn", status: "CLOSED" },
    ],
    capturedAt: "2026-08-15T12:44:30Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Repost Frequency Penalty (-15 per cycle x2)", value: -30 },
      { label: "Cross-Source Status Conflict (Active on Lever, Closed on LI)", value: -18 },
      { label: "Salary Drift > 20% (+27%)", value: -20 },
    ],
    evidence: [
      {
        ts: "2025-11-25T07:14:12Z",
        text: "REQ OPEN FOR 264 DAYS WITHOUT CLOSURE EVENT",
        source: "LEVER",
        url: "https://jobs.lever.co/coinbase",
      },
      {
        ts: "2026-06-18T19:31:55Z",
        text: "SALARY BAND SILENTLY RAISED +27% — PIPELINE BAIT PATTERN",
        source: "INDEED",
        url: "https://www.indeed.com",
      },
    ],
  },
  {
    id: "hl-8494",
    caseId: "CASE #HL-8494",
    title: "Site Reliability Engineer II",
    company: "Datadog",
    location: "New York, NY",
    salary: "$155,000 – $190,000",
    daysActive: 24,
    score: 76,
    platforms: [
      { ats: "Greenhouse", status: "ACTIVE" },
      { ats: "Indeed", status: "ACTIVE" },
    ],
    capturedAt: "2026-08-15T11:20:06Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Repost Frequency Penalty (-15 per cycle)", value: -15 },
      { label: "Job Description Boilerplate Match", value: -9 },
    ],
    evidence: [
      {
        ts: "2026-07-22T13:41:00Z",
        text: "REPOSTED ONCE AFTER 30-DAY EXPIRY (STANDARD ATS BEHAVIOR)",
        source: "GREENHOUSE",
        url: "https://boards.greenhouse.io/datadog",
      },
    ],
  },
  {
    id: "hl-8495",
    caseId: "CASE #HL-8495",
    title: "Founding Systems Engineer, Terminal Core",
    company: "Warp",
    location: "Remote — US / EU",
    salary: "$180,000 – $230,000",
    daysActive: 6,
    score: 94,
    platforms: [{ ats: "Lever", status: "ACTIVE" }],
    capturedAt: "2026-08-15T10:05:44Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Single-Source Listing (Unverified Mirror)", value: -6 },
    ],
    evidence: [
      {
        ts: "2026-08-09T09:00:00Z",
        text: "REQ CREATED — FOUNDER POSTED PUBLIC HIRING THREAD",
        source: "LEVER",
        url: "https://jobs.lever.co/warp",
      },
    ],
  },
  {
    id: "hl-8496",
    caseId: "CASE #HL-8496",
    title: "Senior Android Engineer, Dasher Platform",
    company: "DoorDash",
    location: "Seattle, WA",
    salary: "$172,000 – $214,000",
    daysActive: 143,
    score: 41,
    platforms: [
      { ats: "LinkedIn", status: "ACTIVE" },
      { ats: "Greenhouse", status: "CLOSED" },
      { ats: "Indeed", status: "REPOSTED" },
    ],
    capturedAt: "2026-08-15T09:47:19Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Repost Frequency Penalty (-15 per cycle x3)", value: -45 },
      { label: "Cross-Source Status Conflict (Closed on GH, Active on LI)", value: -14 },
    ],
    evidence: [
      {
        ts: "2026-03-25T16:12:47Z",
        text: "REQ CLOSED ON CAREER PORTAL BUT MIRROR STAYS LIVE",
        source: "GREENHOUSE",
        url: "https://boards.greenhouse.io/doordash",
      },
      {
        ts: "2026-08-01T08:30:11Z",
        text: "THIRD REPOST CYCLE DETECTED — IDENTICAL REQ HASH",
        source: "INDEED",
        url: "https://www.indeed.com",
      },
    ],
  },
];

export const ATS_LIST: Ats[] = ["Greenhouse", "Lever", "LinkedIn", "Indeed"];

export type Dossier = {
  name: string;
  ats: Ats;
  grade: string;
  lifespan: string;
  repostRate: string;
  consistency: string;
  openReqs: number;
  matrix: {
    role: string;
    linkedin: "LISTED" | "ABSENT";
    portal: "LISTED" | "ABSENT";
    verdict: "MATCH" | "PHANTOM" | "STALE MIRROR";
  }[];
};

export const DOSSIERS: Dossier[] = [
  {
    name: "Figma",
    ats: "Greenhouse",
    grade: "A+",
    lifespan: "6 Days",
    repostRate: "3%",
    consistency: "98%",
    openReqs: 42,
    matrix: [
      { role: "Product Designer, Multiplayer Canvas", linkedin: "LISTED", portal: "LISTED", verdict: "MATCH" },
      { role: "Frontend Engineer, Editor Surfaces", linkedin: "LISTED", portal: "LISTED", verdict: "MATCH" },
      { role: "Design Advocate, Community", linkedin: "LISTED", portal: "LISTED", verdict: "MATCH" },
      { role: "Enterprise Account Executive", linkedin: "LISTED", portal: "LISTED", verdict: "MATCH" },
    ],
  },
  {
    name: "Stripe",
    ats: "Greenhouse",
    grade: "B",
    lifespan: "14 Days",
    repostRate: "18%",
    consistency: "78%",
    openReqs: 214,
    matrix: [
      { role: "Senior Backend Engineer, Payments Core", linkedin: "LISTED", portal: "ABSENT", verdict: "PHANTOM" },
      { role: "Technical Account Manager, EMEA", linkedin: "LISTED", portal: "LISTED", verdict: "MATCH" },
      { role: "Data Engineer, Risk Signals", linkedin: "LISTED", portal: "LISTED", verdict: "MATCH" },
      { role: "Product Manager, Billing & Invoicing", linkedin: "LISTED", portal: "ABSENT", verdict: "STALE MIRROR" },
    ],
  },
  {
    name: "DoorDash",
    ats: "Greenhouse",
    grade: "C-",
    lifespan: "48 Days",
    repostRate: "32%",
    consistency: "54%",
    openReqs: 158,
    matrix: [
      { role: "Senior Android Engineer, Dasher Platform", linkedin: "LISTED", portal: "ABSENT", verdict: "PHANTOM" },
      { role: "Ops Manager, Merchant Success", linkedin: "LISTED", portal: "LISTED", verdict: "MATCH" },
      { role: "Machine Learning Engineer, Dispatch ETA", linkedin: "LISTED", portal: "LISTED", verdict: "MATCH" },
      { role: "Strategy & Analytics Lead", linkedin: "LISTED", portal: "ABSENT", verdict: "STALE MIRROR" },
    ],
  },
  {
    name: "Coinbase",
    ats: "Lever",
    grade: "D-",
    lifespan: "92 Days",
    repostRate: "44%",
    consistency: "24%",
    openReqs: 96,
    matrix: [
      { role: "Staff Security Engineer, Custody Key Mgmt", linkedin: "LISTED", portal: "ABSENT", verdict: "PHANTOM" },
      { role: "Blockchain Protocol Engineer, L2 Execution", linkedin: "LISTED", portal: "ABSENT", verdict: "PHANTOM" },
      { role: "Compliance Operations Lead", linkedin: "LISTED", portal: "ABSENT", verdict: "STALE MIRROR" },
      { role: "Senior Technical Recruiter", linkedin: "LISTED", portal: "LISTED", verdict: "MATCH" },
    ],
  },
];

export type CollectorStatus = "HEALTHY" | "INVESTIGATING" | "PATCH_READY";

export const COLLECTORS = [
  { name: "Greenhouse", id: "c_msx28aib1bi38vk8vw", uptime: "99.8%", rows: "412,904" },
  { name: "Lever", id: "c_msoqfr4nik4o54w99", uptime: "99.1%", rows: "188,320" },
  { name: "LinkedIn", id: "gd_l4dx9j9sscpvs7no2", uptime: "98.7%", rows: "1,204,556" },
  { name: "Indeed", id: "gd_l1viktl72bvl7bjuj0", uptime: "99.9%", rows: "902,117" },
];

/* ------------------------------------------------------------------ */
/* Extended feed: additional case files for the dense radar grid       */
/* ------------------------------------------------------------------ */

const mkEvidence = (company: string, source: string): EvidenceLine[] => [
  {
    ts: "2026-06-02T09:14:22Z",
    text: `FIRST INDEXED ON ${source.toUpperCase()} BOARD`,
    source: source.toUpperCase(),
    url: `https://example.com/${company.toLowerCase()}/postings`,
  },
  {
    ts: "2026-08-11T03:41:07Z",
    text: "REQUISITION ID RECYCLED WITHOUT DESCRIPTION CHANGE",
    source: "HIRELENS DIFF",
    url: `https://example.com/${company.toLowerCase()}/diff`,
  },
  {
    ts: "2026-08-15T14:02:11Z",
    text: "CROSS-SOURCE SNAPSHOT CAPTURED (4 COLLECTORS)",
    source: "SWEEP",
    url: `https://example.com/${company.toLowerCase()}/sweep`,
  },
];

export const EXTRA_JOBS: JobCase[] = [
  {
    id: "hl-8502",
    caseId: "CASE #HL-8502",
    title: "Staff Infrastructure Engineer, Edge",
    company: "Cloudflare",
    location: "Austin, TX — Hybrid",
    salary: "$210,000 – $265,000",
    daysActive: 12,
    score: 91,
    platforms: [
      { ats: "Greenhouse", status: "ACTIVE" },
      { ats: "LinkedIn", status: "ACTIVE" },
    ],
    capturedAt: "2026-08-15T14:02:11Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Minor Description Churn", value: -9 },
    ],
    evidence: mkEvidence("Cloudflare", "Greenhouse"),
  },
  {
    id: "hl-8514",
    caseId: "CASE #HL-8514",
    title: "Enterprise Account Executive, NAMER",
    company: "Snowflake",
    location: "Remote — US",
    salary: "$140,000 base + OTE",
    daysActive: 244,
    score: 22,
    platforms: [
      { ats: "Lever", status: "ACTIVE" },
      { ats: "LinkedIn", status: "REPOSTED" },
      { ats: "Indeed", status: "REPOSTED" },
    ],
    capturedAt: "2026-08-15T14:02:11Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Evergreen Requisition > 180 Days", value: -40 },
      { label: "Repost Frequency Penalty (3 cycles)", value: -25 },
      { label: "No Recruiter Activity Signal", value: -13 },
    ],
    evidence: mkEvidence("Snowflake", "Lever"),
  },
  {
    id: "hl-8523",
    caseId: "CASE #HL-8523",
    title: "Machine Learning Engineer, Ranking",
    company: "Airbnb",
    location: "San Francisco, CA",
    salary: "$205,000 – $250,000",
    daysActive: 31,
    score: 74,
    platforms: [
      { ats: "Greenhouse", status: "ACTIVE" },
      { ats: "LinkedIn", status: "ACTIVE" },
      { ats: "Indeed", status: "CLOSED" },
    ],
    capturedAt: "2026-08-15T14:02:11Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Mirror Desync (Indeed Closed)", value: -14 },
      { label: "Salary Drift 11%", value: -12 },
    ],
    evidence: mkEvidence("Airbnb", "Greenhouse"),
  },
  {
    id: "hl-8536",
    caseId: "CASE #HL-8536",
    title: "Technical Recruiter, Platform Orgs",
    company: "Databricks",
    location: "Remote — EMEA",
    salary: "£78,000 – £96,000",
    daysActive: 158,
    score: 41,
    platforms: [
      { ats: "Greenhouse", status: "REPOSTED" },
      { ats: "LinkedIn", status: "ACTIVE" },
    ],
    capturedAt: "2026-08-15T14:02:11Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Repost Frequency Penalty (-15 per cycle)", value: -30 },
      { label: "Pipeline-Building Language Detected", value: -18 },
      { label: "Req ID Recycled", value: -11 },
    ],
    evidence: mkEvidence("Databricks", "Greenhouse"),
  },
  {
    id: "hl-8548",
    caseId: "CASE #HL-8548",
    title: "Senior Product Designer, Growth",
    company: "Notion",
    location: "New York, NY — Hybrid",
    salary: "$168,000 – $198,000",
    daysActive: 6,
    score: 96,
    platforms: [
      { ats: "Greenhouse", status: "ACTIVE" },
      { ats: "LinkedIn", status: "ACTIVE" },
    ],
    capturedAt: "2026-08-15T14:02:11Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Board Latency Variance", value: -4 },
    ],
    evidence: mkEvidence("Notion", "Greenhouse"),
  },
  {
    id: "hl-8559",
    caseId: "CASE #HL-8559",
    title: "Site Reliability Engineer II",
    company: "Twilio",
    location: "Remote — US",
    salary: "$172,000 – $205,000",
    daysActive: 96,
    score: 58,
    platforms: [
      { ats: "Lever", status: "ACTIVE" },
      { ats: "Indeed", status: "REPOSTED" },
      { ats: "LinkedIn", status: "CLOSED" },
    ],
    capturedAt: "2026-08-15T14:02:11Z",
    deductions: [
      { label: "Base Score", value: 100 },
      { label: "Cross-Source Status Conflict", value: -26 },
      { label: "Days Active > 90", value: -16 },
    ],
    evidence: mkEvidence("Twilio", "Lever"),
  },
];

export const ALL_JOBS: JobCase[] = [...JOBS, ...EXTRA_JOBS];

/* Recent audit feed — compact lower telemetry table on the radar page */
export const AUDIT_FEED = [
  { ts: "14:02:11Z", case: "HL-8491", actor: "GREENHOUSE", event: "SNAPSHOT DIFF", delta: "-35", verdict: "GHOST" },
  { ts: "14:01:58Z", case: "HL-8548", actor: "LINKEDIN", event: "FIRST INDEX", delta: "-4", verdict: "LEGIT" },
  { ts: "14:01:44Z", case: "HL-8514", actor: "LEVER", event: "REPOST LOOP", delta: "-25", verdict: "GHOST" },
  { ts: "14:01:20Z", case: "HL-8523", actor: "INDEED", event: "MIRROR DESYNC", delta: "-14", verdict: "SUSPECT" },
  { ts: "14:00:57Z", case: "HL-8502", actor: "GREENHOUSE", event: "SALARY VERIFY", delta: "0", verdict: "LEGIT" },
  { ts: "14:00:33Z", case: "HL-8536", actor: "LINKEDIN", event: "REQ ID RECYCLE", delta: "-11", verdict: "GHOST" },
  { ts: "14:00:09Z", case: "HL-8559", actor: "LEVER", event: "STATUS CONFLICT", delta: "-26", verdict: "SUSPECT" },
  { ts: "13:59:41Z", case: "HL-8472", actor: "INDEED", event: "CLOSURE DETECTED", delta: "0", verdict: "CLOSED" },
];

/* 90-day turnover timeline generator (deterministic per company) */
export type TurnoverWeek = {
  label: string;
  posted: number;
  closed: number;
  ghostFlags: number;
};

export function turnoverTimeline(seed: string): TurnoverWeek[] {
  const base = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 13 }, (_, i) => {
    const day = 90 - i * 7;
    return {
      label: `D-${day}`,
      posted: 2 + ((base + i * 17) % 9),
      closed: 1 + ((base + i * 29) % 6),
      ghostFlags: (base + i * 41) % 5,
    };
  });
}

/* Streaming execution log lines for the health console */
export const STREAM_LINES = [
  { lvl: "INFO", src: "greenhouse", msg: "fetch board=stripe status=200 rows=412 ms=884" },
  { lvl: "INFO", src: "lever", msg: "fetch board=coinbase status=200 rows=96 ms=612" },
  { lvl: "WARN", src: "linkedin", msg: "rate limit soft-throttle applied backoff=2400ms" },
  { lvl: "INFO", src: "indeed", msg: "normalize salary_band currency=USD parsed=1204" },
  { lvl: "INFO", src: "diff", msg: "cross-source conflict HL-8491 gh=ACTIVE li=CLOSED" },
  { lvl: "ERROR", src: "greenhouse", msg: "selector '.job_title h1' returned 0 nodes (DOM drift)" },
  { lvl: "INFO", src: "scheduler", msg: "sweep 08-15 partition 3/8 committed" },
  { lvl: "INFO", src: "diff", msg: "repost loop detected HL-8514 cycles=3" },
  { lvl: "WARN", src: "indeed", msg: "duplicate req_id collision merged=7" },
  { lvl: "INFO", src: "lever", msg: "checkpoint flush offset=188320 lag=0ms" },
  { lvl: "INFO", src: "linkedin", msg: "captcha probe clean session=warm" },
  { lvl: "INFO", src: "scheduler", msg: "next sweep armed t+00:04:00" },
];
