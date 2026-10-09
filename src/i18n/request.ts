import * as rootParams from 'next/root-params';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { applyOverrides } from '@/lib/texts';
import { routing } from './routing';

export default getRequestConfig(async ({ locale: requested }) => {
  // Route handlers (the report e-mail, PDF and tickets) pass the report's
  // locale explicitly: next/root-params is not available there. Everything
  // rendered under app/[locale] reads the segment through root params.
  const candidate = requested ?? (await rootParams.locale());
  const locale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;

  // A dynamic import of JSON resolves to `any`. Naming the shape here keeps
  // the untyped value from spreading into the message object below.
  interface MessageModule {
    default: Record<string, unknown>;
  }
  const [ui, taxonomy, report] = (await Promise.all([
    import(`./messages/${locale}.json`),
    import(`./messages/taxonomy.${locale}.json`),
    import(`./messages/report.${locale}.json`),
  ])) as [MessageModule, MessageModule, MessageModule];

  // The deployment's custom texts are laid over the built-in defaults here,
  // so every consumer (pages, PDF, e-mails, tickets) sees the same wording.
  const texts = applyOverrides(locale, {
    ui: ui.default,
    taxonomy: taxonomy.default,
    report: report.default,
  });

  return {
    locale,
    messages: { ...texts.ui, taxonomy: texts.taxonomy, report: texts.report },
  };
});
