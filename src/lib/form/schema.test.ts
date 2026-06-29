import { describe, it, expect } from 'vitest';
import { submissionSchema, formDataSchema, isReporterValid, EMAIL_RE } from './schema';

const valid = { reporterName: 'Jane Doe', email: 'jane@example.com', phone: '+49 511 1234' };

describe('submissionSchema', () => {
  it('accepts a minimal valid submission', () => {
    expect(submissionSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing required reporter fields', () => {
    expect(submissionSchema.safeParse({ ...valid, reporterName: '' }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, phone: '   ' }).success).toBe(false);
  });

  it('rejects invalid e-mail addresses', () => {
    expect(submissionSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, email: 'a@b' }).success).toBe(false);
  });

  it('enforces length caps (DoS guard)', () => {
    expect(submissionSchema.safeParse({ ...valid, description: 'x'.repeat(20_001) }).success).toBe(
      false,
    );
    expect(submissionSchema.safeParse({ ...valid, description: 'x'.repeat(100) }).success).toBe(
      true,
    );
  });

  it('strips unknown keys (e.g. the injected locale)', () => {
    const result = submissionSchema.safeParse({ ...valid, locale: 'de', injected: 'x' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('locale' in result.data).toBe(false);
      expect('injected' in result.data).toBe(false);
    }
  });
});

describe('formDataSchema defaults', () => {
  it('produces an all-empty initial state', () => {
    const state = formDataSchema.parse({});
    expect(state.affectedSystems).toEqual([]);
    expect(state.isOngoing).toBe('');
    expect(state.reporterName).toBe('');
  });
});

describe('isReporterValid / EMAIL_RE', () => {
  it('validates the reporter triple consistently with the server', () => {
    expect(isReporterValid(valid)).toBe(true);
    expect(isReporterValid({ ...valid, email: 'x' })).toBe(false);
    expect(isReporterValid({ ...valid, reporterName: '  ' })).toBe(false);
  });

  it('matches sane e-mail addresses only', () => {
    expect(EMAIL_RE.test('a@b.co')).toBe(true);
    expect(EMAIL_RE.test('a@b')).toBe(false);
    expect(EMAIL_RE.test('a b@c.de')).toBe(false);
  });
});
