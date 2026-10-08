import { describe, expect, it, vi } from 'vitest';
import { routing } from '@/i18n/routing';
import { unknownPlaceholders } from '@/lib/mail-template';
import reportDe from '@/i18n/messages/report.de.json';
import reportEn from '@/i18n/messages/report.en.json';
import reportEs from '@/i18n/messages/report.es.json';
import reportFr from '@/i18n/messages/report.fr.json';
import reportIt from '@/i18n/messages/report.it.json';
import reportTr from '@/i18n/messages/report.tr.json';
import reportRu from '@/i18n/messages/report.ru.json';
import reportUk from '@/i18n/messages/report.uk.json';

interface ReportMessages {
  confirmationMail: { subject: string; body: string };
}

const reports: Record<string, ReportMessages> = {
  de: reportDe,
  en: reportEn,
  es: reportEs,
  fr: reportFr,
  it: reportIt,
  tr: reportTr,
  ru: reportRu,
  uk: reportUk,
};

// buildConfirmationMail reads its defaults through next-intl, which needs a
// request scope; serve the message files directly instead.
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(({ locale }: { locale: string }) =>
    Promise.resolve({
      raw: (key: string) =>
        key
          .split('.')
          .reduce<unknown>(
            (node, part) => (node as Record<string, unknown> | undefined)?.[part],
            reports[locale],
          ),
    }),
  ),
}));

const { buildConfirmationMail } = await import('./model');

const values = { name: 'Ada Lovelace', orgName: 'ACME' };

describe('confirmation mail defaults', () => {
  it('exist for every locale the portal offers', () => {
    expect(Object.keys(reports).sort()).toEqual([...routing.locales].sort());
  });

  it.each(Object.entries(reports))(
    '%s: complete, single-line subject, known placeholders',
    (_, r) => {
      const { subject, body } = r.confirmationMail;
      expect(subject).toContain('{reference}');
      expect(subject).not.toMatch(/[\r\n]/);
      expect(body).toContain('{reference}');
      expect(unknownPlaceholders(subject + body)).toEqual([]);
    },
  );
});

describe('buildConfirmationMail', () => {
  it("uses the report language's default when nothing is configured", async () => {
    const mail = await buildConfirmationMail('INC-1', 'de', values, {});
    expect(mail.subject).toBe('Eingangsbestätigung Ihrer Meldung INC-1');
    expect(mail.text).toContain('Guten Tag Ada Lovelace,');
    expect(mail.text).toContain('Referenznummer: INC-1');
    expect(mail.text.trimEnd().endsWith('ACME')).toBe(true);
  });

  it('prefers the configured text and falls back per locale', async () => {
    const overrides = { subject: { de: 'Ihre Meldung {reference} bei {orgName}' } };
    const de = await buildConfirmationMail('INC-1', 'de', values, overrides);
    expect(de.subject).toBe('Ihre Meldung INC-1 bei ACME');
    // The body has no override, so it stays the German default.
    expect(de.text).toContain('Referenznummer: INC-1');
    // English has no override at all.
    const en = await buildConfirmationMail('INC-1', 'en', values, overrides);
    expect(en.subject).toBe('Confirmation of your incident report INC-1');
  });

  it('keeps a line break from the name field out of the subject', async () => {
    const mail = await buildConfirmationMail(
      'INC-1',
      'en',
      { ...values, name: 'Ada\r\nBcc: x@y.z' },
      { subject: { en: 'Report {reference} from {name}' } },
    );
    expect(mail.subject).toBe('Report INC-1 from Ada Bcc: x@y.z');
  });
});
