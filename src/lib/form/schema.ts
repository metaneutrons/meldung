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
  functionalImpact: z.string().max(KEY).default(''),
  informationImpact: z.string().max(KEY).default(''),
  recoverability: z.string().max(KEY).default(''),
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
export const submissionSchema = formDataSchema.extend({
  reporterName: z.string().trim().min(1).max(SHORT),
  email: z.string().trim().min(1).max(320).regex(EMAIL_RE),
  phone: z.string().trim().min(1).max(64),
});
