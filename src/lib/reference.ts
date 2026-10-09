import { randomBytes } from 'crypto';

/**
 * The report's reference number, `{prefix}-{YYYYMMDD}-{6 hex}`. It exists
 * before any delivery, so the PDF, every e-mail and every channel share it.
 *
 * Six hex digits allow about 16.7 million numbers a day: at 50 reports a day
 * two of them share a number with a chance of roughly 1 in 13,000. Four
 * digits, as before, made that about 2 percent.
 */
export function generateReferenceNumber(prefix: string, now: Date = new Date()): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}-${date}-${randomBytes(3).toString('hex')}`;
}
