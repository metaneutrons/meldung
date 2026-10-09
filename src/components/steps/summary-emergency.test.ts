import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { routing } from '@/i18n/routing';
import { EmergencyHint } from './summary';

// Rendered with the real messages of every locale: a missing key or a broken
// placeholder fails here instead of in front of a reporter. Whether the hint
// shows at all is isEmergency(), tested in triage.test.ts.
const render = async (locale: string, phone?: string) => {
  const messages = ((await import(`@/i18n/messages/${locale}.json`)) as { default: object })
    .default;
  // The provider declares children as a required prop; they are passed as an
  // argument here, so the props object is typed without them.
  const props = { locale, messages, timeZone: 'UTC' } as ComponentProps<
    typeof NextIntlClientProvider
  >;
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, props, createElement(EmergencyHint, { phone })),
  );
};

describe('EmergencyHint', () => {
  it('asks the reporter to call when a number is configured', async () => {
    const html = await render('de', '+49 511 000000');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Möglicherweise läuft ein Angriff.');
    expect(html).toContain('Rufen Sie zusätzlich sofort an: +49 511 000000');
    expect(html).toContain('Arbeiten Sie am betroffenen Gerät nicht weiter');
  });

  it('leaves the call out without a number', async () => {
    const html = await render('de');
    expect(html).not.toContain('Rufen Sie zusätzlich sofort an');
  });

  it.each(routing.locales)('%s fills in the number', async (locale) => {
    expect(await render(locale, 'PHONE-123')).toContain('PHONE-123');
  });
});
