import { describe, it, expect } from 'vitest';
import { sha256 } from 'js-sha256';
import { createChallenge, verifySolution, type CaptchaSolution } from './captcha';

function solve(c: ReturnType<typeof createChallenge>): CaptchaSolution {
  for (let n = 0; n <= c.maxnumber; n++) {
    if (sha256(c.salt + n) === c.challenge) {
      return { challenge: c.challenge, salt: c.salt, number: n, signature: c.signature };
    }
  }
  throw new Error('no solution');
}

describe('captcha', () => {
  it('verifies a correctly solved challenge (client + server agree)', () => {
    expect(verifySolution(solve(createChallenge()))).toBe(true);
  });

  it('rejects a wrong number', () => {
    const s = solve(createChallenge());
    expect(verifySolution({ ...s, number: s.number + 1 })).toBe(false);
  });

  it('rejects a forged signature', () => {
    const s = solve(createChallenge());
    expect(verifySolution({ ...s, signature: 'deadbeef'.repeat(8) })).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(verifySolution(undefined)).toBe(false);
    expect(verifySolution({})).toBe(false);
    expect(verifySolution({ challenge: 'x', salt: 'y', number: 1, signature: 'z' })).toBe(false);
  });
});
