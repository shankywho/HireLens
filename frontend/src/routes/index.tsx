import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Shell } from "@/components/hirelens/Shell";
import { JobCaseCard } from "@/components/hirelens/JobCaseCard";
import { EvidenceDrawer } from "@/components/hirelens/EvidenceDrawer";
import { ATS_LIST, AUDIT_FEED } from "@/lib/hirelens-data";
import { useJobListings } from "@/hooks/useJobListings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HireLens — Ghost Job Radar & Hiring Receipts" },
      {
        name: "description",
        content:
          "Audit job listings for ghost-job risk with itemized scoring receipts, repost loops, and cross-source status conflicts.",
      },
      { property: "og:title", content: "HireLens — Ghost Job Radar" },
      {
        property: "og:description",
        content: "Exposing ghost jobs with receipts: repost loops, salary drift, cross-source conflicts.",
      },
    ],
  }),
  component: JobRadar,
});

const STATS = [
  { label: "Total Audited", value: "1,420", badge: "LIVE TELEMETRY" },
  { label: "Ghost Job Rate", value: "34.2%", badge: "DELTA 24H: +4.2%" },
  { label: "Repost Loops", value: "189", badge: "SWEEP 08-15" },
  { label: "Active Sweeps", value: "4", badge: "ALL COLLECTORS UP" },
];

const HERO_TAGS = [
  "SWEEP 08-15 / 14:02:11Z",
  "4 COLLECTORS ONLINE",
  "1,420 LISTINGS PARSED",
  "CROSS-SOURCE DIFF: ON",
];

function JobRadar() {
  const {
    jobs,
    filteredJobs,
    visibleJobs,
    query,
    setQuery,
    selectedAts,
    toggleAts,
    minScore,
    setMinScore,
    activeJob,
    setActiveJob,
    isLive,
    hasMore,
    loadMore,
  } = useJobListings(9);

  return (
    <Shell>
      <section className="hl-frame hl-shadow grid gap-6 px-5 py-8 md:grid-cols-[1fr_auto] md:items-end md:px-8 md:py-12">
        <div>
          <p className="hl-mono flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="hl-led text-legit" />
            OSINT Intelligence Terminal / Sweep 08-15
          </p>
          <h1 className="hl-title mt-3 text-[2.6rem] leading-[0.86] md:text-[4.6rem]">
            Exposing Ghost
            <br />
            Jobs With <span className="text-ember">Receipts</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Every listing is cross-checked against four collectors. Every score is an itemized
            deduction you can audit line by line.
          </p>
        </div>
        <ul className="flex flex-wrap gap-1.5 md:max-w-[220px] md:flex-col md:items-end">
          {HERO_TAGS.map((t) => (
            <li
              key={t}
              className="hl-mono border border-ink bg-paper px-2 py-1 text-[9px] uppercase tracking-[0.14em]"
            >
              {t}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="hl-press relative border border-ink bg-ember px-4 py-5 text-ember-foreground"
          >
            <span className="hl-mono absolute right-3 top-3 border border-ember-foreground/50 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] opacity-90">
              {s.badge}
            </span>
            <p className="hl-mono text-[10px] uppercase tracking-[0.18em]">{s.label}</p>
            <p className="hl-mono mt-8 text-[2.6rem] font-bold leading-none tracking-tight">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <section className="hl-frame mt-4 p-4">
        <p className="hl-mono mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Filter HUD
        </p>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-2 border border-ink bg-paper px-3 py-2">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH ROLE OR COMPANY…"
              className="hl-mono w-full bg-transparent text-[12px] uppercase tracking-[0.08em] outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ATS_LIST.map((a) => {
              const on = selectedAts.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => toggleAts(a)}
                  className={`hl-mono hl-press-flat border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    on
                      ? "bg-[#070607] text-[#E2E2DF] border-[#070607]"
                      : "bg-transparent text-[#070607] border-[#070607] hover:bg-[#070607]/10"
                  }`}
                >
                  {on ? "▪ " : "▫ "}
                  {a.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-ink pt-4">
          <span className="hl-mono whitespace-nowrap text-[11px] uppercase tracking-[0.14em]">
            Min Score
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            aria-label="Minimum authenticity score"
            className="h-1 w-full appearance-none bg-ink accent-[var(--ember)]"
          />
          <span className="hl-mono w-16 text-right text-[13px]">{minScore} / 100</span>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <p className="hl-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Matching {filteredJobs.length} of {jobs.length} Dossiers · showing {visibleJobs.length}
        </p>
        <p className="hl-mono flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="hl-led text-legit" /> {isLive ? "telemetry live (connected)" : "feed standby"}
        </p>
      </div>

      <div
        className={`mt-3 grid gap-4 ${
          visibleJobs.length === 1
            ? "grid-cols-1 max-w-lg mx-auto"
            : visibleJobs.length === 2
              ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
              : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {visibleJobs.map((j) => (
          <JobCaseCard key={j.id} job={j} onOpen={setActiveJob} />
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="hl-frame mt-3 border border-ink bg-card px-4 py-12 text-center">
          <p className="hl-mono text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
            No case files match your active filters
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Try adjusting your search query, ATS platform selections, or lowering the minimum score threshold.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setMinScore(0);
            }}
            className="hl-mono hl-press-flat mt-4 border border-ink bg-paper px-4 py-2 text-[11px] uppercase tracking-[0.14em] hover:bg-ink hover:text-background"
          >
            [ Reset All Filters ]
          </button>
        </div>
      )}

      {hasMore && (
        <button
          onClick={loadMore}
          className="hl-mono hl-press-flat mt-4 w-full border border-ink bg-card px-4 py-3 text-[11px] uppercase tracking-[0.16em] hover:bg-ink hover:text-background"
        >
          [ Load Next {Math.min(6, filteredJobs.length - visibleJobs.length)} Case Files ↓ ]
        </button>
      )}

      <section className="hl-frame hl-shadow mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink px-4 py-3">
          <h2 className="hl-title text-sm">Recent Audit Feed</h2>
          <span className="hl-mono flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="hl-led text-ember" /> streaming · sweep 08-15
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="hl-mono w-full min-w-[680px] text-[12px]">
            <thead>
              <tr className="border-b border-ink bg-limestone text-left uppercase tracking-[0.12em]">
                <th className="px-4 py-2 font-normal">TS</th>
                <th className="px-4 py-2 font-normal">Case</th>
                <th className="px-4 py-2 font-normal">Collector</th>
                <th className="px-4 py-2 font-normal">Event</th>
                <th className="px-4 py-2 text-right font-normal">Δ Score</th>
                <th className="px-4 py-2 font-normal">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_FEED.map((r) => (
                <tr key={r.ts} className="border-b border-ink transition-colors last:border-b-0 hover:bg-ink/5">
                  <td className="px-4 py-2 text-muted-foreground">{r.ts}</td>
                  <td className="px-4 py-2">{r.case}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.actor}</td>
                  <td className="px-4 py-2">{r.event}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${r.delta === "0" ? "" : "text-ember"}`}>
                    {r.delta}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                        r.verdict === "GHOST"
                          ? "border-ink bg-ember text-ember-foreground"
                          : r.verdict === "LEGIT"
                            ? "border-legit bg-legit/10 text-legit"
                            : r.verdict === "SUSPECT"
                              ? "border-ink bg-amber text-ink"
                              : "border-ink bg-ink text-background"
                      }`}
                    >
                      {r.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <EvidenceDrawer job={activeJob} onClose={() => setActiveJob(null)} />
    </Shell>
  );
}
