import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const [ui, taxonomy, report] = await Promise.all([
    import(`./messages/${locale}.json`),
    import(`./messages/taxonomy.${locale}.json`),
    import(`./messages/report.${locale}.json`),
  ]);

  return {
    locale,
    messages: {
      ...ui.default,
      taxonomy: taxonomy.default,
      report: report.default,
    } as Record<string, unknown>,
  };
});
