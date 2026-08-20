import React from 'react';
import { DollarSign, Calendar, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { JobListing } from '../types';
import { getScoreBand } from '../utils/scoreBands';
import { formatCompensation } from '../lib/utils';

interface JobCardProps {
  listing: JobListing;
  onSelect: (listing: JobListing) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ listing, onSelect }) => {
  const scoreInfo = getScoreBand(listing.score);
  const salaryString = formatCompensation(listing.salaryMin, listing.salaryMax);
  const activeSources = listing.sources.map((s) => s.toLowerCase());
  const cleanId = (listing.normalized_id || '8491').replace(/^.*_l_|^hl-|^case-?/i, '').slice(0, 12).toUpperCase();

  const platforms = [
    { id: 'careers', name: 'Careers' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'indeed', name: 'Indeed' },
  ];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={() => onSelect(listing)}
      className="bezel-container cursor-pointer group h-full flex flex-col justify-between"
    >
      <div className="bezel-surface p-6 sm:p-7 flex flex-col justify-between h-full border border-primary/10 shadow-sm group-hover:bg-white transition-colors">
        
        <div>
          {/* 1-Line Condensed Dossier Header */}
          <div className="flex items-center justify-between gap-2 border-b border-primary/10 pb-3 mb-4">
            <span className="font-mono text-[11px] font-bold text-primary max-w-[75%] truncate uppercase tracking-wider">
              DOSSIER #HL-{cleanId} <span className="opacity-40">//</span> {listing.company.toUpperCase()}
            </span>
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-legit shrink-0 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-legit animate-pulse" /> LIVE
            </span>
          </div>

          <div className="space-y-1.5 min-w-0">
            <h3 className="font-display text-2xl sm:text-3xl text-primary uppercase tracking-wide leading-tight line-clamp-2">
              {listing.title}
            </h3>
          </div>

          {/* Metrics Row: Score Pill & Compensation */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-dotted border-primary/15">
            <div className="flex items-center space-x-1.5 font-mono text-xs text-primary/80">
              <DollarSign className="w-3.5 h-3.5 text-primary/60" />
              <span>{salaryString}</span>
            </div>

            <div className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold shrink-0 flex items-center space-x-1 shadow-sm ${scoreInfo.badgeStyle}`}>
              <span>{listing.score}/100</span>
            </div>
          </div>

          {/* Sources breakdown */}
          <div className="mt-4 flex items-center space-x-1.5">
            {platforms.map((p) => {
              const isVerified = activeSources.some((s) => s.includes(p.id) || (p.id === 'careers' && s.includes('greenhouse')));
              return (
                <span
                  key={p.id}
                  className={`font-mono text-[9px] px-2 py-0.5 rounded uppercase tracking-wider border ${
                    isVerified
                      ? 'bg-legit/10 text-legit border-legit/30 font-bold'
                      : 'bg-primary/5 text-primary/40 border-primary/10'
                  }`}
                >
                  {p.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Button: Aligned to bottom baseline */}
        <div className="mt-auto pt-5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(listing);
            }}
            className="w-full bg-primary/5 group-hover:bg-primary group-hover:text-chalk text-primary font-mono text-xs font-bold py-2.5 px-4 rounded-full uppercase tracking-wider transition-all flex items-center justify-between"
          >
            <span>[ Open Case File ↗ ]</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </motion.div>
  );
};
