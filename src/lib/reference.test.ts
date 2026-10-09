import { describe, expect, it } from 'vitest';
import { generateReferenceNumber } from './reference';

describe('generateReferenceNumber', () => {
  it('has the prefix, the UTC date and six hex digits', () => {
    const ref = generateReferenceNumber('INC', new Date('2026-10-09T08:00:00Z'));
    expect(ref).toMatch(/^INC-20261009-[0-9a-f]{6}$/);
  });

  it('does not repeat within a busy day', () => {
    const day = new Date('2026-10-09T08:00:00Z');
    const refs = new Set(Array.from({ length: 500 }, () => generateReferenceNumber('INC', day)));
    // 500 draws from 16.7 million collide with a chance below 1 percent.
    expect(refs.size).toBeGreaterThanOrEqual(499);
  });
});
