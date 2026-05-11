'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';

const inputClass = 'h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800';
const labelClass = 'mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-300';
const selectClass =
  'w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

const ATTACK_VECTORS = [
  'email',
  'web',
  'network',
  'physical',
  'social-engineering',
  'supply-chain',
  'insider',
  'unknown',
  'other',
] as const;

export function IncidentDescription() {
  const t = useTranslations('steps');
  const { description, howDiscovered, attackVector, update } = useFormStore();

  const onTextChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    update({ [field]: e.target.value });
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="description" className={labelClass}>{t('description.description')} *</label>
        <textarea
          id="description"
          required
          rows={4}
          placeholder={t('description.descriptionPlaceholder')}
          value={description}
          onChange={onTextChange('description')}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label htmlFor="how-discovered" className={labelClass}>{t('description.howDiscovered')}</label>
        <input
          id="how-discovered"
          type="text"
          value={howDiscovered}
          onChange={onTextChange('howDiscovered')}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="attack-vector" className={labelClass}>{t('description.attackVector')}</label>
        <select id="attack-vector" value={attackVector} onChange={onTextChange('attackVector')} className={selectClass}>
          <option value="">{t('classification.selectPlaceholder')}</option>
          {ATTACK_VECTORS.map((v) => (
            <option key={v} value={v}>{t(`description.vectors.${v}`)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
