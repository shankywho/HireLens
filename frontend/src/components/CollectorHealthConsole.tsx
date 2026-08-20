import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, CheckCircle2, ArrowUpRight, AlertCircle } from 'lucide-react';
import { CollectorHealth } from '../types';
import { fetchCollectors, approveHeal, simulateBreak } from '../services/api';
import { DiffViewer } from './DiffViewer';

export const CollectorHealthConsole: React.FC = () => {
  const [collectors, setCollectors] = useState<CollectorHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [simulatingText, setSimulatingText] = useState<string | null>(null);
  const [successEvent, setSuccessEvent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHealth = async () => {
    try {
      const data = await fetchCollectors();
      setCollectors(data);
    } catch (err) {
      console.error('Failed to load collector health', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateBreak = async () => {
    setActionLoading(true);
    setSimulatingText('Running bdata scraper heal...');
    setSuccessEvent(null);
    setErrorMessage(null);
    try {
      await simulateBreak('c_greenhouse');
      setSimulatingText('Patch awaiting approval');
      setTimeout(() => setSimulatingText(null), 2500);
      await loadHealth();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Break simulation failed', err);
      setErrorMessage(msg);
      setSimulatingText(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveHeal = async (collectorId: string) => {
    setActionLoading(true);
    setSuccessEvent(null);
    setErrorMessage(null);
    try {
      await approveHeal(collectorId);
      setSuccessEvent(`Approved patch for ${collectorId} via bdata scraper approve. State restored to HEALTHY.`);
      await loadHealth();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Approval failed', err);
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const healthyCount = collectors.filter((c) => c.status === 'HEALTHY').length;
  const awaitingApprovalCount = collectors.filter((c) => c.status === 'HEALING' || (c.status as string) === 'awaiting_approval').length;
  const patchReadyCount = collectors.filter((c) => (c.status === 'HEALING' || (c.status as string) === 'awaiting_approval') && c.pendingHealJson).length;

  return (
    <div className="space-y-8 font-sans">
      
      {/* Telemetry Banner */}
      <div className="bezel-container">
        <div className="bezel-surface p-7 sm:p-10 space-y-6 border border-primary/10 shadow-[0_2px_16px_rgba(7,6,7,0.02)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-obsidian uppercase tracking-wide leading-none">
                SCRAPER HEALTH & SELF-HEALING
              </h1>

              <p className="font-sans font-medium text-obsidian/80 text-base max-w-2xl leading-relaxed">
                Bright Data Scraper Studio monitors DOM mutations across career portals, runs automated AST selector repair via <code className="font-mono bg-limestone px-1.5 py-0.5 rounded text-xs">bdata scraper heal</code>, and deploys approved patches with <code className="font-mono bg-limestone px-1.5 py-0.5 rounded text-xs">bdata scraper approve</code>.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-start lg:items-end space-y-2 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSimulateBreak}
                  disabled={actionLoading}
                  className="group bg-ember text-chalk font-sans font-bold pl-6 pr-2 py-2 rounded-full hover:opacity-95 active:scale-[0.98] transition-all uppercase tracking-wider flex items-center space-x-3 disabled:opacity-50 shadow-sm"
                >
                  <Zap className="w-4 h-4 text-chalk" />
                  <span>{simulatingText || 'Trigger Heal (`bdata scraper heal`)'}</span>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    <ArrowUpRight className="w-3.5 h-3.5 text-chalk" />
                  </div>
                </button>

                <button
                  onClick={loadHealth}
                  disabled={loading}
                  className="bg-primary text-chalk font-sans font-bold px-5 py-3 rounded-full hover:bg-primary/85 active:scale-[0.98] transition-all flex items-center space-x-2 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Poll Telemetry</span>
                </button>
              </div>

              <span className="font-mono text-[11px] text-obsidian/60 uppercase tracking-wider font-semibold">
                Target Collector: Greenhouse (c_greenhouse)
              </span>
            </div>
          </div>

          {/* 4 Summary State Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-dotted border-obsidian/25">
            <div className="bg-ember text-chalk p-5 rounded-[22px] flex flex-col justify-between h-32 shadow-sm">
              <span className="font-mono text-xs uppercase tracking-wider text-chalk/90 font-semibold block">
                Healthy
              </span>
              <div className="font-display text-4xl text-chalk mt-1">
                HEALTHY · {healthyCount}
              </div>
            </div>

            <div className="bg-ember text-chalk p-5 rounded-[22px] flex flex-col justify-between h-32 shadow-sm">
              <span className="font-mono text-xs uppercase tracking-wider text-chalk/90 font-semibold block">
                Awaiting Approval
              </span>
              <div className="font-display text-4xl text-sulfur mt-1">
                HEAL · {awaitingApprovalCount}
              </div>
            </div>

            <div className="bg-ember text-chalk p-5 rounded-[22px] flex flex-col justify-between h-32 shadow-sm">
              <span className="font-mono text-xs uppercase tracking-wider text-chalk/90 font-semibold block">
                Patch Ready
              </span>
              <div className="font-display text-4xl text-sulfur mt-1">
                PATCH · {patchReadyCount}
              </div>
            </div>

            <div className="bg-ember text-chalk p-5 rounded-[22px] flex flex-col justify-between h-32 shadow-sm">
              <span className="font-mono text-xs uppercase tracking-wider text-chalk/90 font-semibold block">
                CLI Integration
              </span>
              <div className="font-display text-2xl text-chalk mt-1 uppercase tracking-wide leading-tight">
                SCRAPER STUDIO
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-[20px] font-sans font-medium text-sm flex items-center justify-between border border-destructive/30 shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-destructive font-bold hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Success Event Notification */}
      {successEvent && (
        <div className="bg-sulfur text-obsidian p-4 rounded-[20px] font-sans font-medium text-sm flex items-center justify-between border border-obsidian/10 shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-ember" />
            <span>{successEvent}</span>
          </div>
          <button onClick={() => setSuccessEvent(null)} className="text-obsidian font-bold hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Collector Cards Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {collectors.map((c) => {
          const isAwaitingApproval = c.status === 'HEALING' || (c.status as string) === 'awaiting_approval';
          const isHealthy = c.status === 'HEALTHY';
          const isLiveCli = Boolean(c.pendingHealJson?.rawOutput);

          return (
            <div key={c.collectorId} className="bezel-container">
              <div className="bezel-surface p-7 sm:p-8 space-y-6 flex flex-col justify-between h-full border border-obsidian/10 shadow-sm">
                
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-display text-3xl text-obsidian uppercase tracking-wide">
                        {c.collectorId}
                      </span>
                      <span className="bg-sulfur text-obsidian font-mono font-bold text-xs px-2.5 py-0.5 rounded-full uppercase border border-obsidian/10">
                        [{c.sourceType}]
                      </span>
                    </div>
                    <p className="font-mono text-xs text-obsidian/70 mt-1">
                      Last sweep: {new Date(c.lastRunAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Status Pill */}
                  <div
                    className={`px-3.5 py-1 rounded-full font-display text-xl uppercase ${
                      isHealthy
                        ? 'bg-sulfur text-obsidian border border-obsidian/10'
                        : 'bg-ember text-chalk animate-pulse'
                    }`}
                  >
                    {isHealthy ? 'HEALTHY' : 'AWAITING APPROVAL'}
                  </div>
                </div>

                {/* Collector Telemetry Details */}
                <div className="bg-pumice p-4 rounded-[20px] font-mono text-xs space-y-2 text-obsidian border border-obsidian/10">
                  <div className="flex justify-between">
                    <span>Failure Count:</span>
                    <span className="font-bold text-ember">{c.failureCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Extraction Uptime:</span>
                    <span className="font-bold text-obsidian">
                      {isHealthy ? `${c.uptimePercent || 100}%` : '0% (Selector Drift)'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-dotted border-obsidian/30 text-obsidian/80">
                    {isHealthy
                      ? 'Collecting snapshots cleanly via Bright Data CLI.'
                      : 'Null extraction detected on title selector. Patch synthesized awaiting approval.'}
                  </div>
                </div>

                {/* Repair Review Panel when awaiting approval */}
                {isAwaitingApproval && c.pendingHealJson && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-sulfur text-obsidian font-display text-lg px-4 py-1.5 rounded-full text-center uppercase tracking-wider border border-obsidian/10">
                      {isLiveCli
                        ? '⚡ BRIGHT DATA SCRAPER STUDIO // SELF-HEAL (LIVE)'
                        : '⚡ DEMO MODE — SYNTHETIC DATA'}
                    </div>

                    <DiffViewer
                      collectorId={c.collectorId}
                      diffText={c.pendingHealJson.diff_summary || c.pendingHealJson.diff || c.pendingHealJson.diffExplanation}
                      suggestedSelectors={c.pendingHealJson.suggestedSelectors}
                      previewResult={c.pendingHealJson.preview_result}
                      isLiveCli={isLiveCli}
                    />

                    {/* Approve Button */}
                    <button
                      onClick={() => handleApproveHeal(c.collectorId)}
                      disabled={actionLoading}
                      className="group/approve w-full py-3 px-5 bg-ember text-chalk font-sans font-bold rounded-full hover:opacity-95 active:scale-[0.98] uppercase tracking-wider transition-all flex items-center justify-center space-x-2.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-sulfur" />
                      <span>Approve Patch (`bdata scraper approve`)</span>
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover/approve:translate-x-0.5 transition-transform">
                        <ArrowUpRight className="w-3.5 h-3.5 text-chalk" />
                      </div>
                    </button>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
