/**
 * Formats a salary range with intelligent hourly vs annual denomination.
 * Numbers <= $500 are considered hourly rates (e.g. $85/hr).
 * Numbers > $500 are formatted as annual salary bands with comma separators (e.g. $165,000 – $210,000).
 */
export function formatSalaryRange(min?: number | null, max?: number | null): string {
  if (!min && !max) return 'Salary not disclosed';

  const formatNumber = (num: number): string => {
    if (num <= 500) {
      return `$${num}/hr`;
    }
    return `$${num.toLocaleString('en-US')}`;
  };

  if (min && max) {
    if (min === max) return formatNumber(min);
    if (max <= 500) {
      return `$${min} – $${max}/hr`;
    }
    return `${formatNumber(min)} – ${formatNumber(max)}`;
  }

  if (min) return `From ${formatNumber(min)}`;
  if (max) return `Up to ${formatNumber(max)}`;

  return 'Salary not disclosed';
}

/**
 * Formats a Date or ISO timestamp into standard ISO YYYY-MM-DD format.
 */
export function formatDate(dateOrIso?: Date | string | null, fallback: string = '2026-08-15'): string {
  if (!dateOrIso) return fallback;
  try {
    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (isNaN(d.getTime())) return fallback;
    return d.toISOString().split('T')[0]!;
  } catch {
    return fallback;
  }
}

/**
 * Formats a timestamp into HH:MM:SSZ UTC string.
 */
export function formatUtcTime(dateOrIso?: Date | string | null, fallback: string = '14:02:11Z'): string {
  if (!dateOrIso) return fallback;
  try {
    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (isNaN(d.getTime())) return fallback;
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    const s = String(d.getUTCSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}Z`;
  } catch {
    return fallback;
  }
}

/**
 * Generates deterministic barcode bar widths from a seed string.
 */
export function generateBarcodePattern(seed: string, count: number = 44): number[] {
  const safeSeed = seed || 'hirelens';
  return Array.from({ length: count }, (_, i) => ((safeSeed.charCodeAt(i % safeSeed.length) + i * 7) % 4) + 1);
}
