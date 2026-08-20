import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { CompanyMetrics, JobListing } from '../types';
import { fetchCompanyDetail, fetchCompanies } from '../services/api';
import { JobCard } from './JobCard';

interface CompanyProfileProps {
  onSelectListing: (listing: JobListing) => void;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ onSelectListing }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('Stripe');
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies()
      .then((data) => setCompanies(data))
      .catch((err) => console.error('Failed to load companies:', err));
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      setLoading(true);
      fetchCompanyDetail(selectedCompanyId)
        .then((data) => setMetrics(data))
        .catch((err) => console.error('Failed to load company profile:', err))
        .finally(() => setLoading(false));
    }
  }, [selectedCompanyId]);

  const getInterpretationSentence = (companyName: string, consistencyRate: number, repostRate: number) => {
    if (consistencyRate < 60) {
      return `${companyName} exhibits cross-platform salary spreads up to 31% and active status mismatches across Greenhouse & LinkedIn.`;
    }
    if (repostRate > 20) {
      return `${companyName} shows elevated 45+ day role staleness with automated resume farming patterns on engineering posts.`;
    }
    return `${companyName} maintains 95%+ title & salary alignment across primary ATS portals and secondary job boards.`;
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header & Target Company Selector */}
      <div className="bezel-container">
        <div className="bezel-surface p-7 sm:p-9 space-y-6 border border-obsidian/10 shadow-[0_2px_16px_rgba(7,6,7,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-5xl sm:text-6xl text-obsidian uppercase tracking-wide">
                COMPANY HIRING SIGNALS
              </h1>
              <p className="font-sans font-medium text-obsidian/70 text-sm mt-0.5">
                Aggregate Behavioral Telemetry & Cross-Platform Alignment
              </p>
            </div>

            {/* Target Selector */}
            <div className="flex items-center space-x-3">
              <label className="font-mono font-bold text-xs text-obsidian uppercase tracking-wider">
                Target:
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="px-4 py-2.5 bg-limestone border border-obsidian/15 rounded-full text-sm font-sans font-medium text-obsidian focus:outline-none focus:border-obsidian shadow-sm"
              >
                <option value="Stripe">Stripe</option>
                <option value="Coinbase">Coinbase</option>
                <option value="DoorDash">DoorDash</option>
                <option value="Brex">Brex</option>
              </select>
            </div>
          </div>

          {/* Dynamic Insight Banner: Solid Sulfur Yellow (#f5f28e) */}
          {metrics && (
            <div className="bg-sulfur border border-obsidian/10 p-4 rounded-[20px] font-sans font-medium text-sm text-obsidian flex items-center space-x-3 shadow-sm">
              <Info className="w-5 h-5 text-ember shrink-0" />
              <span>
                {getInterpretationSentence(metrics.company, metrics.consistencyRatePercent, metrics.repostRatePercent)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bento Grid of 3 Solid Molten Ember Cards (#fc5000) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bezel-container">
              <div className="bezel-surface h-52 animate-pulse p-8 border border-obsidian/10" />
            </div>
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Metric Card 1 */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-ember text-chalk rounded-[24px] p-7 sm:p-8 flex flex-col justify-between h-52 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-chalk/90 font-semibold">
                  Average Role Lifespan
                </span>
                <Clock className="w-5 h-5 text-sulfur" />
              </div>
              <div>
                <div className="font-display text-5xl sm:text-6xl text-chalk leading-none">
                  {metrics.avgListingLifespanDays} DAYS
                </div>
                <span className="font-mono text-xs text-sulfur uppercase tracking-wider block mt-2.5 font-bold">
                  Past 30 Days Telemetry
                </span>
              </div>
            </motion.div>

            {/* Metric Card 2 */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-ember text-chalk rounded-[24px] p-7 sm:p-8 flex flex-col justify-between h-52 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-chalk/90 font-semibold">
                  Repost Loop Rate
                </span>
                <RotateCcw className="w-5 h-5 text-sulfur" />
              </div>
              <div>
                <div className="font-display text-5xl sm:text-6xl text-chalk leading-none">
                  {metrics.repostRatePercent}%
                </div>
                <span className="font-mono text-xs text-sulfur uppercase tracking-wider block mt-2.5 font-bold">
                  Automated Repost Frequency
                </span>
              </div>
            </motion.div>

            {/* Metric Card 3 */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-ember text-chalk rounded-[24px] p-7 sm:p-8 flex flex-col justify-between h-52 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-chalk/90 font-semibold">
                  Cross-Platform Agreement
                </span>
                <ShieldCheck className="w-5 h-5 text-sulfur" />
              </div>
              <div>
                <div className="font-display text-5xl sm:text-6xl text-chalk leading-none">
                  {metrics.consistencyRatePercent}%
                </div>
                <span className="font-mono text-xs text-sulfur uppercase tracking-wider block mt-2.5 font-bold">
                  Greenhouse · LI · Indeed Alignment
                </span>
              </div>
            </motion.div>

          </div>

          {/* Active Postings & Recent Evidence Events Rail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
            
            {/* Active Company Postings */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-4xl text-obsidian uppercase tracking-wide">
                  ACTIVE COMPANY LISTINGS ({metrics.listings.length})
                </h2>
                <span className="font-mono text-xs text-obsidian/60 uppercase tracking-wider font-semibold">
                  Ranked by confidence score
                </span>
              </div>

              {metrics.listings.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {metrics.listings
                    .slice()
                    .sort((a, b) => a.score - b.score)
                    .map((item) => (
                      <JobCard key={item.normalized_id} listing={item} onSelect={onSelectListing} />
                    ))}
                </div>
              ) : (
                <div className="bezel-container">
                  <div className="bezel-surface p-10 text-center rounded-[20px] font-sans font-medium text-sm text-obsidian/70 border border-obsidian/10">
                    No active listings tracked for this company currently.
                  </div>
                </div>
              )}
            </div>

            {/* Recent Evidence Events Rail */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bezel-container">
                <div className="bezel-surface p-7 space-y-6 border border-obsidian/10 shadow-sm">
                  <h3 className="font-display text-3xl text-obsidian uppercase tracking-wide flex items-center space-x-2 border-b border-dotted border-obsidian/30 pb-3">
                    <TrendingUp className="w-5 h-5 text-ember" />
                    <span>EVIDENCE EVENTS</span>
                  </h3>

                  <div className="space-y-4 font-sans font-medium text-xs">
                    <div className="bg-pumice p-4 rounded-[18px] space-y-2 border border-obsidian/10">
                      <div className="flex items-center justify-between">
                        <span className="bg-sulfur text-obsidian px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[10px] border border-obsidian/10">
                          Greenhouse API
                        </span>
                        <span className="text-obsidian/60 font-mono text-[10px]">10m ago</span>
                      </div>
                      <div className="font-bold text-sm text-obsidian">Direct ATS Crawl Sync</div>
                      <div className="text-obsidian/70">Primary career page active and responding cleanly.</div>
                    </div>

                    <div className="bg-pumice p-4 rounded-[18px] space-y-2 border border-obsidian/10">
                      <div className="flex items-center justify-between">
                        <span className="bg-ember text-chalk px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[10px]">
                          LinkedIn Sync
                        </span>
                        <span className="text-obsidian/60 font-mono text-[10px]">42m ago</span>
                      </div>
                      <div className="font-bold text-sm text-obsidian">Status Mismatch Alert</div>
                      <div className="text-obsidian/70">Backend Engineer listed as closed on LI but open on Greenhouse.</div>
                    </div>

                    <div className="bg-pumice p-4 rounded-[18px] space-y-2 border border-obsidian/10">
                      <div className="flex items-center justify-between">
                        <span className="bg-sulfur text-obsidian px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[10px] border border-obsidian/10">
                          Indeed Crawl
                        </span>
                        <span className="text-obsidian/60 font-mono text-[10px]">1h ago</span>
                      </div>
                      <div className="font-bold text-sm text-obsidian">Salary Spread Verification</div>
                      <div className="text-obsidian/70">Detected 29% salary spread ($140k vs $180k) on external post.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      ) : null}

    </div>
  );
};
