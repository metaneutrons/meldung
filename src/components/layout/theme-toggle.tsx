'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn, focusRing } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const th = useTranslations('header');
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && theme === 'dark' ? th('lightMode') : th('darkMode')}
      className={cn(
        'rounded-md p-1.5 text-fg-subtle transition hover:bg-surface-2 hover:text-fg',
        focusRing,
      )}
    >
      {mounted && (theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
    </button>
  );
}
