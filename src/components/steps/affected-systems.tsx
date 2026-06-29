'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { SYSTEM_KEYS } from '@/lib/systems';
import { CheckboxGroup, TextField } from '@/components/ui';

export function AffectedSystems() {
  const t = useTranslations('steps');
  const { affectedSystems, affectedSystemsOther, update } = useFormStore();

  const isOtherChecked = affectedSystems.includes('other');

  const options = [
    ...SYSTEM_KEYS.map((k) => ({ value: k, label: t(`systems.options.${k}`) })),
    { value: 'other', label: t('systems.other') },
  ];

  const toggle = (value: string) => {
    const next = affectedSystems.includes(value)
      ? affectedSystems.filter((s) => s !== value)
      : [...affectedSystems, value];
    update({ affectedSystems: next });
    if (value === 'other' && affectedSystems.includes('other')) {
      update({ affectedSystemsOther: '' });
    }
  };

  return (
    <div className="space-y-5">
      <CheckboxGroup
        legend={t('systems.label')}
        options={options}
        values={affectedSystems}
        onToggle={toggle}
      />
      {isOtherChecked && (
        <TextField
          label={t('systems.otherPlaceholder')}
          value={affectedSystemsOther}
          placeholder={t('systems.otherPlaceholder')}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            update({ affectedSystemsOther: e.target.value })
          }
        />
      )}
    </div>
  );
}
