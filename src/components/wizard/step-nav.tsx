'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { cn, focusRing } from '@/lib/utils';

interface StepNavProps {
  steps: { id: string; title: string }[];
  current: number;
  onSelect: (index: number) => void;
}

export function StepNav({ steps, current, onSelect }: StepNavProps) {
  const t = useTranslations('wizard');
  const navRef = useRef<HTMLDivElement>(null);

  // Keep the active tab scrolled into view.
  useEffect(() => {
    const btn = navRef.current?.querySelector<HTMLElement>(`[data-step="${current}"]`);
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [current]);

  return (
    <nav
      className="hidden border-b border-border bg-surface pt-2 md:block"
      role="tablist"
      aria-label={t('stepNavigation')}
    >
      <div
        ref={navRef}
        className="scrollbar-none mx-auto flex max-w-5xl items-center gap-0 overflow-x-auto px-4"
      >
        {steps.map((step, i) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-controls={`step-panel-${step.id}`}
            data-step={i}
            onClick={() => onSelect(i)}
            className={cn(
              'relative shrink-0 px-4 py-3 text-center text-xs font-medium transition',
              focusRing,
              i === current
                ? 'text-brand'
                : i < current
                  ? 'text-fg-muted hover:text-fg'
                  : 'text-fg-subtle hover:text-fg-muted',
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  i === current
                    ? 'bg-brand text-brand-fg'
                    : i < current
                      ? 'bg-border-strong text-fg'
                      : 'bg-surface-2 text-fg-subtle',
                )}
              >
                {i + 1}
              </span>
              {step.title}
            </span>
            {i === current && (
              <motion.div
                layoutId="stepIndicator"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-brand"
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
