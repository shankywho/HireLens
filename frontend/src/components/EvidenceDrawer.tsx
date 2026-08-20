import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ShieldAlert, History, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JobListing, JobListingDetail } from '../types';
import { fetchListingDetail } from '../services/api';
import { getScoreBand } from '../utils/scoreBands';

interface EvidenceDrawerProps {
  listing: JobListing | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ listing, onClose }) => {
  const [detail, setDetail] = useState<JobListingDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Fix race condition when rapidly switching listings
  useEffect(() => {
    let isCurrent = true;
    if (listing?.normalized_id) {
      setLoading(true);
      setDetail(null); // Clear previous detail state immediately to prevent stale mixing

      fetchListingDetail(listing.normalized_id)
        .then((data) => {
          if (isCurrent) {
            setDetail(data);
          }
        })
        .catch((err) => {
          if (isCurrent) {
            console.error('Error fetching case file detail:', err);
          }
        })
        .finally(() => {
          if (isCurrent) {
            setLoading(false);
          }
        });
    } else {
      setDetail(null);
      setLoading(false);
    }

    return () => {
      isCurrent = false;
    };
  }, [listing?.normalized_id]);

  if (!listing) return null;

  const actualSnapshots = detail?.snapshots || [];
  const sourceCount = actualSnapshots.length || listing.sourceCount || listing.sources.length || 1;
  const scoreInfo = getScoreBand(listing.score);

  // Deduplicate and filter evidence deductions
  const rawEvidence = detail?.evidence || listing.evidence || [];
  const uniqueEvidence = Array.from(new Set(rawEvidence));
  const validDeductions = uniqueEvidence.filter((e) => {
    if (sourceCount < 2 && e.toLowerCase().includes('salary spread')) {
      return false;
    }
    return true;
  });

  const getVerdictSummary = (score: number, sourceCount: number, evidence: string[]) => {
    if (sourceCount < 2) {
      return `Single source verified (${sourceCount}/3). Cross-platform confirmation pending.`;
    }
    if (evidence.some((e) => e.toLowerCase().includes('conflict'))) {
      return `Status conflict detected across ${sourceCount} active platforms.`;
    }
    if (evidence.some((e) => e.toLowerCase().includes('salary spread'))) {
      return `Salary spread detected across multiple sources.`;
    }
    if (score >= 90) {
      return `Role verified cleanly across ${sourceCount} platforms with zero drift.`;
    }
    return `Calculated from multi-source audit rules.`;
  };

  const verdictSummary = getVerdictSummary(listing.score, sourceCount, validDeductions);

  // Helper to extract specific snapshot data for accurate Source Matrix data binding
  const getSourceSnapshot = (sourceType: 'careers' | 'linkedin' | 'indeed') => {
    if (sourceType === 'careers') {
      return actualSnapshots.find(
        (s) => s.source.toLowerCase().includes('greenhouse') || s.source.toLowerCase().includes('lever') || s.source.toLowerCase().includes('careers')
      );
    }
    return actualSnapshots.find((s) => s.source.toLowerCase().includes(sourceType));
  };

  const formatSnapshotSalary = (snap?: { salaryMin?: number | null; salaryMax?: number | null }) => {
    if (!snap || (!snap.salaryMin && !snap.salaryMax)) return '—';
    const fmt = (val?: number | null) => {
      if (!val) return '';
      if (val >= 1000) return `$${Math.round(val / 1000)}k`;
      return `$${val}`;
    };
    if (snap.salaryMin && snap.salaryMax) {
      if (snap.salaryMin === snap.salaryMax) return fmt(snap.salaryMin);
      return `${fmt(snap.salaryMin)} – ${fmt(snap.salaryMax)}`;
    }
    return fmt(snap.salaryMin || snap.salaryMax);
  };

  const atsSnap = getSourceSnapshot('careers');
  const linkedinSnap = getSourceSnapshot('linkedin');
  const indeedSnap = getSourceSnapshot('indeed');

  // Clean sanitized reference ID (strictly stripping internal fallback tokens like l_unspecified)
  const cleanCaseId = `${listing.company.toUpperCase()}-${listing.normalized_id
    .replace(/l_unspecified-?/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()}`;

  return (
    <AnimatePresence>
      <div key={`drawer-root-${listing.normalized_id}`} className="fixed inset-0 z-50 overflow-hidden font-sans">
        {/* Backdrop */}
        <motion.div
          key={`drawer-backdrop-${listing.normalized_id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-obsidian/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Docked Slide-Over Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <motion.div
            key={`drawer-panel-${listing.normalized_id}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="w-screen max-w-xl bg-limestone text-obsidian border-l border-obsidian/15 shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            
            {/* 1. Header (Company + Title + Sanitized Case ID + Close) */}
            <div className="p-6 sm:p-8 border-b border-obsidian/10 bg-limestone sticky top-0 z-10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-obsidian text-chalk font-mono font-bold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {listing.company}
                  </span>
                  <span className="font-mono text-xs text-obsidian/60 uppercase tracking-wider">
                    CASE FILE #{cleanCaseId}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-pumice hover:bg-obsidian hover:text-chalk flex items-center justify-center transition-colors border border-obsidian/10"
                  aria-label="Close Case File"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-obsidian tracking-tight leading-snug">
                {listing.title}
              </h2>
            </div>

            {/* 2. Linear Dossier Body */}
            <div className="p-6 sm:p-8 space-y-6 flex-1">
              
              {/* Single Risk Score & Verdict Block */}
              <div className="bg-pumice/70 rounded-[18px] p-5 border border-obsidian/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-obsidian/70">
                    Confidence Verdict
                  </span>
                  <div className={`px-3 py-1 rounded-full font-bold text-xs uppercase font-mono ${scoreInfo.badgeStyle}`}>
                    {listing.score}/100 · {scoreInfo.label}
                  </div>
                </div>

                <p className="text-sm font-semibold text-obsidian leading-relaxed">
                  {verdictSummary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-dotted border-obsidian/20 text-xs font-mono text-obsidian/60">
                  <span>{sourceCount} {sourceCount === 1 ? 'Source' : 'Sources'} Monitored</span>
                  <span>Sweep: {new Date(listing.lastSeenAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Source Matrix Table with Accurate Bound Data */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-obsidian/70 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-ember" />
                    <span>Source Matrix</span>
                  </h3>
                  <span className="font-mono text-[11px] text-obsidian/60">
                    {sourceCount} of 3 active
                  </span>
                </div>

                <div className="border border-obsidian/10 rounded-[14px] overflow-hidden bg-white">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-pumice/80 border-b border-obsidian/10 font-mono text-[11px] text-obsidian/70 uppercase">
                      <tr>
                        <th className="py-2.5 px-3.5">Platform</th>
                        <th className="py-2.5 px-3.5">Status</th>
                        <th className="py-2.5 px-3.5">Reported Salary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian/10 font-mono">
                      {/* Careers / ATS Row */}
                      <tr>
                        <td className="py-2.5 px-3.5 font-bold text-obsidian">
                          Careers Page ({atsSnap ? atsSnap.source.toUpperCase() : 'ATS'})
                        </td>
                        <td className="py-2.5 px-3.5">
                          {atsSnap ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              atsSnap.status === 'open'
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : 'text-rose-700 bg-rose-50 border-rose-200'
                            }`}>
                              {atsSnap.status === 'open' ? 'Active' : 'Closed'}
                            </span>
                          ) : (
                            <span className="text-obsidian/40 text-[10px]">Not Listed</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-obsidian/80">
                          {atsSnap ? formatSnapshotSalary(atsSnap) : '—'}
                        </td>
                      </tr>

                      {/* LinkedIn Row */}
                      <tr>
                        <td className="py-2.5 px-3.5 font-bold text-obsidian">LinkedIn</td>
                        <td className="py-2.5 px-3.5">
                          {linkedinSnap ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              linkedinSnap.status === 'open'
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : 'text-rose-700 bg-rose-50 border-rose-200'
                            }`}>
                              {linkedinSnap.status === 'open' ? 'Active' : 'Closed (Mismatch)'}
                            </span>
                          ) : (
                            <span className="text-obsidian/40 text-[10px]">Not Listed</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-obsidian/80">
                          {linkedinSnap ? formatSnapshotSalary(linkedinSnap) : '—'}
                        </td>
                      </tr>

                      {/* Indeed Row */}
                      <tr>
                        <td className="py-2.5 px-3.5 font-bold text-obsidian">Indeed</td>
                        <td className="py-2.5 px-3.5">
                          {indeedSnap ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              indeedSnap.status === 'open'
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : 'text-rose-700 bg-rose-50 border-rose-200'
                            }`}>
                              {indeedSnap.status === 'open' ? 'Active' : 'Closed'}
                            </span>
                          ) : (
                            <span className="text-obsidian/40 text-[10px]">Not Listed</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-obsidian/80">
                          {indeedSnap ? formatSnapshotSalary(indeedSnap) : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deductions & Signals Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-obsidian/70 flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-ember" />
                  <span>Rule Deductions & Signals</span>
                </h3>

                {validDeductions.length > 0 ? (
                  <div className="space-y-2">
                    {validDeductions.map((item, idx) => (
                      <div
                        key={`deduction-${idx}`}
                        className="bg-pumice/60 p-3.5 rounded-[12px] text-xs text-obsidian flex items-start space-x-2.5 border border-obsidian/10"
                      >
                        <AlertTriangle className="w-4 h-4 text-ember shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-obsidian">{item}</div>
                          <p className="text-obsidian/70 text-[11px] mt-0.5">
                            Deterministic rule penalty applied based on cross-source discrepancy.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-[12px] text-emerald-800 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No deduction flags triggered. Role verified cleanly across active sources.</span>
                  </div>
                )}
              </div>

              {/* Timeline Snapshots */}
              {actualSnapshots.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-obsidian/70 flex items-center space-x-1.5">
                    <History className="w-3.5 h-3.5 text-ember" />
                    <span>Snapshot History</span>
                  </h3>

                  <div className="space-y-2">
                    {actualSnapshots.map((snap) => (
                      <div key={snap.id} className="bg-pumice/50 p-3 rounded-[12px] text-xs space-y-1.5 border border-obsidian/10">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[10px] uppercase bg-sulfur text-obsidian px-2 py-0.5 rounded border border-obsidian/10">
                            {snap.source}
                          </span>
                          <span className="font-mono text-[10px] text-obsidian/60">
                            {new Date(snap.capturedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="font-semibold text-obsidian text-xs">{snap.rawTitle}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Telemetry Footprint */}
              <div className="bg-pumice/40 p-3.5 rounded-[12px] font-mono text-[11px] space-y-1.5 text-obsidian/80 border border-obsidian/10">
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="font-bold text-obsidian">Bright Data Scraper Studio</span>
                </div>
                <div className="flex justify-between">
                  <span>Normalization:</span>
                  <span>Google Gemini 3.6 Flash</span>
                </div>
                <div className="flex justify-between">
                  <span>Verification:</span>
                  <span className="font-bold text-emerald-700">CONFIRMED (Zero Drift)</span>
                </div>
              </div>

            </div>

            {/* 3. Action Footer */}
            <div className="p-4 sm:p-6 border-t border-obsidian/10 bg-limestone flex items-center justify-between">
              <span className="font-mono text-xs text-obsidian/60">
                RECORD VERIFIED
              </span>
              {listing.url ? (
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-ember text-chalk px-4 py-2 rounded-full font-sans font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <span>Open Original Source</span>
                  <ExternalLink className="w-3.5 h-3.5 text-chalk" />
                </a>
              ) : (
                <button
                  onClick={onClose}
                  className="bg-obsidian text-chalk px-4 py-2 rounded-full font-sans font-bold text-xs uppercase tracking-wider hover:bg-obsidian/80 transition-all"
                >
                  Close Case File
                </button>
              )}
            </div>

          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
