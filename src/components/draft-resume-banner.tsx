'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { Button } from '@/components/ui';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-elevated">
        <p className="text-sm text-fg-muted">{t('found')}</p>
        <div className="mt-5 flex gap-3">
          <Button className="flex-1" onClick={() => setDismissed(true)}>
            {t('resume')}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              clearDraft();
              setDismissed(true);
            }}
          >
            {t('discard')}
          </Button>
        </div>
      </div>
    </div>
  );
}
