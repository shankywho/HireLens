import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Radar, Activity, ExternalLink } from "lucide-react";
import { fetchLiveCollectors } from "@/services/api";
import { COLLECTORS } from "@/lib/hirelens-data";

export function Footer() {
  const [collectors, setCollectors] = useState<any[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadTelemetry = async () => {
      try {
        const data = await fetchLiveCollectors();
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          setCollectors(data);
        }
      } catch (err) {
        console.warn("[Footer] Could not poll live collector telemetry:", err);
      }
    };

    loadTelemetry();
    const interval = setInterval(loadTelemetry, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute live system metrics or fall back to baseline static collector data
  const totalCollectors = collectors ? collectors.length : COLLECTORS.length;
  const onlineCollectors = collectors
    ? collectors.filter(
        (c) =>
          c.status === "HEALTHY" ||
          c.status === "awaiting_approval" ||
          c.status === "PATCH_READY"
      ).length
    : 4;

  const uptimeStr = collectors && collectors.length > 0
    ? `${(
        collectors.reduce((acc, c) => acc + (c.uptimePercent ?? 99.8), 0) /
        collectors.length
      ).toFixed(1)}%`
    : "99.8%";

  // Find most recent lastRunAt timestamp or use synced indicator
  const latestRun = collectors
    ?.map((c) => (c.lastRunAt ? new Date(c.lastRunAt).getTime() : 0))
    .sort((a, b) => b - a)[0];

  const lastSweepText = latestRun && latestRun > 0
    ? `${new Date(latestRun).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })} UTC`
    : "SYNCED (T-0s)";

  return (
    <footer className="border-t border-ink bg-ink text-background">
      <div className="mx-auto max-w-[1240px] px-4 pt-10 pb-6">
        {/* Main 4-column layout */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Column 1: Brand & Tagline */}
          <div className="flex flex-col">
            <Link to="/" className="group flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center border border-background bg-background text-ink transition-transform group-hover:scale-105">
                <Radar className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="hl-title text-xl leading-none text-background">
                  HireLens
                </span>
                <span className="hl-mono mt-1 text-[9px] uppercase tracking-[0.22em] text-background/60">
                  Ghost Job Radar / OSINT
                </span>
              </span>
            </Link>
            <p className="hl-mono mt-3 max-w-[260px] text-[11px] leading-relaxed text-background/70">
              Autonomous OSINT hiring intelligence exposing ghost requisitions,
              repost churn loops, and selector drift across enterprise ATS boards.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="hl-mono inline-flex items-center gap-1.5 border border-background/20 bg-background/5 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-legit-bright">
                <span className="hl-led text-legit-bright" />
                SYSTEM OPERATIONAL
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="flex flex-col">
            <h4 className="hl-mono mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ember">
              [ 01 // NAVIGATION ]
            </h4>
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                className="hl-mono group flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-background/80 transition-colors hover:text-ember"
              >
                <span className="text-background/40 transition-transform group-hover:translate-x-0.5 group-hover:text-ember">
                  →
                </span>
                Job Radar
              </Link>
              <Link
                to="/company"
                className="hl-mono group flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-background/80 transition-colors hover:text-ember"
              >
                <span className="text-background/40 transition-transform group-hover:translate-x-0.5 group-hover:text-ember">
                  →
                </span>
                Company Signals
              </Link>
              <Link
                to="/health"
                className="hl-mono group flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-background/80 transition-colors hover:text-ember"
              >
                <span className="text-background/40 transition-transform group-hover:translate-x-0.5 group-hover:text-ember">
                  →
                </span>
                Scraper Health
              </Link>
            </nav>
          </div>

          {/* Column 3: System Telemetry */}
          <div className="flex flex-col">
            <h4 className="hl-mono mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-legit-bright">
              [ 02 // SYSTEM ]
            </h4>
            <div className="flex flex-col space-y-2.5">
              <div className="flex items-center justify-between border-b border-background/10 pb-1.5">
                <span className="hl-mono text-[10px] uppercase tracking-[0.14em] text-background/60">
                  Collectors Online
                </span>
                <span className="hl-mono flex items-center gap-1.5 text-[11px] font-bold uppercase text-legit-bright">
                  <span className="h-1.5 w-1.5 rounded-full bg-legit-bright animate-pulse" />
                  {onlineCollectors}/{totalCollectors} ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-background/10 pb-1.5">
                <span className="hl-mono text-[10px] uppercase tracking-[0.14em] text-background/60">
                  Overall Uptime
                </span>
                <span className="hl-mono text-[11px] font-bold uppercase text-background">
                  {uptimeStr}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-background/10 pb-1.5">
                <span className="hl-mono text-[10px] uppercase tracking-[0.14em] text-background/60">
                  Last Sweep
                </span>
                <span className="hl-mono text-[11px] font-bold uppercase text-background/90">
                  {lastSweepText}
                </span>
              </div>
            </div>
          </div>

          {/* Column 4: Built With */}
          <div className="flex flex-col">
            <h4 className="hl-mono mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
              [ 03 // BUILT WITH ]
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="hl-mono inline-flex items-center border border-background/20 bg-background/5 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-background/90 transition-colors hover:border-ember hover:text-ember">
                [ BRIGHT DATA SCRAPER STUDIO ]
              </span>
              <span className="hl-mono inline-flex items-center border border-background/20 bg-background/5 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-background/90 transition-colors hover:border-ember hover:text-ember">
                [ GOOGLE GEMINI 3.6 FLASH ]
              </span>
              <span className="hl-mono inline-flex items-center border border-background/20 bg-background/5 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-background/90 transition-colors hover:border-ember hover:text-ember">
                [ POSTGRESQL // PRISMA ]
              </span>
            </div>
          </div>
        </div>

        {/* Bottom row, full width with hairline border */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-background/15 pt-4">
          <span className="hl-mono flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-background/70">
            <span className="hl-led text-legit-bright" />
            HIRELENS TERMINAL V2.4 — RECEIPTS OR IT DIDN&apos;T HAPPEN
          </span>
          <span className="hl-mono text-[11px] uppercase tracking-[0.14em] text-background/70">
            {totalCollectors} COLLECTORS · 1,420 AUDITS
          </span>
        </div>
      </div>
    </footer>
  );
}
