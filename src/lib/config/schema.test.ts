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

  const withConfirmation = (confirmation: unknown) =>
    AppConfigSchema.safeParse({
      ...minimal,
      delivery: { email: { enabled: false, confirmation } },
    });

  it('defaults the confirmation texts to empty overrides', () => {
    const result = AppConfigSchema.safeParse(minimal);
    expect(result.success && result.data.delivery.email.confirmation).toEqual({});
  });

  it('accepts confirmation texts for some locales only', () => {
    const result = withConfirmation({
      subject: { de: 'Eingang {reference}' },
      body: { en: 'Hello {name},\n\nwe got {reference}.\n{orgName}\n' },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.delivery.email.confirmation.body?.en).toBe(
      'Hello {name},\n\nwe got {reference}.\n{orgName}',
    );
  });

  it('rejects a confirmation text with an unknown placeholder', () => {
    expect(withConfirmation({ subject: { de: 'Eingang {refrence}' } }).success).toBe(false);
  });

  it('rejects a confirmation text for a locale the portal does not offer', () => {
    expect(withConfirmation({ subject: { pl: 'Potwierdzenie {reference}' } }).success).toBe(false);
  });

  it('rejects a multi-line confirmation subject', () => {
    expect(withConfirmation({ subject: { de: 'Eingang\n{reference}' } }).success).toBe(false);
  });

  it('rejects an invalid hex brand colour', () => {
    const result = AppConfigSchema.safeParse({
      ...minimal,
      branding: { orgName: 'Test Org', primaryColor: 'red' },
    });
    expect(result.success).toBe(false);
  });
});
