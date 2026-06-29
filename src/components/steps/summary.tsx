'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { useFormStore } from '@/lib/store/form-store';
import { ENISA_RSIT_TAXONOMY } from '@/lib/taxonomy/enisa-rsit';
import { SYSTEM_KEYS } from '@/lib/systems';
import { EMAIL_RE } from '@/lib/form/schema';
import { useWizardNav } from '@/components/wizard/wizard-nav';

interface FieldRef {
  label: string;
  step: string;
}

/** A bullet list whose items jump to the step where the data is entered. */
function FieldList({
  items,
  className,
  onGo,
}: {
  items: FieldRef[];
  className: string;
  onGo: ((id: string) => void) | null;
}) {
  return (
    <ul className={className} style={{ listStyleType: 'disc', paddingLeft: '1.25rem' }}>
      {items.map((item) => (
        <li key={item.label}>
          {onGo ? (
            <button
              type="button"
              onClick={() => onGo(item.step)}
              className="underline underline-offset-2 hover:no-underline"
            >
              {item.label}
            </button>
          ) : (
            item.label
          )}
        </li>
      ))}
    </ul>
  );
}

export function Summary() {
  const t = useTranslations('steps');
  const tw = useTranslations('wizard');
  const tax = useTranslations('taxonomy');
  const state = useFormStore();
  const goTo = useWizardNav();

  const required: FieldRef[] = [];
  if (!state.reporterName.trim()) required.push({ label: t('reporter.name'), step: 'reporter' });
  if (!state.email.trim() || !EMAIL_RE.test(state.email))
    required.push({ label: t('reporter.email'), step: 'reporter' });
  if (!state.phone.trim()) required.push({ label: t('reporter.phone'), step: 'reporter' });

  const missing: FieldRef[] = [];
  if (!state.discoveryDate) missing.push({ label: tw('timeline'), step: 'timeline' });
  if (!state.incidentCategory)
    missing.push({ label: tw('classification'), step: 'classification' });
  if (!state.description) missing.push({ label: tw('description'), step: 'description' });
  if (!state.functionalImpact) missing.push({ label: tw('impact'), step: 'impact' });

  const category = ENISA_RSIT_TAXONOMY.find((c) => c.value === state.incidentCategory);
  const subType = category?.entries.find((e) => e === state.incidentSubType);
  const sysLabel = (s: string) =>
    s === 'other'
      ? state.affectedSystemsOther || t('systems.other')
      : (SYSTEM_KEYS as readonly string[]).includes(s)
        ? t(`systems.options.${s}`)
        : s;

  return (
    <div className="space-y-5">
      {required.length > 0 && (
        <div className="rounded-xl border border-danger-border bg-danger-bg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-medium text-danger">{t('summary.requiredFields')}</p>
              <FieldList
                items={required}
                onGo={goTo}
                className="mt-1 space-y-0.5 text-sm text-danger"
              />
            </div>
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="rounded-xl border border-warning-border bg-warning-bg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-warning">{t('summary.missingFields')}</p>
              <FieldList
                items={missing}
                onGo={goTo}
                className="mt-1 space-y-0.5 text-sm text-warning"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {state.reporterName && <Row label={t('reporter.name')} value={state.reporterName} />}
        {state.department && <Row label={t('reporter.department')} value={state.department} />}
        {state.role && <Row label={t('reporter.role')} value={state.role} />}
        {state.email && <Row label={t('reporter.email')} value={state.email} />}
        {state.phone && <Row label={t('reporter.phone')} value={state.phone} />}
        {state.discoveryDate && (
          <Row label={t('timeline.discoveryDate')} value={formatDate(state.discoveryDate)} />
        )}
        {state.occurrenceDate && (
          <Row label={t('timeline.occurrenceDate')} value={formatDate(state.occurrenceDate)} />
        )}
        {category && (
          <Row
            label={t('classification.category')}
            value={tax(`categories.${category.value}.label`)}
          />
        )}
        {subType && (
          <Row label={t('classification.subType')} value={tax(`entries.${subType}.label`)} />
        )}
        {state.description && (
          <Row label={t('description.description')} value={state.description} />
        )}
        {state.howDiscovered && (
          <Row label={t('description.howDiscovered')} value={state.howDiscovered} />
        )}
        {state.affectedSystems.length > 0 && (
          <Row label={tw('systems')} value={state.affectedSystems.map(sysLabel).join(', ')} />
        )}
        {state.functionalImpact && (
          <Row label={t('impact.functional')} value={state.functionalImpact} />
        )}
        {state.informationImpact && (
          <Row label={t('impact.information')} value={state.informationImpact} />
        )}
        {state.recoverability && (
          <Row label={t('impact.recoverability')} value={state.recoverability} />
        )}
        {state.measuresTaken && (
          <Row label={t('measures.measuresTaken')} value={state.measuresTaken} />
        )}
        {state.personalDataInvolved && (
          <Row label={t('impact.personalData')} value={state.personalDataInvolved} />
        )}
        {state.dataCategories.length > 0 && (
          <Row label={t('gdpr.dataCategories')} value={state.dataCategories.join(', ')} />
        )}
        {state.estimatedRecords && (
          <Row label={t('gdpr.estimatedRecords')} value={state.estimatedRecords} />
        )}
      </div>

      <p className="text-xs text-fg-subtle">{t('summary.timestamp')}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border pb-2 sm:flex-row sm:gap-4">
      <span className="shrink-0 text-sm font-medium text-fg-muted sm:w-40">{label}</span>
      <span className="text-sm text-fg">{value}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
