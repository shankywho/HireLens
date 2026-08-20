import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Activity, AlertTriangle, Check, ShieldCheck, FileCode, CheckCircle2, AlertCircle, Layers } from "lucide-react";
import { Shell } from "@/components/hirelens/Shell";
import { COLLECTORS } from "@/lib/hirelens-data";
import { useCollectorHealth } from "@/hooks/useCollectorHealth";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Scraper Health & Break-and-Heal Console — HireLens" },
      {
        name: "description",
        content:
          "Collector telemetry with DOM drift simulation and real Bright Data CLI heal review: inspect diffs and approve fixes.",
      },
      { property: "og:title", content: "Scraper Health Console — HireLens" },
      {
        property: "og:description",
        content: "Collector uptime telemetry and self-healing selector patch review.",
      },
    ],
  }),
  component: HealthConsole,
});

function HealthConsole() {
  const {
    status,
    healed,
    liveCollectors,
    isProcessing,
    errorMessage,
    isLiveCliCall,
    targetMode,
    setTargetMode,
    pendingPatchData,
    logs,
    triggerHeal,
    approveHeal,
  } = useCollectorHealth();

  const logRef = useRef<HTMLDivElement | null>(null);

  // Autoscroll terminal on log updates
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const badge = (s: string) => {
    if (s === "HEALTHY") return "border-legit bg-legit/10 text-legit";
    if (s === "awaiting_approval" || s === "PATCH_READY" || s === "HEALING") return "border-ink bg-amber text-ink font-bold";
    if (s === "INVESTIGATING") return "border-ember bg-ember text-ember-foreground";
    return "border-destructive bg-destructive/20 text-destructive font-bold";
  };
  const LIVE_TARGET_KYC_CLEARED = false;

  return (
    <Shell>
      {/* Hero Header Banner */}
      <section className="hl-shadow border border-ink bg-indigo-ink px-5 py-8 text-violet-foreground md:px-8 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="hl-mono flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]">
            <span className={`hl-led ${status === "HEALTHY" ? "text-legit-bright" : "text-ember"}`} />{" "}
            Scraper Telemetry / {status === "HEALTHY" ? "Uplink Nominal" : status === "awaiting_approval" ? "Patch Awaiting Approval" : "Selector Drift Active"}
          </p>

          {/* Active Mode Indicator Badge */}
          <div className="flex items-center gap-2 border border-violet-foreground/30 bg-violet-foreground/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5" />
            <span>ACTIVE MODE:</span>
            <span className="font-bold text-legit-bright">
              {targetMode === "fixture" ? "DEMO / FIXTURE MODE (/fixture/v1 vs v2)" : "LIVE BRIGHT DATA MODE"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h1 className="hl-title text-3xl leading-[0.9] md:text-[3.4rem]">
            Break-and-Heal
            <br />
            Console
          </h1>

          {/* Equalizer Wave */}
          <div className="flex h-16 items-end gap-1.5" aria-hidden>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
              <span
                key={i}
                className="hl-ping-bar block w-2 rounded-t-xs bg-legit-bright/90"
                style={{
                  height: `${24 + ((i * 37) % 40)}px`,
                  animationDuration: `${600 + ((i * 120) % 500)}ms`,
                  animationDelay: `${(i * 70) % 400}ms`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { l: "Extraction Success", v: status === "HEALTHY" ? "99.4%" : "0.0% (DRIFT)" },
            { l: "Active Collectors", v: status === "HEALTHY" ? "4/4" : "3/4" },
            { l: "Last Sweep", v: "14:02:11Z" },
          ].map((s) => (
            <div key={s.l} className="border border-violet-foreground/40 px-4 py-3">
              <p className="hl-mono text-[10px] uppercase tracking-[0.18em] opacity-80">{s.l}</p>
              <p className="hl-mono mt-1 text-2xl font-bold tracking-tight">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Action Trigger Bar & Target Switcher */}
      <div className="hl-frame hl-shadow mt-4 border border-ink bg-limestone p-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 hl-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="font-bold text-ink">ACTIVE TARGET ENV:</span>
            {targetMode === "fixture" ? (
               <span className="bg-legit/10 text-legit px-2 py-0.5 border border-legit/30 font-bold">Demo Fixture (Safe)</span>
            ) : (
               <span className="bg-ember/10 text-ember px-2 py-0.5 border border-ember/30 font-bold">Production (High Risk)</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTargetMode("fixture")}
              className={`hl-mono px-3.5 py-1.5 uppercase tracking-wider text-[11px] font-bold border transition-colors ${
                targetMode === "fixture"
                  ? "bg-ink text-background border-ink"
                  : "bg-background text-muted-foreground border-ink/30 hover:bg-black/5 hover:text-ink"
              }`}
            >
              [ USE DEMO FIXTURE v1/v2 ]
            </button>
            <button
              onClick={(e) => {
                if (!LIVE_TARGET_KYC_CLEARED) {
                  e.preventDefault();
                  alert("Requires Bright Data KYC approval — pending");
                  return;
                }
                setTargetMode("live");
              }}
              title={!LIVE_TARGET_KYC_CLEARED ? "Requires Bright Data KYC approval — pending" : ""}
              disabled={!LIVE_TARGET_KYC_CLEARED}
              className={`hl-mono px-3.5 py-1.5 uppercase tracking-wider text-[11px] font-bold border transition-colors ${
                !LIVE_TARGET_KYC_CLEARED
                  ? "opacity-50 cursor-not-allowed bg-background text-muted-foreground border-ink/30"
                  : targetMode === "live"
                  ? "bg-ember text-ember-foreground border-ink"
                  : "bg-background text-muted-foreground border-ink/30 hover:bg-ember/10 hover:text-ember hover:border-ember/50"
              }`}
            >
              [ USE LIVE TARGET ]
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2.5">
          <span className="hl-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
             COMMAND: {targetMode === "fixture" ? "SIMULATE DRIFT" : "`bdata scraper heal`"}
          </span>
          <button
            onClick={triggerHeal}
            disabled={status !== "HEALTHY" || isProcessing}
            className="hl-mono hl-press-flat border border-ink bg-amber px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-ink hover:bg-ember hover:text-ember-foreground disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-amber disabled:hover:text-ink disabled:hover:shadow-none"
          >
            {isProcessing
              ? "[ EVALUATING HEAL... ]"
              : targetMode === "fixture"
              ? "[ SIMULATE SELECTOR DRIFT ]"
              : "[ TRIGGER LIVE HEAL ]"}
          </button>
        </div>
      </div>

      {/* Execution Error Banner */}
      {errorMessage && (
        <div className="hl-diff-in mt-4 flex items-center gap-2 border border-destructive bg-destructive/15 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="hl-mono text-[12px] uppercase tracking-[0.12em] font-bold">
            Execution Error: {errorMessage}
          </p>
        </div>
      )}

      {/* Healed Success Notification */}
      {healed && (
        <div className="hl-diff-in mt-4 flex items-center gap-2 border border-legit bg-legit/15 px-4 py-3 text-legit">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <p className="hl-mono text-[12px] uppercase tracking-[0.12em] font-bold">
            ✓ Collector Healed: AST Code Modification Committed &amp; 100% Uptime Restored
          </p>
        </div>
      )}

      {/* Distinct Awaiting Approval State & Accurate Source Labeling */}
      {status === "awaiting_approval" && (
        <section className="hl-frame hl-shadow hl-diff-in mt-6 border-2 border-ink bg-card">
          <div className="flex flex-wrap items-center justify-between border-b-2 border-ink px-5 py-4 bg-amber/10">
            <div className="flex items-center gap-3">
              <FileCode className="h-5 w-5 text-ink" />
              <h2 className="hl-title text-base uppercase tracking-wider text-ink">
                {isLiveCliCall
                  ? "BRIGHT DATA SCRAPER STUDIO // SELF-HEAL (TARGET: LIVE)"
                  : "DEMO MODE — SYNTHETIC DATA & FIXTURE DOM (TARGET: FIXTURE)"}
              </h2>
            </div>
            <div className="flex items-center gap-4 mt-3 md:mt-0">
              <span className="hl-mono text-[11px] uppercase tracking-wider font-bold text-legit flex items-center gap-1.5 border border-legit/30 bg-legit/10 px-2 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {pendingPatchData?.completed_steps?.length || 1} {pendingPatchData?.completed_steps?.length === 1 ? 'Step' : 'Steps'} Updated
              </span>
              <span className="hl-mono bg-ink text-background px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]">
                STATUS: AWAITING APPROVAL
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 border-b border-ink/30 px-5 py-2 bg-limestone text-muted-foreground text-[10px] hl-mono uppercase tracking-wider">
            <span>COLLECTOR_ID: <span className="font-bold text-ink">{pendingPatchData?.collector_id || "c_msx28aib1bi38vk8vw"}</span></span>
            {pendingPatchData?.view_url && (
              <span>| PATCH VIEW_URL: <a href={pendingPatchData.view_url} target="_blank" rel="noreferrer" className="font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">View in Bright Data →</a></span>
            )}
          </div>

          <div className="p-5 md:p-7 space-y-6">
            {/* Diff Summary */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col">
                <span className="hl-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-none bg-amber"></span>
                  Operator Diagnostic Prompt (Input)
                </span>
                <div className="hl-mono flex-1 border border-ink bg-amber/5 p-4 text-[12px] shadow-[2px_2px_0px_rgba(0,0,0,1)] text-ink">
                  {pendingPatchData?.prompt || "Update the job title extraction selector to resolve structural drift."}
                </div>
              </div>

              <div className="space-y-2 flex flex-col">
                <span className="hl-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-none bg-legit-bright"></span>
                  Synthesized Patch Summary (Output)
                </span>
                <div className="hl-mono flex-1 border border-ink bg-legit/5 p-4 text-[12px] shadow-[2px_2px_0px_rgba(0,0,0,1)] text-ink leading-relaxed">
                  {(() => {
                    const summary = pendingPatchData?.diff_summary || "Proposed template updated successfully.";
                    if (!summary.includes("view_url") || !pendingPatchData?.view_url) return summary;
                    const parts = summary.split("view_url");
                    return (
                      <>
                        {parts[0]}
                        <a href={pendingPatchData.view_url} target="_blank" rel="noreferrer" className="font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">View in Bright Data →</a>
                        {parts[1]}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Preview Result */}
            {pendingPatchData?.preview_result && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <span className="hl-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-2">
                    <span className="h-1 w-1 bg-ink block" /> Dry-Run Extraction Preview
                  </span>
                  <span className="hl-mono text-[9px] uppercase tracking-wider bg-legit/20 text-legit px-1.5 py-0.5 border border-legit/30 font-bold">
                    Passed
                  </span>
                </div>
                <pre className="hl-mono p-4 bg-ink text-background border border-ink text-[12px] overflow-x-auto shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
                  {typeof pendingPatchData.preview_result === "string"
                    ? pendingPatchData.preview_result
                    : <div dangerouslySetInnerHTML={{
                        __html: JSON.stringify(pendingPatchData.preview_result, null, 2)
                          .replace(/"([^"]+)":/g, '<span class="text-amber/90">"$1"</span>:')
                          .replace(/: "([^"]+)"/g, ': <span class="text-legit-bright">"$1"</span>')
                      }} />}
                </pre>
              </div>
            )}

            {/* Approve Action Footer */}
            <div className="pt-6 mt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-t-2 border-ink border-dashed">
              <div className="flex flex-col gap-1.5 max-w-xl">
                <span className="hl-mono text-[12px] font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Operator Authorization Required
                </span>
                <span className="hl-mono text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                  Deploying this patch will immediately update the production AST for <span className="font-bold text-ink bg-limestone px-1">{targetMode === "live" ? "TARGET: LIVE" : "TARGET: FIXTURE"}</span> and resume the scheduled queue. Irreversible action.
                </span>
              </div>
              <button
                onClick={approveHeal}
                disabled={isProcessing}
                className="hl-mono hl-press-flat border border-ink bg-ember px-8 py-4 text-[13px] font-bold uppercase tracking-[0.14em] text-ember-foreground hover:bg-ink hover:text-white shrink-0 flex items-center justify-center gap-2 shadow-[3px_3px_0px_rgba(0,0,0,1)] w-full md:w-auto"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>{targetMode === "live" ? "[ APPROVE PATCH TO TARGET: LIVE ]" : "[ APPROVE PATCH TO TARGET: FIXTURE ]"}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Investigating State */}
      {status === "INVESTIGATING" && (
        <section className="hl-frame hl-shadow hl-diff-in mt-4 p-6 text-center">
          <p className="hl-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground animate-pulse">
            {targetMode === "live"
              ? "Executing `bdata scraper heal c_msx28aib1bi38vk8vw` and synthesizing AST selector repair…"
              : "Diffing /fixture/v1 vs /fixture/v2 DOM trees and synthesizing AST code modification…"}
          </p>
        </section>
      )}

      {/* Collector Status Cards Grid */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLLECTORS.map((c) => {
          const currentCollectorStatus = c.name === "Greenhouse" ? (status === "awaiting_approval" ? "awaiting_approval" : status) : "HEALTHY";
          const liveMatch = liveCollectors?.find(
            (lc) =>
              lc.sourceType?.toLowerCase() === c.name.toLowerCase() ||
              lc.collectorId?.includes(c.name.toLowerCase())
          );
          const uptime = liveMatch?.uptimePercent !== undefined ? `${liveMatch.uptimePercent}%` : c.uptime;
          const rows = liveMatch?.rowsScraped24h !== undefined
            ? `${liveMatch.rowsScraped24h.toLocaleString()} rows`
            : c.rows;

          const isAlert = c.name === "Greenhouse" && status !== "HEALTHY";

          return (
            <div
              key={c.id}
              className={`hl-frame hl-lift p-4 transition-all ${
                isAlert ? "border-2 border-dashed border-ember bg-amber/10" : ""
              } ${healed && c.name === "Greenhouse" ? "hl-heal-pulse" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="hl-title text-base">{c.name}</h2>
                <span
                  className={`hl-mono flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${badge(
                    currentCollectorStatus
                  )}`}
                >
                  {currentCollectorStatus === "HEALTHY" ? (
                    <span className="hl-led" />
                  ) : (
                    <span className="hl-led text-ink" />
                  )}
                  {currentCollectorStatus === "awaiting_approval" ? "AWAITING APPROVAL" : currentCollectorStatus}
                </span>
              </div>
              <p className="hl-mono mt-2 break-all text-[11px] text-muted-foreground">{c.id}</p>
              <dl className="hl-mono mt-4 space-y-1 text-[12px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">UPTIME</dt>
                  <dd>{currentCollectorStatus === "HEALTHY" ? uptime : "0.0% (DRIFT)"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">ROWS / 24H</dt>
                  <dd>{rows}</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center gap-1.5 border-t border-ink pt-3">
                {currentCollectorStatus === "HEALTHY" ? (
                  <Check className="h-3.5 w-3.5 text-legit" />
                ) : currentCollectorStatus === "INVESTIGATING" ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-ember" />
                ) : currentCollectorStatus === "awaiting_approval" ? (
                  <Activity className="h-3.5 w-3.5 text-ink" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                )}
                <span className="hl-mono text-[10px] uppercase tracking-[0.12em] font-medium">
                  {currentCollectorStatus === "HEALTHY"
                    ? "selectors nominal"
                    : currentCollectorStatus === "INVESTIGATING"
                    ? "evaluating heal…"
                    : currentCollectorStatus === "awaiting_approval"
                    ? "awaiting patch approval"
                    : "collector degraded"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Log Console */}
      <section className="hl-frame hl-shadow mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink px-4 py-3 bg-limestone">
          <h2 className="hl-title text-sm">Scraper Execution Stream &amp; Error Log</h2>
          <span className="hl-mono flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="hl-led text-legit" /> tail -f /var/log/hirelens/collectors.log
          </span>
        </div>
        <div
          ref={logRef}
          className="hl-mono hl-scanlines p-4 font-mono text-xs leading-relaxed overflow-y-auto max-h-[240px] bg-ink text-background"
        >
          {logs.map((l) => (
            <p key={l.id} className="hl-diff-in flex gap-3 whitespace-pre-wrap py-0.5">
              <span className="opacity-50 shrink-0">{l.ts}</span>
              <span
                className={`shrink-0 font-bold ${
                  l.lvl === "ERROR"
                    ? "text-ember"
                    : l.lvl === "WARN"
                    ? "text-amber"
                    : "text-legit-bright"
                }`}
              >
                [{l.lvl}]
              </span>
              <span className="opacity-60 shrink-0">{l.src}</span>
              <span className="flex-1">{l.msg}</span>
            </p>
          ))}
          <p className="hl-mono mt-1 text-legit-bright flex items-center gap-1.5">
            <span className="inline-block h-3 w-1.5 bg-legit-bright animate-pulse" />
            <span className="opacity-60">awaiting next telemetry partition…</span>
          </p>
        </div>
      </section>
    </Shell>
  );
}
