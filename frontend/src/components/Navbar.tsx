import React from 'react';
import { Radar, Building2, Activity, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  activeTab: 'feed' | 'company' | 'health';
  setActiveTab: (tab: 'feed' | 'company' | 'health') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="bg-secondary/95 backdrop-blur-md rounded-full p-2 border border-primary/12 shadow-[0_2px_12px_rgba(7,6,7,0.04)] flex items-center justify-between gap-2">
        {/* Brand Logo & Identifier */}
        <div className="flex items-center space-x-3 pl-3">
          <div className="w-9 h-9 rounded-full bg-accent text-chalk flex items-center justify-center font-display text-2xl tracking-wide shrink-0">
            HL
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-display text-2xl sm:text-3xl text-primary tracking-wide leading-none">
              HIRELENS
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-primary/55 font-semibold">
              OSINT RECON // V2.6
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-primary/70 p-1.5 rounded-full border border-primary/10">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 sm:px-5 py-2 rounded-full font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center space-x-2 ${
              activeTab === 'feed'
                ? 'text-chalk bg-primary shadow-sm'
                : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
            }`}
          >
            <Radar className="w-4 h-4 shrink-0" />
            <span>Job Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 sm:px-5 py-2 rounded-full font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center space-x-2 ${
              activeTab === 'company'
                ? 'text-chalk bg-primary shadow-sm'
                : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Company Signals</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 sm:px-5 py-2 rounded-full font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center space-x-2 ${
              activeTab === 'health'
                ? 'text-chalk bg-primary shadow-sm'
                : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>Scraper Health</span>
          </button>
        </nav>

        {/* Status Chip & CTA */}
        <div className="flex items-center space-x-3 pr-1">
          <button
            onClick={() => setActiveTab('health')}
            className="hidden md:flex items-center space-x-2 bg-caution text-primary px-3.5 py-2 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider border border-primary/10 hover:opacity-90 transition-opacity shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
            <span>3/4 Collectors Live</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className="group bg-accent text-chalk pl-4 pr-1.5 py-1.5 rounded-full font-sans font-bold text-xs uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all flex items-center space-x-2.5 shrink-0 shadow-sm"
          >
            <span>Run Audit</span>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 text-chalk" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
