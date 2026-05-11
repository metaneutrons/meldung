'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function setThemeCookie(theme: Theme) {
  document.cookie = `meldung-theme=${theme};path=/;max-age=31536000;SameSite=Lax`;
}

interface ThemeProviderProps {
  children: ReactNode;
  serverTheme?: Theme;
}

export function ThemeProvider({ children, serverTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(serverTheme ?? 'light');

  useEffect(() => {
    // On first mount, reconcile: localStorage is source of truth for user preference
    const stored = localStorage.getItem('meldung-theme') as Theme | null;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved: Theme = stored ?? (systemDark ? 'dark' : 'light');

    // Only update if different from server-rendered value
    if (resolved !== (serverTheme ?? 'light')) {
      setTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      setThemeCookie(resolved);
    }

    // Sync localStorage → cookie for future server renders
    if (stored && stored !== serverTheme) {
      setThemeCookie(stored);
    }

    // If no stored preference, set cookie from system preference
    if (!stored) {
      setThemeCookie(resolved);
      localStorage.setItem('meldung-theme', resolved);
    }

    // Listen for system changes (only if no explicit user override)
    if (!stored) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        const next: Theme = e.matches ? 'dark' : 'light';
        setTheme(next);
        document.documentElement.classList.toggle('dark', e.matches);
        setThemeCookie(next);
        localStorage.setItem('meldung-theme', next);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    return undefined;
  }, [serverTheme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('meldung-theme', next);
      setThemeCookie(next);
      return next;
    });
  }, []);

  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>;
}
