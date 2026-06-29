import crypto from 'crypto';

/**
 * Self-hosted, invisible proof-of-work captcha (ALTCHA model). GDPR-clean:
 * no third party, no cookies, no personal data — the client just brute-forces
 * a number that reproduces a server-signed hash. Combined with the honeypot
 * and the submission rate limit it deters automated bots without any UX friction.
 */

const SECRET =
  process.env.CAPTCHA_SECRET ||
  process.env.AUTH_SECRET ||
  'meldung-insecure-dev-secret-set-CAPTCHA_SECRET';

if (!process.env.CAPTCHA_SECRET && !process.env.AUTH_SECRET) {
  console.warn(
    '[captcha] No CAPTCHA_SECRET/AUTH_SECRET set — using an insecure fallback. Set CAPTCHA_SECRET in production.',
  );
}

const TTL_MS = 10 * 60 * 1000;
/** Default work factor (avg ~half this many hashes ≈ <100ms). Tunable via config. */
const DEFAULT_DIFFICULTY = 120_000;
/** Generous absolute cap for verification, independent of the issued difficulty. */
const MAX_VERIFY = 10_000_000;

export interface CaptchaChallenge {
  algorithm: 'SHA-256';
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

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const hmac = (s: string) => crypto.createHmac('sha256', SECRET).update(s).digest('hex');

export function createChallenge(maxNumber: number = DEFAULT_DIFFICULTY): CaptchaChallenge {
  const salt = `${Date.now().toString(36)}.${crypto.randomBytes(8).toString('hex')}`;
  const number = crypto.randomInt(0, maxNumber);
  const challenge = sha256(salt + number);
  return {
    algorithm: 'SHA-256',
    challenge,
    salt,
    maxnumber: maxNumber,
    signature: hmac(challenge),
  };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function verifySolution(solution: unknown): boolean {
  if (typeof solution !== 'object' || solution === null) return false;
  const s = solution as Partial<CaptchaSolution>;
  if (
    typeof s.challenge !== 'string' ||
    typeof s.salt !== 'string' ||
    typeof s.number !== 'number' ||
    typeof s.signature !== 'string'
  ) {
    return false;
  }
  // Freshness: the salt carries the issue time (base36).
  const issuedAt = parseInt(s.salt.split('.')[0] ?? '', 36);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > TTL_MS) return false;
  // Authenticity: the challenge was signed by us (client cannot forge it).
  if (!timingSafeEqualHex(hmac(s.challenge), s.signature)) return false;
  // Proof of work: the number actually reproduces the challenge.
  if (!Number.isInteger(s.number) || s.number < 0 || s.number > MAX_VERIFY) return false;
  return sha256(s.salt + s.number) === s.challenge;
}
