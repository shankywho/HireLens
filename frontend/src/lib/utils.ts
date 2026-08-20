import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats compensation strings or numeric min/max bounds:
 * - If max <= 500 (hourly rate), formats with a single "/ HR" (e.g., "$55 – $70 / HR")
 * - If max > 500 (annual salary), formats with standard currency commas (e.g., "$198,000 – $246,000")
 */
export function formatCompensation(rawSalary?: string | number | null, maxSalary?: number | null): string {
  if (rawSalary === null || rawSalary === undefined) {
    if (maxSalary) {
      return maxSalary <= 500 ? `$${maxSalary} / HR` : `$${maxSalary.toLocaleString()}`;
    }
    return '$150,000 – $220,000';
  }

  if (typeof rawSalary === 'number' || typeof maxSalary === 'number') {
    const min = typeof rawSalary === 'number' ? rawSalary : 0;
    const max = typeof maxSalary === 'number' ? maxSalary : min;

    if (max > 0 && max <= 500) {
      return min > 0 && min !== max ? `$${min} – $${max} / HR` : `$${max} / HR`;
    }
    if (min > 0 && min !== max) {
      return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
    }
    return `$${(max || min).toLocaleString()}`;
  }

  if (typeof rawSalary === 'string') {
    const cleaned = rawSalary.replace(/\s*\/\s*hr|\s*\/\s*hour|\s*per hour/gi, '').trim();
    if (/\byr\b|annual|year/i.test(cleaned)) return cleaned;

    const numbers = cleaned.match(/\d+(?:,\d+)*(?:\.\d+)?/g);
    if (numbers && numbers.length > 0) {
      const parsedNums = numbers.map((n) => parseFloat(n.replace(/,/g, '')));
      const highest = Math.max(...parsedNums);
      if (highest > 0 && highest <= 500) {
        return `${cleaned} / HR`;
      }
    }
    return cleaned;
  }

  return '$150,000 – $220,000';
}
