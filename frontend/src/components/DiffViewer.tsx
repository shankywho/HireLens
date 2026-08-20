import React from 'react';
import { GitCommit, Code2, Eye } from 'lucide-react';

interface DiffViewerProps {
  diffText?: string;
  suggestedSelectors?: Record<string, string>;
  previewResult?: unknown;
  collectorId: string;
  isLiveCli?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffText,
  suggestedSelectors,
  previewResult,
  collectorId,
  isLiveCli = false,
}) => {
  return (
    <div className="bg-limestone p-6 sm:p-8 rounded-[30px] text-obsidian font-mono text-sm border-dotted border-[1.5px] border-obsidian space-y-4">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-dotted border-obsidian/30">
        <div className="flex items-center space-x-2">
          <GitCommit className="w-5 h-5 text-ember" />
          <span className="font-bold text-obsidian font-sans uppercase">
            {isLiveCli ? 'Bright Data Scraper Studio (Live)' : 'Synthetic Drift Simulator'}
          </span>
          <span className="text-xs text-obsidian/60">[{collectorId}]</span>
        </div>
        <span className="bg-sulfur text-obsidian font-sans font-medium text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-obsidian/10">
          AWAITING APPROVAL
        </span>
      </div>

      {/* Code Snippet */}
      <div className="space-y-3 font-mono text-xs overflow-x-auto">
        {diffText && (
          <div className="space-y-2">
            <div className="text-obsidian/70 font-semibold font-sans">// Patch Summary / Selector Diff:</div>
            <div className="p-3 bg-card border border-obsidian/10 rounded-[16px] font-mono text-obsidian whitespace-pre-wrap">
              {diffText}
            </div>
          </div>
        )}

        {previewResult && (
          <div className="pt-3 border-t border-dotted border-obsidian/30">
            <div className="text-obsidian/70 text-xs mb-2 font-semibold font-sans flex items-center space-x-1">
              <Eye className="w-4 h-4 text-ember" />
              <span>Dry-Run Extraction Preview:</span>
            </div>
            <pre className="p-4 bg-pumice text-obsidian rounded-[16px] text-xs border border-obsidian/10 overflow-x-auto">
              {typeof previewResult === 'string'
                ? previewResult
                : JSON.stringify(previewResult, null, 2)}
            </pre>
          </div>
        )}

        {suggestedSelectors && (
          <div className="pt-3 border-t border-dotted border-obsidian/30">
            <div className="text-obsidian/70 text-xs mb-2 font-semibold font-sans flex items-center space-x-1">
              <Code2 className="w-4 h-4 text-ember" />
              <span>Suggested Selector Schema:</span>
            </div>
            <pre className="p-4 bg-pumice text-obsidian rounded-[16px] text-xs border border-obsidian/10">
              {JSON.stringify(suggestedSelectors, null, 2)}
            </pre>
          </div>
        )}
      </div>

    </div>
  );
};
