'use client';

import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';

const labelClass = 'mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-300';
const radioClass = 'h-4 w-4 border-gray-300 accent-[var(--brand-primary)]';

interface RadioOption {
  value: string;
  label: string;
}

function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{label}</legend>
      <div className="flex flex-wrap gap-4 p-3">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className={radioClass}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ImpactAssessment() {
  const t = useTranslations('steps');
  const { functionalImpact, informationImpact, recoverability, personalDataInvolved, update } =
    useFormStore();

  const functionalOptions: RadioOption[] = [
    { value: 'none', label: t('impact.functionalOptions.none') },
    { value: 'low', label: t('impact.functionalOptions.low') },
    { value: 'medium', label: t('impact.functionalOptions.medium') },
    { value: 'high', label: t('impact.functionalOptions.high') },
  ];

  const informationOptions: RadioOption[] = [
    { value: 'none', label: t('impact.informationOptions.none') },
    { value: 'privacy-breach', label: t('impact.informationOptions.privacy-breach') },
    { value: 'proprietary-breach', label: t('impact.informationOptions.proprietary-breach') },
    { value: 'integrity-loss', label: t('impact.informationOptions.integrity-loss') },
  ];

  const recoverabilityOptions: RadioOption[] = [
    { value: 'regular', label: t('impact.recoverabilityOptions.regular') },
    { value: 'supplemented', label: t('impact.recoverabilityOptions.supplemented') },
    { value: 'extended', label: t('impact.recoverabilityOptions.extended') },
    { value: 'not-recoverable', label: t('impact.recoverabilityOptions.not-recoverable') },
  ];

  const personalDataOptions: RadioOption[] = [
    { value: 'yes', label: t('options.yes') },
    { value: 'no', label: t('options.no') },
    { value: 'unknown', label: t('options.unknown') },
  ];

  return (
    <div className="space-y-6">
      <RadioGroup
        name="functionalImpact"
        label={`${t('impact.functional')} *`}
        options={functionalOptions}
        value={functionalImpact}
        onChange={(v) => update({ functionalImpact: v })}
      />
      <RadioGroup
        name="informationImpact"
        label={`${t('impact.information')} *`}
        options={informationOptions}
        value={informationImpact}
        onChange={(v) => update({ informationImpact: v })}
      />
      <RadioGroup
        name="recoverability"
        label={`${t('impact.recoverability')} *`}
        options={recoverabilityOptions}
        value={recoverability}
        onChange={(v) => update({ recoverability: v })}
      />
      <RadioGroup
        name="personalDataInvolved"
        label={`${t('impact.personalData')} *`}
        options={personalDataOptions}
        value={personalDataInvolved}
        onChange={(v) => update({ personalDataInvolved: v as 'yes' | 'no' | 'unknown' })}
      />
      {(personalDataInvolved === 'yes' || personalDataInvolved === 'unknown') && (
        <div className="mt-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-200">
          💡 {t('impact.personalDataHint')}
        </div>
      )}
    </div>
  );
}
