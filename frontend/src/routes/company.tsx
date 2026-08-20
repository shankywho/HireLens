import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, ArrowUpRight, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Shell } from "@/components/hirelens/Shell";
import { turnoverTimeline, type Dossier } from "@/lib/hirelens-data";
import { useCompanyDossier } from "@/hooks/useCompanyDossier";
import { generateBarcodePattern } from "@/domain/formatting";

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "Company OSINT Signals — HireLens" },
      {
        name: "description",
        content:
          "Hiring authenticity dossiers per company: role lifespan, repost loop rate, and LinkedIn vs career-portal discrepancy matrix.",
      },
      { property: "og:title", content: "Company OSINT Signals — HireLens" },
      {
        property: "og:description",
        content: "Per-company hiring authenticity grades and listing discrepancy matrices.",
      },
    ],
  }),
  component: CompanySignals,
});

type Row = Dossier["matrix"][number];

function Barcode({ seed }: { seed: string }) {
  const bars = generateBarcodePattern(seed, 44);
  return (
    <div className="flex h-8 items-end gap-[2px]" aria-hidden>
      {bars.map((w, i) => (
        <span key={i} className="block h-full bg-ink" style={{ width: `${w}px` }} />
      ))}
    </div>
  );
}

// Historical numerical trends per company for distinct sparklines
const SPARK_SERIES: Record<string, { lifespan: number[]; repost: number[]; consistency: number[] }> = {
  Figma: {
    lifespan: [8, 7, 6, 7, 6, 5, 6, 6, 5, 6, 7, 6],
    repost: [5, 4, 3, 4, 3, 3, 2, 3, 4, 3, 3, 3],
    consistency: [95, 96, 97, 96, 97, 98, 98, 97, 98, 98, 98, 98],
  },
  Stripe: {
    lifespan: [12, 14, 15, 13, 16, 14, 15, 13, 14, 15, 14, 14],
    repost: [14, 16, 17, 19, 18, 17, 18, 20, 19, 18, 17, 18],
    consistency: [84, 82, 80, 79, 81, 78, 77, 79, 78, 77, 78, 78],
  },
  DoorDash: {
    lifespan: [35, 38, 42, 45, 40, 44, 49, 46, 50, 47, 48, 48],
    repost: [22, 25, 28, 30, 27, 31, 35, 33, 34, 31, 33, 32],
    consistency: [68, 65, 62, 59, 61, 57, 52, 55, 53, 56, 54, 54],
  },
  Coinbase: {
    lifespan: [60, 68, 75, 80, 84, 89, 95, 91, 98, 102, 94, 92],
    repost: [28, 32, 35, 39, 41, 46, 48, 45, 49, 47, 45, 44],
    consistency: [45, 40, 36, 33, 30, 26, 22, 25, 20, 22, 23, 24],
  },
  Linear: {
    lifespan: [40, 45, 48, 50, 52, 55, 58, 52, 54, 52, 52, 52],
    repost: [15, 20, 25, 30, 35, 40, 45, 45, 45, 45, 45, 45],
    consistency: [70, 60, 50, 40, 35, 30, 25, 20, 20, 20, 20, 20],
  },
};

