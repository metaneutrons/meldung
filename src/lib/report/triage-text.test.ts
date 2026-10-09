import { describe, expect, it, vi } from 'vitest';
import { createTranslator } from 'next-intl';
import reportDe from '@/i18n/messages/report.de.json';
import reportEn from '@/i18n/messages/report.en.json';

const messages: Record<string, unknown> = { de: { report: reportDe }, en: { report: reportEn } };

// Real messages through next-intl's own translator: the ICU placeholders and
// every reason key are exercised, only the request scope is replaced.
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(({ locale, namespace }: { locale: string; namespace: string }) =>
    Promise.resolve(
      createTranslator({
        locale,
        messages: messages[locale] as Record<string, never>,
        namespace: namespace as never,
      }),
    ),
  ),
}));

const { formatTriageText } = await import('./model');

describe('formatTriageText', () => {
  it("writes the team's note with level, reasons and the 72-hour orientation", async () => {
    const text = await formatTriageText(
      {
        level: 'P1',
        reasons: ['attackOngoing', 'personalData', 'personsUnknown'],
        orientation72h: '2026-10-13T08:00:00.000Z',
        version: 1,
      },
      'de',
    );
    expect(text).toBe(
      [
        'Vorläufige Priorität: P1 (sofort)',
        'Automatisch aus den Angaben des Melders berechnet, keine Risikobewertung nach Art. 33 DSGVO.',
        '',
        'Gründe:',
        '- Angriff möglicherweise im Gange',
        '- Personenbezogene Daten möglicherweise betroffen, Meldefrist prüfen',
        '- Anzahl betroffener Personen unbekannt',
        '',
        'Orientierung: Eingang plus 72 Stunden = 2026-10-13 08:00 UTC',
      ].join('\n'),
    );
  });

  it('leaves the orientation out without personal data', async () => {
    const text = await formatTriageText(
      { level: 'P4', reasons: ['noUrgency'], orientation72h: null, version: 1 },
      'en',
    );
    expect(text).toContain('Preliminary priority: P4 (low)');
    expect(text).not.toContain('72 hours');
  });
});
