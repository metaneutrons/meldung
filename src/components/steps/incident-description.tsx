'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { TextField, TextareaField, SelectField } from '@/components/ui';

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

  return (
    <div className="space-y-5">
      <TextareaField
        label={t('description.description')}
        required
        rows={4}
        placeholder={t('description.descriptionPlaceholder')}
        value={description}
        onChange={(e) => update({ description: e.target.value })}
      />
      <TextField
        label={t('description.howDiscovered')}
        value={howDiscovered}
        onChange={(e) => update({ howDiscovered: e.target.value })}
      />
      <SelectField
        label={t('description.attackVector')}
        value={attackVector}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => update({ attackVector: e.target.value })}
      >
        <option value="">{t('classification.selectPlaceholder')}</option>
        {ATTACK_VECTORS.map((v) => (
          <option key={v} value={v}>
            {t(`description.vectors.${v}`)}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
