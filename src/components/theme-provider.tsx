'use client';

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react';

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

let listeners: Array<() => void> = [];
function emitChange() {
  listeners.forEach((l) => l());
}

function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'light';
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

interface ThemeProviderProps {
  children: ReactNode;
  serverTheme?: Theme;
}

export function ThemeProvider({ children, serverTheme }: ThemeProviderProps) {
  // Reconcile on first client render
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('meldung-theme') as Theme | null;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved: Theme = stored ?? (systemDark ? 'dark' : 'light');
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    if (resolved !== current) {
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    }
    if (!stored || stored !== serverTheme) {
      setThemeCookie(resolved);
      if (!stored) localStorage.setItem('meldung-theme', resolved);
    }
  }

  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => serverTheme ?? getServerSnapshot());

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('meldung-theme', next);
    setThemeCookie(next);
    emitChange();
  }, []);

  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>;
}
