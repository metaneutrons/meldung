import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['de', 'en', 'es', 'fr', 'tr', 'it', 'ru', 'uk'] as const,
  defaultLocale: 'de',
});

export type Locale = (typeof routing.locales)[number];
