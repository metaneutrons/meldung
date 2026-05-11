'use client';

import { useState } from 'react';
import { useFormStore } from '@/lib/store/form-store';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

function computeIsStale(savedAt: string): boolean {
  if (savedAt === '') return false;
  return Date.now() - new Date(savedAt).getTime() > TWENTY_FOUR_HOURS;
}

export function DraftResumeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isStale] = useState(() => computeIsStale(useFormStore.getState()._savedAt));
  const savedAt = useFormStore((s) => s._savedAt);
  const reporterName = useFormStore((s) => s.reporterName);
  const description = useFormStore((s) => s.description);
  const clearDraft = useFormStore((s) => s.clearDraft);

  const hasDraft = savedAt !== '' && (reporterName !== '' || description !== '');

  if (dismissed || !hasDraft) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border bg-white p-4 shadow-lg dark:bg-gray-800">
      <p className="mb-3 text-sm">
        {isStale
          ? 'An old draft was found (older than 24h). Resume or discard?'
          : 'A saved draft was found. Resume where you left off?'}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Resume
        </button>
        <button
          type="button"
          onClick={() => {
            clearDraft();
            setDismissed(true);
          }}
          className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
