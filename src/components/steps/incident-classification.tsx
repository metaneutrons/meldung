'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { ENISA_RSIT_TAXONOMY } from '@/lib/taxonomy/enisa-rsit';
import { SelectField } from '@/components/ui';

export function IncidentClassification() {
  const t = useTranslations('steps');
  const tax = useTranslations('taxonomy');
  const { incidentCategory, incidentSubType, update } = useFormStore();

  const selectedCategory = ENISA_RSIT_TAXONOMY.find((c) => c.value === incidentCategory);
  const selectedSubType = selectedCategory?.entries.find((e) => e === incidentSubType);

  return (
    <div className="space-y-5">
      <SelectField
        label={t('classification.category')}
        required
        value={incidentCategory}
        hint={
          selectedCategory ? tax(`categories.${selectedCategory.value}.description`) : undefined
        }
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          update({ incidentCategory: e.target.value, incidentSubType: '' })
        }
      >
        <option value="">{t('classification.selectPlaceholder')}</option>
        <option value="undetermined">{t('classification.undetermined')}</option>
        {ENISA_RSIT_TAXONOMY.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {tax(`categories.${cat.value}.label`)}
          </option>
        ))}
      </SelectField>

      <SelectField
        label={t('classification.subType')}
        required
        value={incidentSubType}
        hint={selectedSubType ? tax(`entries.${selectedSubType}.description`) : undefined}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          update({ incidentSubType: e.target.value })
        }
      >
        <option value="">{t('classification.selectPlaceholder')}</option>
        {selectedCategory?.entries.map((entry) => (
          <option key={entry} value={entry}>
            {tax(`entries.${entry}.label`)}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
