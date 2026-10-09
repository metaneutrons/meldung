import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { routing } from '@/i18n/routing';
import { EmergencyHint, telHref } from './summary';

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
    expect(html).toContain('Rufen Sie zusätzlich sofort an: <a href="tel:+49511000000"');
    expect(html).toContain('>+49 511 000000</a>');
    expect(html).toContain('Arbeiten Sie am betroffenen Gerät nicht weiter');
  });

  it('shows a number that cannot be dialled as plain text', async () => {
    const html = await render('de', '+49 511 1234 (24/7)');
    expect(html).toContain('Rufen Sie zusätzlich sofort an: +49 511 1234 (24/7)');
    expect(html).not.toContain('href=');
  });

  it('leaves the call out without a number', async () => {
    const html = await render('de');
    expect(html).not.toContain('Rufen Sie zusätzlich sofort an');
  });

  it.each(routing.locales)('%s fills in the number', async (locale) => {
    expect(await render(locale, 'PHONE-123')).toContain('PHONE-123');
  });
});

describe('telHref', () => {
  it.each([
    ['+49 511 000000', 'tel:+49511000000'],
    ['0511 9296-1234', 'tel:051192961234'],
    ['+49 511/9296.1234', 'tel:+4951192961234'],
  ])('dials %s', (phone, href) => {
    expect(telHref(phone)).toBe(href);
  });

  it.each(['+49 511 1234 (24/7)', '+49 (0)511 1234', 'Pforte', '+1', '1+2'])(
    'leaves %s as text',
    (phone) => {
      expect(telHref(phone)).toBeNull();
    },
  );
});
