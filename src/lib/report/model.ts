import { getTranslations } from 'next-intl/server';
import { TAXONOMY_CATEGORY_VALUES, TAXONOMY_ENTRY_VALUES } from '@/lib/taxonomy/enisa-rsit';
import { SYSTEM_KEYS } from '@/lib/systems';
import type { FormData } from '@/lib/form/schema';

export interface ReportField {
  label: string;
  value: string;
}
export interface ReportSection {
  title: string;
  fields: ReportField[];
}
export interface ReportModel {
  title: string;
  /** Localized incident category — used e.g. for the Znuny ticket title. */
  category: string;
  meta: { reference: string; generated: string; page: string };
  sections: ReportSection[];
}

const has = (list: readonly string[], value: string) => list.includes(value);

/**
 * Builds a fully localized report (titles, labels AND values) in the report's
 * language. Single source for the PDF, the e-mail body and the Znuny ticket.
 */
export async function buildReportModel(data: FormData, locale: string): Promise<ReportModel> {
  const t = await getTranslations({ locale, namespace: 'steps' });
  const tw = await getTranslations({ locale, namespace: 'wizard' });
  const tax = await getTranslations({ locale, namespace: 'taxonomy' });
  const tr = await getTranslations({ locale, namespace: 'report' });

  const category =
    data.incidentCategory === 'undetermined'
      ? t('classification.undetermined')
      : has(TAXONOMY_CATEGORY_VALUES, data.incidentCategory)
        ? tax(`categories.${data.incidentCategory}.label`)
        : data.incidentCategory;
  const subType = has(TAXONOMY_ENTRY_VALUES, data.incidentSubType)
    ? tax(`entries.${data.incidentSubType}.label`)
    : data.incidentSubType;
  const systems = data.affectedSystems
    .map((s) =>
      s === 'other'
        ? data.affectedSystemsOther || t('systems.other')
        : has(SYSTEM_KEYS, s)
          ? t(`systems.options.${s}`)
          : s,
    )
    .join(', ');
  const yn = (v: string) => (v ? t(`options.${v}`) : '');
  const opt = (group: string, v: string) => (v ? t(`impact.${group}.${v}`) : '');

  const sections: ReportSection[] = [
    {
      title: tw('reporterInfo'),
      fields: [
        { label: t('reporter.name'), value: data.reporterName },
        { label: t('reporter.department'), value: data.department },
        { label: t('reporter.role'), value: data.role },
        { label: t('reporter.email'), value: data.email },
        { label: t('reporter.phone'), value: data.phone },
        { label: t('reporter.reportDate'), value: data.reportDate },
      ],
    },
    {
      title: tw('timeline'),
      fields: [
        { label: t('timeline.discoveryDate'), value: data.discoveryDate },
        { label: t('timeline.occurrenceDate'), value: data.occurrenceDate },
        { label: t('timeline.isResolved'), value: yn(data.isOngoing) },
      ],
    },
    {
      title: tw('classification'),
      fields: [
        { label: t('classification.category'), value: category },
        { label: t('classification.subType'), value: subType },
      ],
    },
    {
      title: tw('description'),
      fields: [
        { label: t('description.description'), value: data.description },
        { label: t('description.howDiscovered'), value: data.howDiscovered },
        {
          label: t('description.attackVector'),
          value: data.attackVector ? t(`description.vectors.${data.attackVector}`) : '',
        },
      ],
    },
    { title: tw('systems'), fields: [{ label: t('systems.label'), value: systems }] },
    {
      title: tw('impact'),
      fields: [
        { label: t('impact.functional'), value: opt('functionalOptions', data.functionalImpact) },
        {
          label: t('impact.information'),
          value: opt('informationOptions', data.informationImpact),
        },
        {
          label: t('impact.recoverability'),
          value: opt('recoverabilityOptions', data.recoverability),
        },
        { label: t('impact.personalData'), value: yn(data.personalDataInvolved) },
      ],
    },
    {
      title: tw('measures'),
      fields: [
        { label: t('measures.measuresTaken'), value: data.measuresTaken },
        { label: t('measures.isResolved'), value: yn(data.isResolved) },
        { label: t('measures.recommendedActions'), value: data.recommendedActions },
      ],
    },
  ];

  if (data.personalDataInvolved === 'yes' || data.personalDataInvolved === 'unknown') {
    sections.push({
      title: tw('gdpr'),
      fields: [
        {
          label: t('gdpr.dataCategories'),
          value: data.dataCategories.map((k) => t(`gdpr.dataCategoryOptions.${k}`)).join(', '),
        },
        {
          label: t('gdpr.personCategories'),
          value: data.personCategories.map((k) => t(`gdpr.personCategoryOptions.${k}`)).join(', '),
        },
        { label: t('gdpr.estimatedRecords'), value: data.estimatedRecords },
        { label: t('gdpr.dpoContact'), value: data.dpoContact },
        { label: t('gdpr.isBreach'), value: yn(data.isGdprBreach) },
      ],
    });
  }

  return {
    title: tr('title'),
    category,
    meta: { reference: tr('reference'), generated: tr('generated'), page: tr('page') },
    sections,
  };
}

/** Plain-text rendering of the report model for e-mail / Znuny bodies. */
export function formatReportText(referenceNumber: string, model: ReportModel): string {
  const lines = [`${model.meta.reference}: ${referenceNumber}`];
  for (const section of model.sections) {
    lines.push('', `--- ${section.title} ---`);
    for (const field of section.fields) {
      if (field.value) lines.push(`${field.label}: ${field.value}`);
    }
  }
  return lines.join('\n');
}
