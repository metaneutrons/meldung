'use client';

import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import {
  AFFECTED_INFORMATION,
  INFORMATION_EFFECTS,
  WORK_IMPACT,
  informationAtStake,
  personalDataFrom,
  toggleChoice,
} from '@/lib/form/schema';
import { CheckboxGroup, RadioGroup } from '@/components/ui';

export function ImpactAssessment() {
  const t = useTranslations('steps');
  const { workImpact, affectedInformation, informationEffects, personalDataInvolved, update } =
    useFormStore();

  const workOptions = WORK_IMPACT.map((v) => ({ value: v, label: t(`impact.workOptions.${v}`) }));
  const informationOptions = AFFECTED_INFORMATION.map((v) => ({
    value: v,
    label: t(`impact.informationOptions.${v}`),
  }));
  const effectOptions = INFORMATION_EFFECTS.map((v) => ({
    value: v,
    label: t(`impact.effectOptions.${v}`),
  }));

  const toggleInformation = (value: string) => {
    const next = toggleChoice(affectedInformation, value) as typeof affectedInformation;
    update({
      affectedInformation: next,
      personalDataInvolved: personalDataFrom(next),
      // Nothing at stake, nothing to describe: drop answers that no longer apply.
      ...(informationAtStake(next) ? {} : { informationEffects: [] }),
    });
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        name="workImpact"
        legend={t('impact.work')}
        required
        options={workOptions}
        value={workImpact}
        onChange={(v) => {
          update({ workImpact: v as typeof workImpact });
        }}
      />
      <CheckboxGroup
        legend={t('impact.information')}
        hint={t('impact.multiple')}
        options={informationOptions}
        values={affectedInformation}
        onToggle={toggleInformation}
        columns={false}
      />
      {informationAtStake(affectedInformation) && (
        <CheckboxGroup
          legend={t('impact.effects')}
          hint={t('impact.multiple')}
          options={effectOptions}
          values={informationEffects}
          onToggle={(v) => {
            update({
              informationEffects: toggleChoice(informationEffects, v) as typeof informationEffects,
            });
          }}
          columns={false}
        />
      )}
      {(personalDataInvolved === 'yes' || personalDataInvolved === 'unknown') && (
        <div className="mt-3 rounded-xl border border-info-border bg-info-bg p-3 text-sm text-info">
          💡 {t('impact.personalDataHint')}
        </div>
      )}
    </div>
  );
}
