'use client';

import { hasLocale, useLocale, useTranslations } from 'next-intl';
import { Languages } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { useRouter, usePathname } from '@/i18n/navigation';
import { cn, focusRing } from '@/lib/utils';

/**
 * Each language named in itself. The codes alone misled: "UK" reads as the
 * United Kingdom, not Ukrainian.
 */
const NATIVE_NAMES: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  tr: 'Türkçe',
  ru: 'Русский',
  uk: 'Українська',
};

/**
 * A native select: it takes the width of one language name at any screen
 * size, and phones open their own picker for it.
 */
export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const th = useTranslations('header');

  return (
    <label className="relative flex items-center">
      <span className="sr-only">{th('language')}</span>
      <Languages
        aria-hidden="true"
        className="pointer-events-none absolute left-2 h-4 w-4 text-fg-subtle"
      />
      <select
        value={locale}
        onChange={(e) => {
          const next = e.target.value;
          if (hasLocale(routing.locales, next)) router.replace(pathname, { locale: next });
        }}
        className={cn(
          'cursor-pointer appearance-none rounded-md bg-transparent py-1 pr-2 pl-8 text-sm font-medium text-fg-muted transition hover:bg-surface-2 hover:text-fg',
          focusRing,
        )}
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc} lang={loc}>
            {NATIVE_NAMES[loc]}
          </option>
        ))}
      </select>
    </label>
  );
}
