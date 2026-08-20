import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, SlidersHorizontal, Database } from 'lucide-react';
import { JobListing } from '../types';
import { fetchListings } from '../services/api';
import { JobCard } from './JobCard';
import { HeroBanner } from './HeroBanner';

interface JobFeedProps {
  onNavigateHealth?: () => void;
  onSelectListing: (listing: JobListing) => void;
}

export const JobFeed: React.FC<JobFeedProps> = ({ onNavigateHealth, onSelectListing }) => {
  const [listings, setListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<'score_asc' | 'score_desc' | 'date'>('score_asc');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchListings(search, companyFilter, minScore);
      setListings(data);
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, companyFilter, minScore]);

  const sortedListings = [...listings].sort((a, b) => {
    if (sortBy === 'score_asc') return a.score - b.score;
    if (sortBy === 'score_desc') return b.score - a.score;
    return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
  });

  return (
    <div className="space-y-8">
      
      {/* Hero Section */}
      <HeroBanner
        onAuditClick={loadData}
        onScraperHealthClick={onNavigateHealth}
      />

      {/* Feed Header & Filter Bar */}
      <div className="bezel-container">
        <div className="bezel-surface p-7 sm:p-9 space-y-6 border border-primary/10 shadow-sm">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl text-primary uppercase tracking-wide">
                LATEST VERIFIED OPENINGS
              </h2>
              <p className="font-sans font-medium text-primary/70 text-sm mt-0.5">
                Ranked by cross-scraped evidence, not employer claims.
              </p>
            </div>

            <button onClick={loadData} disabled={loading} className="bg-primary text-chalk font-sans font-bold text-xs rounded-full px-5 py-2.5 uppercase tracking-wider hover:bg-primary/85 active:scale-[0.98] transition-all flex items-center space-x-2 shrink-0 disabled:opacity-50 shadow-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Audit</span>
            </button>
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 pt-6 border-t border-dotted border-primary/25">
            
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-primary/40 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search title, role or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-5 py-3 bg-limestone border border-primary/15 focus:border-primary rounded-full text-sm font-sans font-medium text-primary placeholder:text-primary/40 focus:outline-none shadow-sm"
              />
            </div>

            {/* Company Dropdown */}
            <div className="lg:col-span-3">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-4 py-3 bg-limestone border border-obsidian/15 rounded-full text-sm font-sans font-medium text-obsidian focus:outline-none focus:border-obsidian shadow-sm"
              >
                <option value="">All Companies</option>
                <option value="Stripe">Stripe</option>
                <option value="Coinbase">Coinbase</option>
                <option value="DoorDash">DoorDash</option>
                <option value="Brex">Brex</option>
              </select>
            </div>

            {/* Min Score Threshold Slider */}
            <div className="lg:col-span-2 flex items-center space-x-3 bg-limestone border border-obsidian/15 px-4 py-2.5 rounded-full shadow-sm">
              <SlidersHorizontal className="w-4 h-4 text-obsidian/50 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-xs font-mono font-bold text-obsidian">
                  <span>Min Score</span>
                  <span className="text-ember">{minScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-ember cursor-pointer h-1.5"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-3 bg-limestone border border-obsidian/15 rounded-full text-sm font-sans font-medium text-obsidian focus:outline-none focus:border-obsidian shadow-sm"
              >
                <option value="score_asc">Risk: High to Low</option>
                <option value="score_desc">Score: High to Low</option>
                <option value="date">Latest Sweep</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* Grid of Job Cards */}
      {loading && sortedListings.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bezel-container">
              <div className="bezel-surface h-56 animate-pulse p-8 space-y-4 border border-obsidian/10">
                <div className="h-5 bg-pumice rounded-full w-1/3" />
                <div className="h-8 bg-pumice rounded-full w-3/4" />
                <div className="h-5 bg-pumice rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedListings.map((item) => (
            <JobCard key={item.normalized_id} listing={item} onSelect={onSelectListing} />
          ))}
        </div>
      ) : (
        <div className="bezel-container">
          <div className="bezel-surface p-12 text-center space-y-4 border border-obsidian/10">
            <Database className="w-12 h-12 text-obsidian/40 mx-auto" />
            <h3 className="font-display text-3xl text-obsidian uppercase">
              NO VERIFIED LISTINGS MATCH QUERY
            </h3>
            <p className="font-sans font-medium text-obsidian/70 text-sm max-w-sm mx-auto">
              Try adjusting search terms or lowering the minimum confidence threshold.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
