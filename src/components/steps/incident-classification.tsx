'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { ENISA_RSIT_TAXONOMY } from '@/lib/taxonomy/enisa-rsit';

const selectClass =
  'w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
const labelClass = 'mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-300';

export function IncidentClassification() {
  const t = useTranslations('steps');
  const { incidentCategory, incidentSubType, update } = useFormStore();

  const selectedCategory = ENISA_RSIT_TAXONOMY.find((c) => c.value === incidentCategory);

  const onCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    update({ incidentCategory: e.target.value, incidentSubType: '' });
  };

  const onSubTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    update({ incidentSubType: e.target.value });
  };

  const selectedSubType = selectedCategory?.entries.find((e) => e.value === incidentSubType);

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="incident-category" className={labelClass}>{t('classification.category')} *</label>
        <select id="incident-category" value={incidentCategory} onChange={onCategoryChange} className={selectClass}>
          <option value="">{t('classification.selectPlaceholder')}</option>
          <option value="undetermined">{t('classification.undetermined')}</option>
          {ENISA_RSIT_TAXONOMY.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {selectedCategory && (
          <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
            {selectedCategory.description}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="incident-subtype" className={labelClass}>{t('classification.subType')} *</label>
        <select id="incident-subtype" value={incidentSubType} onChange={onSubTypeChange} className={selectClass}>
          <option value="">{t('classification.selectPlaceholder')}</option>
          {selectedCategory?.entries.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
        {selectedSubType && (
          <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
            {selectedSubType.description}
          </p>
        )}
      </div>
    </div>
  );
}
