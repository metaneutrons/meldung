import { z } from 'zod';

/**
 * Single source of truth for the incident form's data shape and validation.
 * The store (FormState), the wire payload (FormData), client-side gating and
 * server-side submission validation are all derived from the schemas below.
 */

// Tri-state / binary answers used by several questions.
const ternary = z.enum(['', 'yes', 'no', 'unknown']);
const binary = z.enum(['', 'yes', 'no']);

// Length caps bound the payload size and protect downstream PDF / e-mail
// generation from abuse (DoS via huge inputs).
const SHORT = 200;
const KEY = 100;
const FREE = 20_000;

/**
 * The impact step separates two things a reporter can observe: which kind of
 * information is affected, and what happened to it. The second follows the
 * protection goals of Art. 32(1)(b) GDPR (confidentiality, integrity,
 * availability); a personal data breach under Art. 4(12) GDPR can be any of
 * the three. "none" and "unknown" exclude every other answer.
 */
export const WORK_IMPACT = ['normal', 'limited', 'stopped', 'unknown'] as const;
export const AFFECTED_INFORMATION = [
  'personal',
  'confidential',
  'credentials',
  'none',
  'unknown',
] as const;
export const INFORMATION_EFFECTS = ['disclosed', 'altered', 'unavailable', 'unknown'] as const;
export const EXCLUSIVE_ANSWERS: readonly string[] = ['none', 'unknown'];

type Ternary = z.infer<typeof ternary>;

/** Whether personal data is involved, as the GDPR step and the report need it. */
export function personalDataFrom(information: readonly string[]): Ternary {
  if (information.includes('personal')) return 'yes';
  if (information.includes('unknown')) return 'unknown';
  return information.length > 0 ? 'no' : '';
}

/** Whether any information is (possibly) affected, so its fate is worth asking. */
export function informationAtStake(information: readonly string[]): boolean {
  return information.some((v) => v !== 'none');
}

/**
 * Toggles one answer of a multiple choice in which some answers exclude all
 * others: picking an exclusive answer clears the rest, picking any other
 * answer clears the exclusive ones.
 */
export function toggleChoice(current: readonly string[], value: string): string[] {
  if (current.includes(value)) return current.filter((v) => v !== value);
  if (EXCLUSIVE_ANSWERS.includes(value)) return [value];
  return [...current.filter((v) => !EXCLUSIVE_ANSWERS.includes(v)), value];
}

export const formDataSchema = z.object({
  // Reporter
  reporterName: z.string().max(SHORT).default(''),
  department: z.string().max(SHORT).default(''),
  role: z.string().max(SHORT).default(''),
  email: z.string().max(320).default(''),
  phone: z.string().max(64).default(''),
  reportDate: z.string().max(40).default(''),

  // Timeline
  discoveryDate: z.string().max(40).default(''),
  occurrenceDate: z.string().max(40).default(''),
  isOngoing: ternary.default(''),

  // Classification
  incidentCategory: z.string().max(KEY).default(''),
  incidentSubType: z.string().max(KEY).default(''),

  // Description
  description: z.string().max(FREE).default(''),
  howDiscovered: z.string().max(5_000).default(''),
  attackVector: z.string().max(KEY).default(''),

  // Affected systems
  affectedSystems: z.array(z.string().max(SHORT)).max(100).default([]),
  affectedSystemsOther: z.string().max(2_000).default(''),

  // Impact
  workImpact: z.enum(['', ...WORK_IMPACT]).default(''),
  affectedInformation: z
    .array(z.enum(AFFECTED_INFORMATION))
    .max(AFFECTED_INFORMATION.length)
    .default([]),
  informationEffects: z
    .array(z.enum(INFORMATION_EFFECTS))
    .max(INFORMATION_EFFECTS.length)
    .default([]),
  // Derived from affectedInformation (personalDataFrom). Kept as a field
  // because the GDPR step, the report and webhook consumers read it.
  personalDataInvolved: ternary.default(''),

  // Measures
  measuresTaken: z.string().max(FREE).default(''),
  isResolved: binary.default(''),
  recommendedActions: z.string().max(FREE).default(''),

  // GDPR (conditional)
  dataCategories: z.array(z.string().max(KEY)).max(100).default([]),
  personCategories: z.array(z.string().max(KEY)).max(100).default([]),
  estimatedRecords: z.string().max(40).default(''),
  dpoContact: z.string().max(SHORT).default(''),
  isGdprBreach: ternary.default(''),

  // Persistence metadata
  _savedAt: z.string().max(40).default(''),
});

export type FormData = z.infer<typeof formDataSchema>;

/** Canonical e-mail pattern — the ONLY e-mail check in the codebase. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Required-field gate shared by the client wizard and the server route. */
export function isReporterValid(d: Pick<FormData, 'reporterName' | 'email' | 'phone'>): boolean {
  return d.reporterName.trim() !== '' && EMAIL_RE.test(d.email.trim()) && d.phone.trim() !== '';
}

/** Server-side submission validation: full shape + required reporter fields. */
export const submissionSchema = formDataSchema
  .extend({
    reporterName: z.string().trim().min(1).max(SHORT),
    email: z.string().trim().min(1).max(320).regex(EMAIL_RE),
    phone: z.string().trim().min(1).max(64),
  })
  // The client derives these as the reporter answers; the server derives them
  // again so the report never rests on a value the client could set freely.
  .transform((d) => ({
    ...d,
    personalDataInvolved: personalDataFrom(d.affectedInformation),
    informationEffects: informationAtStake(d.affectedInformation) ? d.informationEffects : [],
  }));
