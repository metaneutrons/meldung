'use client';

import { useLocale } from 'next-intl';
import { routing, type Locale } from '@/i18n/routing';
import { useRouter, usePathname } from '@/i18n/navigation';
import { cn, focusRing } from '@/lib/utils';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          aria-label={loc.toUpperCase()}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-semibold transition',
            focusRing,
            loc === locale ? 'bg-brand text-brand-fg' : 'text-fg-subtle hover:text-fg',
          )}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </>
  );
}
