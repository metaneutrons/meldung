'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';

const inputClass = 'h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800';
const labelClass = 'mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-300';
const radioClass = 'h-4 w-4 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]';

export function MeasuresTaken() {
  const t = useTranslations('steps');
  const { measuresTaken, isResolved, recommendedActions, update } = useFormStore();

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="measures-taken" className={labelClass}>{t('measures.measuresTaken')}</label>
        <textarea
          id="measures-taken"
          rows={3}
          value={measuresTaken}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update({ measuresTaken: e.target.value })}
          className={inputClass}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>{t('measures.isResolved')}</legend>
        <div className="flex flex-wrap gap-4 p-3">
          {(['yes', 'no'] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="isResolved"
                value={opt}
                checked={isResolved === opt}
                onChange={() => update({ isResolved: opt })}
                className={radioClass}
              />
              {t(`options.${opt}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="recommended-actions" className={labelClass}>{t('measures.recommendedActions')}</label>
        <textarea
          id="recommended-actions"
          rows={2}
          value={recommendedActions}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update({ recommendedActions: e.target.value })}
          className={inputClass}
        />
      </div>
    </div>
  );
}
