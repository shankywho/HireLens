import { Link } from "@tanstack/react-router";
import { Radar, Building2, Activity } from "lucide-react";
import type { ReactNode } from "react";
import { TICKER_LOGS } from "@/lib/hirelens-data";
import { Footer } from "./Footer";
import { CustomCursor } from "./CustomCursor";

function Ticker() {
  const items = TICKER_LOGS;
  return (
    <div className="w-screen overflow-hidden border-b border-ink bg-ink py-1.5">
      <div className="flex w-max hl-marquee">
        {[0, 1].map((i) => (
          <div key={i} className="flex whitespace-nowrap">
            {items.map((t, n) => (
              <span
                key={`${i}-${t}`}
                className={`hl-mono px-4 text-[11px] uppercase tracking-[0.16em] ${
                  n % 3 === 1 ? "text-legit-bright" : "text-background"
                }`}
                style={{
                  textShadow:
                    n % 3 === 1
                      ? "0 0 10px color-mix(in oklab, var(--legit-bright) 70%, transparent)"
                      : "0 0 8px color-mix(in oklab, white 45%, transparent)",
                }}
              >
                {t} <span className="opacity-40">•</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV = [
  { to: "/", label: "Job Radar", icon: Radar },
  { to: "/company", label: "Company Signals", icon: Building2 },
  { to: "/health", label: "Scraper Health", icon: Activity },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <CustomCursor />
      <header className="fixed inset-x-0 top-0 z-40">
        <Ticker />
        <div className="border-b border-ink bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link to="/" className="group flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center border border-ink bg-ink text-background">
                <Radar className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="hl-title text-xl leading-none">HireLens</span>
                <span className="hl-mono mt-1 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                  Ghost Job Radar / OSINT
                </span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-stretch border border-ink bg-card">
              {NAV.map(({ to, label, icon: Icon }, i) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  className={`hl-mono relative flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-foreground transition-colors duration-100 hover:bg-paper hover:text-ink ${
                    i > 0 ? "border-l border-ink" : ""
                  }`}
                  activeProps={{
                    className:
                      "!bg-ink !text-background hover:!bg-ink hover:!text-background after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-ember",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 pt-[132px]">{children}</main>
      <Footer />
    </div>
  );
}
