import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import type { JobCase } from "@/lib/hirelens-data";
import { formatCompensation } from "@/lib/utils";

function Stamp({ score }: { score: number }) {
  const ghost = score <= 45;
  const legit = score >= 80;
  if (ghost) {
    return (
      <span className="hl-stamp shrink-0 border-ink bg-ember px-2.5 py-1 text-[11px] text-ember-foreground">
        {score}/100 Ghost Risk
      </span>
    );
  }
  if (legit) {
    return (
      <span className="hl-stamp shrink-0 border-legit bg-legit/10 px-2.5 py-1 text-[11px] text-legit">
        {score}/100 Verified
      </span>
    );
  }
  return (
    <span className="hl-stamp shrink-0 border-ink bg-amber px-2.5 py-1 text-[11px] text-ink">
      {score}/100 Suspect
    </span>
  );
}

export function JobCaseCard({ job, onOpen }: { job: JobCase; onOpen: (j: JobCase) => void }) {
  const ghost = job.score <= 45;
  const verifiedAts = job.platforms.find((p) => p.ats === "Greenhouse" || p.ats === "Lever");
  const cleanId = (job.id || "8491").replace(/^hl-|^case-?/i, "").slice(0, 12).toUpperCase();
  const formattedSalary = formatCompensation(job.salary);

  return (
    <article className="hl-frame hl-lift flex h-full flex-col justify-between">
      {/* Strictly 1-line condensed header with non-colliding LIVE indicator */}
      <div className="flex items-center justify-between gap-2 border-b border-ink bg-paper px-4 py-2">
        <span className="hl-mono max-w-[75%] truncate text-[10px] uppercase tracking-[0.14em]">
          DOSSIER #HL-{cleanId} <span className="text-muted-foreground">//</span>{" "}
          {verifiedAts ? "VERIFIED-ATS" : "MIRROR-ONLY"}
        </span>
        <span
          className={`hl-mono flex shrink-0 items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] ${
            ghost ? "text-ember" : "text-legit"
          }`}
        >
          <span className="hl-led" /> LIVE
        </span>
      </div>

      <div className="flex flex-1 flex-col px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="hl-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {job.company}
            </p>
            <h3 className="hl-title mt-1 line-clamp-2 text-lg leading-tight">{job.title}</h3>
          </div>
          <Stamp score={job.score} />
        </div>

        <p className="hl-mono mt-3 text-[13px] font-medium">{formattedSalary}</p>
        <div className="hl-mono mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {job.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {job.daysActive} DAYS ACTIVE
          </span>
        </div>

        {/* Source Platform Pills aligned above bottom action */}
        <div className="mt-4 flex flex-wrap border border-ink">
          {job.platforms.map((p, i) => (
            <span
              key={p.ats}
              className={`hl-mono flex-1 whitespace-nowrap px-2 py-1 text-center text-[9px] uppercase tracking-[0.1em] ${
                i > 0 ? "border-l border-ink" : ""
              } ${
                p.status === "ACTIVE"
                  ? "bg-legit/12 text-legit"
                  : p.status === "CLOSED"
                    ? "bg-ink text-background"
                    : "bg-ember text-ember-foreground"
              }`}
            >
              {p.ats} [{p.status}]
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Action Area aligned strictly to uniform baseline */}
      <div className="mt-auto">
        <button
          onClick={() => onOpen(job)}
          className="hl-mono flex w-full items-center justify-between border-t border-ink px-4 py-3 text-[11px] uppercase tracking-[0.14em] transition-colors duration-100 hover:bg-ink hover:text-background"
        >
          [ Open Case File ↗ ] <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
