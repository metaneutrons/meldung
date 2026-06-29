'use client';

import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { TextareaField, SegmentedControl } from '@/components/ui';

export function MeasuresTaken() {
  const t = useTranslations('steps');
  const { measuresTaken, isResolved, recommendedActions, update } = useFormStore();

  const options = (['yes', 'no'] as const).map((v) => ({ value: v, label: t(`options.${v}`) }));

  return (
    <div className="space-y-5">
      <TextareaField
        label={t('measures.measuresTaken')}
        rows={3}
        value={measuresTaken}
        onChange={(e) => update({ measuresTaken: e.target.value })}
      />
      <SegmentedControl
        legend={t('measures.isResolved')}
        options={options}
        value={isResolved}
        onChange={(v) => update({ isResolved: v as 'yes' | 'no' })}
      />
      <TextareaField
        label={t('measures.recommendedActions')}
        rows={2}
        value={recommendedActions}
        onChange={(e) => update({ recommendedActions: e.target.value })}
      />
    </div>
  );
}
