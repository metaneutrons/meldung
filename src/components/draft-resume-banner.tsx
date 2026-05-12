'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';

export function DraftResumeBanner() {
  const t = useTranslations('draft');
  const [dismissed, setDismissed] = useState(false);
  const savedAt = useFormStore((s) => s._savedAt);
  const reporterName = useFormStore((s) => s.reporterName);
  const description = useFormStore((s) => s.description);
  const clearDraft = useFormStore((s) => s.clearDraft);

  const hasDraft = savedAt !== '' && (reporterName !== '' || description !== '');

  if (dismissed || !hasDraft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t('found')}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex-1 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {t('resume')}
          </button>
          <button
            type="button"
            onClick={() => { clearDraft(); setDismissed(true); }}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t('discard')}
          </button>
        </div>
      </div>
    </div>
  );
}
