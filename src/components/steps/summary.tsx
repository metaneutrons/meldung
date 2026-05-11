'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { useFormStore } from '@/lib/store/form-store';
import { ENISA_RSIT_TAXONOMY } from '@/lib/taxonomy/enisa-rsit';

export function Summary() {
  const t = useTranslations('steps');
  const tw = useTranslations('wizard');
  const state = useFormStore();

  const missing: string[] = [];
  if (!state.discoveryDate) missing.push(tw('timeline'));
  if (!state.incidentCategory) missing.push(tw('classification'));
  if (!state.description) missing.push(tw('description'));
  if (!state.functionalImpact) missing.push(tw('impact'));

  const category = ENISA_RSIT_TAXONOMY.find((c) => c.value === state.incidentCategory);
  const subType = category?.entries.find((e) => e.value === state.incidentSubType);

  return (
    <div className="space-y-5">
      {/* Missing fields warning */}
      {missing.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('summary.missingFields')}</p>
              <ul className="mt-1 space-y-0.5 text-sm text-amber-700 dark:text-amber-300" style={{ listStyleType: 'disc', paddingLeft: '1.25rem' }}>
                {missing.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filled fields summary */}
      <div className="space-y-3">
        {state.reporterName && <Row label={t('reporter.name')} value={state.reporterName} />}
        {state.department && <Row label={t('reporter.department')} value={state.department} />}
        {state.role && <Row label={t('reporter.role')} value={state.role} />}
        {state.contact && <Row label={t('reporter.contact')} value={state.contact} />}
        {state.discoveryDate && <Row label={t('timeline.discoveryDate')} value={formatDate(state.discoveryDate)} />}
        {state.occurrenceDate && <Row label={t('timeline.occurrenceDate')} value={formatDate(state.occurrenceDate)} />}
        {category && <Row label={t('classification.category')} value={category.label} />}
        {subType && <Row label={t('classification.subType')} value={subType.label} />}
        {state.description && <Row label={t('description.description')} value={state.description} />}
        {state.howDiscovered && <Row label={t('description.howDiscovered')} value={state.howDiscovered} />}
        {state.affectedSystems.length > 0 && <Row label={tw('systems')} value={state.affectedSystems.join(', ')} />}
        {state.functionalImpact && <Row label={t('impact.functional')} value={state.functionalImpact} />}
        {state.informationImpact && <Row label={t('impact.information')} value={state.informationImpact} />}
        {state.recoverability && <Row label={t('impact.recoverability')} value={state.recoverability} />}
        {state.measuresTaken && <Row label={t('measures.measuresTaken')} value={state.measuresTaken} />}
        {state.personalDataInvolved && (
          <Row label={t('impact.personalData')} value={state.personalDataInvolved} />
        )}
        {state.dataCategories.length > 0 && <Row label={t('gdpr.dataCategories')} value={state.dataCategories.join(', ')} />}
        {state.estimatedRecords && <Row label={t('gdpr.estimatedRecords')} value={state.estimatedRecords} />}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">{t('summary.timestamp')}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-100 pb-2 dark:border-gray-800 sm:flex-row sm:gap-4">
      <span className="shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">{label}</span>
      <span className="text-sm text-gray-900 dark:text-gray-100">{value}</span>
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
