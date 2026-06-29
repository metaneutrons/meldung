'use client';

import { type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { TextField, SegmentedControl } from '@/components/ui';

export function IncidentTimeline() {
  const t = useTranslations('steps');
  const { discoveryDate, occurrenceDate, isOngoing, update } = useFormStore();

  const onChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    update({ [field]: e.target.value });
  };

  const options = (['yes', 'no', 'unknown'] as const).map((v) => ({
    value: v,
    label: t(`options.${v}`),
  }));

  return (
    <div className="space-y-5">
      <TextField
        label={t('timeline.discoveryDate')}
        required
        type="datetime-local"
        value={discoveryDate}
        onChange={onChange('discoveryDate')}
      />
      <TextField
        label={t('timeline.occurrenceDate')}
        type="datetime-local"
        value={occurrenceDate}
        onChange={onChange('occurrenceDate')}
      />
      <SegmentedControl
        legend={t('timeline.isResolved')}
        options={options}
        value={isOngoing}
        onChange={(v) => update({ isOngoing: v as 'yes' | 'no' | 'unknown' })}
      />
    </div>
  );
}
