import React from 'react';
import { ArrowUpRight, ShieldAlert, Layers, Database, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroBannerProps {
  onAuditClick?: () => void;
  onScraperHealthClick?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onAuditClick,
  onScraperHealthClick,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Main Architectural Hero Surface */}
      <div className="bezel-container">
        <div className="bezel-surface p-8 sm:p-12 lg:p-14 space-y-8 border border-obsidian/10 shadow-[0_4px_24px_rgba(7,6,7,0.03)]">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl text-obsidian tracking-wide uppercase leading-none">
                EXPOSING GHOST JOBS WITH RECEIPTS
              </h1>

              <p className="font-sans font-medium text-obsidian/75 text-base sm:text-lg max-w-2xl leading-relaxed">
                HireLens cross-audits open engineering roles across Greenhouse, Lever, LinkedIn, and Indeed to surface status conflicts, repost loops, and multi-source salary discrepancies.
              </p>
            </div>

            {/* Interactive Action Island */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              <button
                onClick={onAuditClick}
                className="group bg-ember text-chalk pl-6 pr-2 py-2 rounded-full font-sans font-bold text-sm uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all flex items-center space-x-3 shadow-sm"
              >
                <span>Trigger Live Audit</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-4 h-4 text-chalk" />
                </div>
              </button>

              <button
                onClick={onScraperHealthClick}
                className="font-mono text-xs text-obsidian/60 hover:text-ember uppercase tracking-wider transition-colors flex items-center space-x-1.5 pt-1 font-semibold"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Bright Data Scraper Studio</span>
              </button>
            </div>
          </div>

          {/* 4 Feature Metric Tiles: Solid Molten Ember (#fc5000) Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-dotted border-obsidian/25">
            
            {/* Metric Tile 1 */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-ember text-chalk rounded-[24px] p-6 flex flex-col justify-between h-40 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-chalk/90 font-semibold">
                  Roles Audited
                </span>
                <Layers className="w-5 h-5 text-sulfur" />
              </div>
              <div>
                <div className="font-display text-5xl sm:text-6xl text-chalk leading-none">
                  18
                </div>
                <span className="font-mono text-[10px] text-sulfur uppercase tracking-widest block mt-2 font-bold">
                  Cross-Platform Sweeps
                </span>
              </div>
            </motion.div>

            {/* Metric Tile 2 */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-ember text-chalk rounded-[24px] p-6 flex flex-col justify-between h-40 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-chalk/90 font-semibold">
                  Ghost Risk Flags
                </span>
                <ShieldAlert className="w-5 h-5 text-sulfur" />
              </div>
              <div>
                <div className="font-display text-5xl sm:text-6xl text-sulfur leading-none">
                  4
                </div>
                <span className="font-mono text-[10px] text-chalk/90 uppercase tracking-widest block mt-2 font-bold">
                  Status & Repost Loops
                </span>
              </div>
            </motion.div>

            {/* Metric Tile 3 */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-ember text-chalk rounded-[24px] p-6 flex flex-col justify-between h-40 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-chalk/90 font-semibold">
                  Data Sources
                </span>
                <Database className="w-5 h-5 text-sulfur" />
              </div>
              <div>
                <div className="font-display text-5xl sm:text-6xl text-chalk leading-none">
                  3
                </div>
                <span className="font-mono text-[10px] text-sulfur uppercase tracking-widest block mt-2 font-bold">
                  Greenhouse · LI · Indeed
                </span>
              </div>
            </motion.div>

            {/* Metric Tile 4 */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-ember text-chalk rounded-[24px] p-6 flex flex-col justify-between h-40 shadow-sm cursor-pointer"
              onClick={onScraperHealthClick}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-chalk/90 font-semibold">
                  Scraper Engine
                </span>
                <Activity className="w-5 h-5 text-sulfur" />
              </div>
              <div>
                <div className="font-display text-4xl sm:text-5xl text-chalk leading-tight">
                  SELF-HEALING
                </div>
                <span className="font-mono text-[10px] text-sulfur uppercase tracking-widest block mt-2 font-bold">
                  Bright Data Control Active
                </span>
              </div>
            </motion.div>

          </div>

        </div>
      </div>

    </div>
  );
};
