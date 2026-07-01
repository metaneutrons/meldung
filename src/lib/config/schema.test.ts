import { describe, expect, it } from 'vitest';
import { AppConfigSchema } from './schema';

describe('AppConfigSchema', () => {
  const minimal = {
    branding: { orgName: 'Test Org' },
    delivery: { email: { enabled: false } },
  };

  it('applies defaults for omitted sections (Zod v4 .prefault)', () => {
    const result = AppConfigSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const c = result.data;
    // Prefaulted delivery channels default to disabled when omitted.
    expect(c.delivery.znuny.enabled).toBe(false);
    expect(c.delivery.otobo.enabled).toBe(false);
    expect(c.delivery.webhook.enabled).toBe(false);
    expect(c.delivery.zammad.enabled).toBe(false);
    // Prefaulted top-level sections receive their inner defaults.
    expect(c.persistence.enabled).toBe(false);
    expect(c.persistence.driver).toBe('sqlite');
    expect(c.auth.provider).toBe('oidc');
    expect(c.captcha.difficulty).toBe(120_000);
    // Branding colour + reference defaults.
    expect(c.branding.primaryColor).toBe('#38b449');
    expect(c.referencePrefix).toBe('INC');
  });

  it('rejects a non-URL channel baseUrl (z.url)', () => {
    const result = AppConfigSchema.safeParse({
      ...minimal,
      delivery: {
        email: { enabled: false },
        zammad: { enabled: true, config: { baseUrl: 'not-a-url', token: 't' } },
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid customerEmailFallback (z.email)', () => {
    const result = AppConfigSchema.safeParse({
      ...minimal,
      delivery: {
        email: { enabled: false },
        zammad: {
          enabled: true,
          config: {
            baseUrl: 'https://zammad.example.com',
            token: 't',
            customerEmailFallback: 'nope',
          },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid hex brand colour', () => {
    const result = AppConfigSchema.safeParse({
      ...minimal,
      branding: { orgName: 'Test Org', primaryColor: 'red' },
    });
    expect(result.success).toBe(false);
  });
});
