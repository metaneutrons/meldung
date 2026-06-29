'use client';

import { type ReactNode } from 'react';
import { LocaleSwitcher } from './locale-switcher';
import { ThemeToggle } from './theme-toggle';

interface AppHeaderProps {
  orgName: string;
  logoUrl?: string;
  onLogoClick?: () => void;
  /** Rendered inside the sticky header, below the brand row (e.g. progress bar). */
  children?: ReactNode;
}

export function AppHeader({ orgName, logoUrl, onLogoClick, children }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <button type="button" onClick={onLogoClick} className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={orgName} className="h-7 w-auto" />
          ) : (
            <span className="text-sm font-semibold tracking-tight text-fg">{orgName}</span>
          )}
        </button>
        <div className="flex items-center gap-1.5">
          <LocaleSwitcher />
          <span className="mx-1.5 h-4 w-px bg-border" />
          <ThemeToggle />
        </div>
      </div>
      {children}
    </header>
  );
}
