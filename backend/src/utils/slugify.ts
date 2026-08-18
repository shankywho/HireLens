import slugifyLib from 'slugify';

/**
 * Converts a raw string into a clean, URL-safe and canonical slug format.
 *
 * @param text - Input string to sanitize
 * @returns string lowercase, stripped of special characters
 */
export function slugify(text: string): string {
  if (!text || typeof text !== 'string') return 'unknown';
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}
