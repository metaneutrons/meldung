'use client';

import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { RadioGroup, SegmentedControl } from '@/components/ui';

export function ImpactAssessment() {
  const t = useTranslations('steps');
  const { functionalImpact, informationImpact, recoverability, personalDataInvolved, update } =
    useFormStore();

  const functionalOptions = (['none', 'low', 'medium', 'high'] as const).map((v) => ({
    value: v,
    label: t(`impact.functionalOptions.${v}`),
  }));
  const informationOptions = (
    ['none', 'privacy-breach', 'proprietary-breach', 'integrity-loss'] as const
  ).map((v) => ({ value: v, label: t(`impact.informationOptions.${v}`) }));
  const recoverabilityOptions = (
    ['regular', 'supplemented', 'extended', 'not-recoverable'] as const
  ).map((v) => ({ value: v, label: t(`impact.recoverabilityOptions.${v}`) }));
  const personalDataOptions = (['yes', 'no', 'unknown'] as const).map((v) => ({
    value: v,
    label: t(`options.${v}`),
  }));

  return (
    <div className="space-y-6">
      <RadioGroup
        name="functionalImpact"
        legend={t('impact.functional')}
        required
        options={functionalOptions}
        value={functionalImpact}
        onChange={(v) => update({ functionalImpact: v })}
      />
      <RadioGroup
        name="informationImpact"
        legend={t('impact.information')}
        required
        options={informationOptions}
        value={informationImpact}
        onChange={(v) => update({ informationImpact: v })}
      />
      <RadioGroup
        name="recoverability"
        legend={t('impact.recoverability')}
        required
        options={recoverabilityOptions}
        value={recoverability}
        onChange={(v) => update({ recoverability: v })}
      />
      <SegmentedControl
        legend={t('impact.personalData')}
        required
        options={personalDataOptions}
        value={personalDataInvolved}
        onChange={(v) => update({ personalDataInvolved: v as 'yes' | 'no' | 'unknown' })}
      />
      {(personalDataInvolved === 'yes' || personalDataInvolved === 'unknown') && (
        <div className="mt-3 rounded-xl border border-info-border bg-info-bg p-3 text-sm text-info">
          💡 {t('impact.personalDataHint')}
        </div>
      )}
    </div>
  );
}
