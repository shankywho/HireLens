export interface ScoreBand {
  label: string;
  badgeStyle: string; // Tailwind CSS utility classes
  category: 'high_risk' | 'likely_stale' | 'caution' | 'verified';
}

/**
 * Centralized HireLens score-to-color band lookup:
 *  0 – 50   -> HIGH RISK     (Ember Orange / Red)
 * 51 – 75   -> LIKELY STALE  (Ember Orange)
 * 76 – 90   -> CAUTION       (Sulfur Yellow)
 * 91 – 100  -> VERIFIED      (Obsidian / Green)
 */
export function getScoreBand(score: number): ScoreBand {
  if (score <= 50) {
    return {
      label: 'HIGH RISK',
      badgeStyle: 'bg-ember text-chalk font-bold',
      category: 'high_risk',
    };
  }
  if (score <= 75) {
    return {
      label: 'LIKELY STALE',
      badgeStyle: 'bg-ember text-chalk font-bold',
      category: 'likely_stale',
    };
  }
  if (score <= 90) {
    return {
      label: 'CAUTION',
      badgeStyle: 'bg-sulfur text-obsidian border border-obsidian/10 font-bold',
      category: 'caution',
    };
  }
  return {
    label: 'VERIFIED',
    badgeStyle: 'bg-obsidian text-chalk font-bold',
    category: 'verified',
  };
}