function DynamicSparkline({ data, tone }: { data: number[]; tone: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 24;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="mt-3 h-9 w-full">
      <polyline points={pts} fill="none" stroke={tone} strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function GradeRing({ value }: { value: number }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const strokeColor = value >= 85 ? "#059669" : value >= 70 ? "#EAB308" : "#FC5000";

  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
}

function CompanySignals() {
  const {
    companyName,
    setCompanyName,
    availableCompanies,
    dossier: baseD,
    liveCompanyData,
  } = useCompanyDossier("Figma");

  const [diffRow, setDiffRow] = useState<Row | null>(null);

  const lifespan = liveCompanyData?.avgListingLifespanDays
    ? `${liveCompanyData.avgListingLifespanDays} Days`
    : baseD.lifespan;

  const repostRate =
    liveCompanyData?.repostRatePercent !== undefined && liveCompanyData?.repostRatePercent !== null
      ? `${liveCompanyData.repostRatePercent}%`
      : baseD.repostRate;

  const consistencyRate =
    liveCompanyData?.consistencyRatePercent !== undefined &&
    liveCompanyData?.consistencyRatePercent !== null &&
    liveCompanyData?.consistencyRatePercent > 0
      ? `${liveCompanyData.consistencyRatePercent}%`
      : baseD.consistency;

  const consistency = Number(consistencyRate.replace("%", ""));
  const phantoms = baseD.matrix.filter((r) => r.verdict !== "MATCH").length;

  const grade = baseD.grade;
  const ghostRiskLabel =
    consistency >= 90 ? "MINIMAL" : consistency >= 70 ? "MODERATE" : consistency >= 50 ? "ELEVATED" : "SEVERE";

  const companySparks = SPARK_SERIES[baseD.name] || SPARK_SERIES.Linear || SPARK_SERIES.Figma;

  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-2">
        {availableCompanies.map((cName) => (
          <button
            key={cName}
            onClick={() => {
              setCompanyName(cName);
              setDiffRow(null);
            }}
            className={`hl-mono hl-press-flat border border-ink px-4 py-2 text-[12px] font-bold uppercase tracking-[0.14em] transition-colors ${
              cName.toLowerCase() === companyName.toLowerCase()
                ? "bg-[#070607] text-[#E2E2DF] border-[#070607]"
                : "bg-card text-[#070607] hover:bg-limestone"
            }`}
          >
            {cName}
          </button>
        ))}
      </div>

      <section className="hl-frame hl-shadow mt-4 flex flex-wrap items-end justify-between gap-6 px-5 py-6">
        <div>
          <p className="hl-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Target Dossier
          </p>
          <h1 className="hl-title mt-2 text-4xl leading-none md:text-5xl">{baseD.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="hl-mono flex items-center gap-1 border border-ink px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">
              <ShieldCheck className="h-3 w-3" /> VERIFIED ATS · {baseD.ats.toUpperCase()}
            </span>
            <span className="hl-mono border border-ink px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">
              {liveCompanyData?.listings?.length ? `${liveCompanyData.listings.length} MONITORED` : `${baseD.openReqs} OPEN REQS`}
            </span>
            <span className="hl-mono flex items-center gap-1.5 border border-ink bg-indigo-ink px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-violet-foreground">
              <span className="hl-led text-legit-bright" /> TELEMETRY LIVE
            </span>
          </div>
          <div className="mt-4">
            <Barcode seed={baseD.name + baseD.ats} />
            <p className="hl-mono mt-1 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              HL-{baseD.name.toUpperCase()}-{baseD.ats.toUpperCase()}-2026
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 border border-ink bg-ink px-6 py-4 text-background">
          <GradeRing value={consistency} />
          <div>
            <p className="hl-mono text-[10px] uppercase tracking-[0.18em]">Authenticity Grade</p>
            <p className="hl-title text-5xl leading-none">{grade}</p>
            <p className="hl-mono mt-2 text-[10px] uppercase tracking-[0.12em] opacity-80">
              GHOST RISK: {ghostRiskLabel}
            </p>
            <p className="hl-mono text-[10px] uppercase tracking-[0.12em] opacity-80">
              ATS DRIFT: {phantoms} ROLES
            </p>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="hl-press border border-ink bg-card p-5">
          <p className="hl-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Avg Role Lifespan
          </p>
          <p className="hl-mono mt-2 text-3xl font-bold">{lifespan}</p>
          <DynamicSparkline data={companySparks.lifespan} tone="#070607" />
          <p className="hl-mono mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            12-WEEK TRAILING AVG
          </p>
        </div>
        <div className="hl-press border border-ink bg-card p-5">
          <p className="hl-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Repost Loop Rate
          </p>
          <p className="hl-mono mt-2 text-3xl font-bold text-ember">{repostRate}</p>
          <DynamicSparkline data={companySparks.repost} tone="#FC5000" />
          <p className="hl-mono mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            REPOST VELOCITY: +3.2%
          </p>
        </div>
        <div className="hl-press border border-ink bg-card p-5">
          <p className="hl-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Source Agreement
          </p>
          <p className="hl-mono mt-2 text-3xl font-bold text-legit-bright">{consistencyRate}</p>
          <DynamicSparkline data={companySparks.consistency} tone="#059669" />
          <p className="hl-mono mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            ATS ↔ AGGREGATOR SYNC
          </p>
        </div>
      </div>

      <section className="hl-frame hl-shadow mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink px-5 py-4">
          <div>
            <h2 className="hl-title text-base">Requisition Discrepancy Matrix</h2>
            <p className="hl-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Cross-referencing LinkedIn index against primary ATS portal
            </p>
          </div>
          <span className="hl-mono border border-ink bg-paper px-2 py-1 text-[10px] uppercase tracking-[0.14em]">
            DIFF ENGINE ACTIVE
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="hl-mono w-full min-w-[640px] text-[12px]">
            <thead>
              <tr className="border-b border-ink bg-limestone text-left uppercase tracking-[0.14em]">
                <th className="px-4 py-3 font-normal">Requisition Title</th>
                <th className="px-4 py-3 font-normal">LinkedIn Feed</th>
                <th className="px-4 py-3 font-normal">Career Portal</th>
                <th className="px-4 py-3 font-normal">Audit Verdict</th>
                <th className="px-4 py-3 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {baseD.matrix.map((r, i) => (
                <tr key={i} className="border-b border-ink transition-colors last:border-b-0 hover:bg-ink/5">
                  <td className="px-4 py-3 font-medium">{r.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block border px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] ${
                        r.linkedin === "LISTED"
                          ? "border-legit bg-legit/10 text-legit"
                          : "border-ember bg-ember/10 text-ember"
                      }`}
                    >
                      {r.linkedin}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block border px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] ${
                        r.portal === "LISTED"
                          ? "border-legit bg-legit/10 text-legit"
                          : "border-ember bg-ember/10 text-ember"
                      }`}
                    >
                      {r.portal}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block border px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] ${
                        r.verdict === "MATCH"
                          ? "border-ink bg-ink text-background"
                          : r.verdict === "PHANTOM"
                            ? "border-ink bg-ember text-ember-foreground"
                            : "border-ink bg-amber text-ink"
                      }`}
                    >
                      {r.verdict}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDiffRow(r)}
                      className="hl-mono border border-ink bg-card px-2 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-background"
                    >
                      [ INSPECT DIFF ]
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hl-frame hl-shadow mt-6 p-5">
        <h2 className="hl-title text-base">90-Day Turnover &amp; Ghosting Velocity</h2>
        <p className="hl-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Weekly aggregate of newly posted vs silently closed vs flagged ghost positions
        </p>
        <div className="mt-4 grid grid-cols-13 gap-1 overflow-x-auto">
          {turnoverTimeline(baseD.name).map((w) => (
            <div key={w.label} className="flex flex-col items-center gap-1 min-w-[40px]">
              <div className="flex h-36 w-full flex-col justify-end gap-1 border border-ink bg-paper p-1">
                <div
                  className="w-full bg-ember"
                  style={{ height: `${w.ghostFlags * 12}px` }}
                  title={`Ghost flags: ${w.ghostFlags}`}
                />
                <div
                  className="w-full bg-ink"
                  style={{ height: `${w.posted * 8}px` }}
                  title={`Posted: ${w.posted}`}
                />
                <div
                  className="w-full bg-muted-foreground/40"
                  style={{ height: `${w.closed * 6}px` }}
                  title={`Closed: ${w.closed}`}
                />
              </div>
              <span className="hl-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {w.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 border-t border-ink pt-3">
          <span className="hl-mono flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em]">
            <span className="h-2 w-2 bg-ink" /> NEWLY POSTED
          </span>
          <span className="hl-mono flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em]">
            <span className="h-2 w-2 bg-muted-foreground/40" /> SILENTLY CLOSED
          </span>
          <span className="hl-mono flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-ember">
            <span className="h-2 w-2 bg-ember" /> FLAGGED GHOST REQ
          </span>
        </div>
      </section>

      {diffRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
          <div className="hl-frame hl-shadow max-w-2xl w-full bg-card p-6 border-2 border-ink">
            <div className="flex items-center justify-between border-b border-ink pb-3">
              <div>
                <span className="hl-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Cross-Platform Audit Inspector
                </span>
                <h3 className="hl-title text-xl mt-1">{diffRow.role}</h3>
              </div>
              <button
                onClick={() => setDiffRow(null)}
                className="border border-ink p-1 hover:bg-ink hover:text-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="border border-ink bg-paper p-3">
                <span className="hl-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Source: LinkedIn Jobs
                </span>
                <p className="hl-mono mt-1 text-sm font-bold">
                  Status: {diffRow.linkedin}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {diffRow.linkedin === "LISTED"
                    ? "Listing active on aggregator. Accepting applications, refreshed 2 days ago."
                    : "No matching requisition found on LinkedIn aggregator mirror."}
                </p>
              </div>

              <div className="border border-ink bg-paper p-3">
                <span className="hl-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Source: {baseD.ats} Portal
                </span>
                <p className="hl-mono mt-1 text-sm font-bold">
                  Status: {diffRow.portal}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {diffRow.portal === "LISTED"
                    ? "Active requisition on primary career board with verified application form."
                    : "Requisition returned 404 or closed status on canonical employer board."}
                </p>
              </div>
            </div>

            <div className="mt-4 border border-ink bg-limestone p-3">
              <div className="flex items-center gap-2">
                {diffRow.verdict === "MATCH" ? (
                  <CheckCircle2 className="h-4 w-4 text-legit-bright" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-ember" />
                )}
                <span className="hl-mono text-[11px] font-bold uppercase tracking-[0.14em]">
                  Audit Verdict: {diffRow.verdict}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {diffRow.verdict === "MATCH"
                  ? "Requisition verified across both channels. High authenticity rating."
                  : diffRow.verdict === "PHANTOM"
                    ? "Aggregator listing exists without corresponding ATS requisition. Likely ghost job retained for candidate pipeline harvesting."
                    : "Requisition marked closed on primary board but aggregator mirror was not purged (stale mirror loop)."}
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDiffRow(null)}
                className="hl-mono hl-press-flat border border-ink bg-ink text-background px-4 py-2 text-[11px] uppercase tracking-[0.14em]"
              >
                [ Dismiss Inspector ]
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
