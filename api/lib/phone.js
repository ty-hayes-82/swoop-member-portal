/**
 * Phone number utilities shared across the SMS pipeline.
 */

/**
 * Normalize any US phone string to E.164 (+1XXXXXXXXXX).
 * Returns null for invalid/missing input.
 */
export function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return null;
}
