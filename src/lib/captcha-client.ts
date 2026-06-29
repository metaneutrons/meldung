import { sha256 } from 'js-sha256';

export interface CaptchaChallenge {
  algorithm: string;
  challenge: string;
  salt: string;
  maxnumber: number;
  signature: string;
}

export interface CaptchaSolution {
  challenge: string;
  salt: string;
  number: number;
  signature: string;
}

/** Brute-forces the number that reproduces the challenge hash (a few ms). */
export function solveChallenge(c: CaptchaChallenge): CaptchaSolution {
  for (let n = 0; n <= c.maxnumber; n++) {
    if (sha256(c.salt + n) === c.challenge) {
      return { challenge: c.challenge, salt: c.salt, number: n, signature: c.signature };
    }
  }
  throw new Error('captcha: no solution found');
}

/** Fetches a fresh challenge and solves it — invisible to the user. */
export async function fetchAndSolveCaptcha(): Promise<CaptchaSolution> {
  const res = await fetch('/api/challenge', { cache: 'no-store' });
  if (!res.ok) throw new Error(`captcha challenge failed: ${res.status}`);
  const challenge = (await res.json()) as CaptchaChallenge;
  return solveChallenge(challenge);
}
