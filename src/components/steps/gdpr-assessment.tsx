'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';

const inputClass = 'h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800';
const labelClass = 'mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-300';
const checkboxClass = 'h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]';
const radioClass = 'h-4 w-4 border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]';

const DATA_CATEGORY_KEYS = [
  'nameAddress',
  'contactData',
  'dateOfBirth',
  'credentials',
  'financialData',
  'healthData',
  'biometricData',
  'locationData',
  'onlineIdentifiers',
  'employmentData',
  'educationData',
  'socialSecurityId',
  'religiousPolitical',
  'sexualOrientation',
  'criminalRecords',
  'communicationContent',
  'other',
] as const;

const PERSON_CATEGORY_KEYS = [
  'students',
  'staff',
  'applicants',
  'externalPartners',
  'alumni',
  'minors',
  'customers',
  'patients',
] as const;

export function GdprAssessment() {
  const t = useTranslations('steps');
  const { dataCategories, personCategories, estimatedRecords, dpoContact, isGdprBreach, update } =
    useFormStore();

  const toggleArray = (field: 'dataCategories' | 'personCategories', value: string) => {
    const current = field === 'dataCategories' ? dataCategories : personCategories;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    update({ [field]: next });
  };

  return (
    <div className="space-y-6">
      <div className="rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200 mb-6">
        <strong>{t('gdpr.infoTitle')}</strong>
        <p className="mt-1">{t('gdpr.infoText')}</p>
      </div>

      <fieldset>
        <legend className={labelClass}>{t('gdpr.dataCategories')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
          {DATA_CATEGORY_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={dataCategories.includes(key)}
                onChange={() => toggleArray('dataCategories', key)}
                className={checkboxClass}
              />
              <span className="text-gray-700 dark:text-gray-300">{t(`gdpr.dataCategoryOptions.${key}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>{t('gdpr.personCategories')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
          {PERSON_CATEGORY_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={personCategories.includes(key)}
                onChange={() => toggleArray('personCategories', key)}
                className={checkboxClass}
              />
              <span className="text-gray-700 dark:text-gray-300">{t(`gdpr.personCategoryOptions.${key}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="estimated-records" className={labelClass}>{t('gdpr.estimatedRecords')}</label>
        <input
          id="estimated-records"
          type="number"
          value={estimatedRecords}
          onChange={(e: ChangeEvent<HTMLInputElement>) => update({ estimatedRecords: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="dpo-contact" className={labelClass}>{t('gdpr.dpoContact')}</label>
        <input
          id="dpo-contact"
          type="text"
          value={dpoContact}
          onChange={(e: ChangeEvent<HTMLInputElement>) => update({ dpoContact: e.target.value })}
          className={inputClass}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>{t('gdpr.isBreach')}</legend>
        <div className="flex flex-wrap gap-4 p-3">
          {(['yes', 'no', 'unknown'] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="isGdprBreach"
                value={opt}
                checked={isGdprBreach === opt}
                onChange={() => update({ isGdprBreach: opt })}
                className={radioClass}
              />
              {t(`options.${opt}`)}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
