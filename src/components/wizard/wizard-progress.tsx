'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function WizardProgress({ step, total }: { step: number; total: number }) {
  const tc = useTranslations('common');
  const reduce = useReducedMotion();
  const progress = ((step + 1) / total) * 100;

  return (
    <div
      className="h-1 bg-surface-2"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={tc('step', { current: String(step + 1), total: String(total) })}
    >
      <motion.div
        className="h-full rounded-r-full bg-brand"
        animate={{ width: `${progress}%` }}
        transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}
