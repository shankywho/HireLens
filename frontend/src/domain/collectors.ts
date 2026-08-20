import type { CollectorStatus } from '@/types';

/**
 * Standard ATS Platform Names
 */
export const SUPPORTED_ATS_PLATFORMS = ['Greenhouse', 'Lever', 'LinkedIn', 'Indeed'] as const;
export type SupportedAts = typeof SUPPORTED_ATS_PLATFORMS[number];

/**
 * Normalizes raw collector status string to standard application CollectorStatus.
 */
export function normalizeCollectorStatus(rawStatus?: string | null): CollectorStatus {
  if (!rawStatus) return 'HEALTHY';
  const s = rawStatus.toUpperCase().trim();

  if (s === 'HEALTHY' || s === 'ACTIVE') return 'HEALTHY';
  if (s === 'DEGRADED' || s === 'DRIFT_DETECTED' || s === 'DRIFT' || s === 'BROKEN') return 'DEGRADED';
  if (s === 'PATCH_READY' || s === 'AWAITING_APPROVAL' || s === 'HEALED') return 'PATCH_READY';
  if (s === 'HEALING' || s === 'SYNTHESIZING' || s === 'INVESTIGATING') return 'HEALING';

  return 'HEALTHY';
}

/**
 * Maps collector status to badge color token.
 */
export function getCollectorStatusBadgeTone(status: CollectorStatus | string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const norm = normalizeCollectorStatus(status);
  switch (norm) {
    case 'HEALTHY':
      return {
        bg: 'bg-legit-bright/10',
        text: 'text-legit-bright',
        border: 'border-legit-bright/30',
        dot: 'bg-legit-bright',
      };
    case 'DEGRADED':
      return {
        bg: 'bg-ember/10',
        text: 'text-ember',
        border: 'border-ember/30',
        dot: 'bg-ember',
      };
    case 'PATCH_READY':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-500',
        border: 'border-amber-500/30',
        dot: 'bg-amber-500',
      };
    case 'HEALING':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500/30',
        dot: 'bg-blue-500',
      };
  }
}
