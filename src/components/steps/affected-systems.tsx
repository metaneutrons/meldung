'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';

const inputClass = 'h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800';
const labelClass = 'mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-300';

const SYSTEMS = [
  'Campus-Management-System',
  'Lernplattform (Moodle)',
  'E-Mail-System',
  'Forschungsdatenbank',
  'Lokale Rechner / Server',
  'VPN / Netzwerk',
  'Cloud-Dienste',
  'Datenbanken',
] as const;

export function AffectedSystems() {
  const t = useTranslations('steps');
  const { affectedSystems, affectedSystemsOther, update } = useFormStore();

  const isOtherChecked = affectedSystems.includes('other');

  const toggleSystem = (system: string) => {
    const next = affectedSystems.includes(system)
      ? affectedSystems.filter((s) => s !== system)
      : [...affectedSystems, system];
    update({ affectedSystems: next });
    if (system === 'other' && affectedSystems.includes('other')) {
      update({ affectedSystemsOther: '' });
    }
  };

  const onOtherChange = (e: ChangeEvent<HTMLInputElement>) => {
    update({ affectedSystemsOther: e.target.value });
  };

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className={labelClass}>{t('systems.label')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
          {SYSTEMS.map((system) => (
            <label key={system} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={affectedSystems.includes(system)}
                onChange={() => toggleSystem(system)}
                className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-gray-900 dark:text-gray-100">{system}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={isOtherChecked}
              onChange={() => toggleSystem('other')}
              className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-gray-900 dark:text-gray-100">{t('systems.other')}</span>
          </label>
        </div>
      </fieldset>

      {isOtherChecked && (
        <div>
          <label htmlFor="affected-systems-other" className={labelClass}>{t('systems.otherPlaceholder')}</label>
          <input
            id="affected-systems-other"
            type="text"
            value={affectedSystemsOther}
            onChange={onOtherChange}
            placeholder={t('systems.otherPlaceholder')}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}
