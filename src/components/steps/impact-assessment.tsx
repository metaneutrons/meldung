'use client';

import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import {
  AFFECTED_INFORMATION,
  ATTACK_SIGNS,
  INFORMATION_EFFECTS,
  WORK_IMPACT,
  encryptionRelevant,
  informationAtStake,
  personalDataFrom,
  toggleChoice,
} from '@/lib/form/schema';
import { CheckboxGroup, RadioGroup, SegmentedControl } from '@/components/ui';

export function ImpactAssessment() {
  const t = useTranslations('steps');
  const {
    workImpact,
    affectedInformation,
    informationEffects,
    personalDataInvolved,
    attackSigns,
    dataEncrypted,
    update,
  } = useFormStore();

  const workOptions = WORK_IMPACT.map((v) => ({ value: v, label: t(`impact.workOptions.${v}`) }));
  const informationOptions = AFFECTED_INFORMATION.map((v) => ({
    value: v,
    label: t(`impact.informationOptions.${v}`),
  }));
  const effectOptions = INFORMATION_EFFECTS.map((v) => ({
    value: v,
    label: t(`impact.effectOptions.${v}`),
  }));

  const signOptions = ATTACK_SIGNS.map((v) => ({
    value: v,
    label: t(`impact.signOptions.${v}`),
  }));
  const encryptedOptions = (['yes', 'no', 'unknown'] as const).map((v) => ({
    value: v,
    label: t(`options.${v}`),
  }));
  // Dropping an answer that no longer applies keeps the draft and the report
  // free of a stale "encrypted" from a question that has disappeared.
  const clearEncryption = (signs: readonly string[], effects: readonly string[]) =>
    encryptionRelevant(signs, effects) ? {} : { dataEncrypted: '' as const };

  const toggleInformation = (value: string) => {
    const next = toggleChoice(affectedInformation, value) as typeof affectedInformation;
    update({
      affectedInformation: next,
      personalDataInvolved: personalDataFrom(next),
      // Nothing at stake, nothing to describe: drop answers that no longer apply.
      ...(informationAtStake(next)
        ? {}
        : { informationEffects: [], ...clearEncryption(attackSigns, []) }),
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
            const next = toggleChoice(informationEffects, v) as typeof informationEffects;
            update({ informationEffects: next, ...clearEncryption(attackSigns, next) });
          }}
          columns={false}
        />
      )}
      <CheckboxGroup
        legend={t('impact.signs')}
        hint={t('impact.multiple')}
        options={signOptions}
        values={attackSigns}
        onToggle={(v) => {
          const next = toggleChoice(attackSigns, v) as typeof attackSigns;
          update({ attackSigns: next, ...clearEncryption(next, informationEffects) });
        }}
        columns={false}
      />
      {encryptionRelevant(attackSigns, informationEffects) && (
        <SegmentedControl
          legend={t('impact.encrypted')}
          options={encryptedOptions}
          value={dataEncrypted}
          onChange={(v) => {
            update({ dataEncrypted: v as typeof dataEncrypted });
          }}
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
