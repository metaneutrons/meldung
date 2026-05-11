'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';

const inputClass = 'h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800';
const labelClass = 'mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-300';

export function IncidentTimeline() {
  const t = useTranslations('steps');
  const { discoveryDate, occurrenceDate, isOngoing, update } = useFormStore();

  const onChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    update({ [field]: e.target.value });
  };

  const options = ['yes', 'no', 'unknown'] as const;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="discovery-date" className={labelClass}>{t('timeline.discoveryDate')} *</label>
        <input id="discovery-date" type="datetime-local" required value={discoveryDate} onChange={onChange('discoveryDate')} className={inputClass} />
      </div>

      <div>
        <label htmlFor="occurrence-date" className={labelClass}>{t('timeline.occurrenceDate')}</label>
        <input id="occurrence-date" type="datetime-local" value={occurrenceDate} onChange={onChange('occurrenceDate')} className={inputClass} />
      </div>

      <fieldset>
        <legend className={labelClass}>{t('timeline.isResolved')}</legend>
        <div className="flex gap-4 mt-2">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="isOngoing"
                value={opt}
                checked={isOngoing === opt}
                onChange={onChange('isOngoing')}
                className="accent-[var(--color-primary)]"
              />
              {t(`options.${opt}`)}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
