'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { CheckboxGroup, SegmentedControl, TextField } from '@/components/ui';

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
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ [field]: next });
  };

  const dataOptions = DATA_CATEGORY_KEYS.map((k) => ({
    value: k,
    label: t(`gdpr.dataCategoryOptions.${k}`),
  }));
  const personOptions = PERSON_CATEGORY_KEYS.map((k) => ({
    value: k,
    label: t(`gdpr.personCategoryOptions.${k}`),
  }));
  const breachOptions = (['yes', 'no', 'unknown'] as const).map((v) => ({
    value: v,
    label: t(`options.${v}`),
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning">
        <strong>{t('gdpr.infoTitle')}</strong>
        <p className="mt-1">{t('gdpr.infoText')}</p>
      </div>

      <CheckboxGroup
        legend={t('gdpr.dataCategories')}
        options={dataOptions}
        values={dataCategories}
        onToggle={(v) => toggleArray('dataCategories', v)}
      />
      <CheckboxGroup
        legend={t('gdpr.personCategories')}
        options={personOptions}
        values={personCategories}
        onToggle={(v) => toggleArray('personCategories', v)}
      />

      <TextField
        label={t('gdpr.estimatedRecords')}
        type="number"
        value={estimatedRecords}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          update({ estimatedRecords: e.target.value })
        }
      />
      <TextField
        label={t('gdpr.dpoContact')}
        value={dpoContact}
        onChange={(e: ChangeEvent<HTMLInputElement>) => update({ dpoContact: e.target.value })}
      />

      <SegmentedControl
        legend={t('gdpr.isBreach')}
        options={breachOptions}
        value={isGdprBreach}
        onChange={(v) => update({ isGdprBreach: v as 'yes' | 'no' | 'unknown' })}
      />
    </div>
  );
}
