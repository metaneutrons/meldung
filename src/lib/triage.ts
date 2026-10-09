import type { FormData } from '@/lib/form/schema';
import { informationAtStake } from '@/lib/form/schema';

/**
 * A preliminary priority for the team handling a report, computed from what
 * the reporter observed. It sorts incoming reports and records why; it is not
 * the risk assessment Art. 33 GDPR asks of the controller, and the reporter
 * never sees it.
 *
 * The rules run top to bottom and the first level that matches applies, but
 * every rule that matches contributes its reason, the weaker ones included.
 * "Don't know" never lowers a report: it counts as "yes" for an ongoing
 * incident, as possible for personal data and as "no" for encryption.
 */

export const TRIAGE_VERSION = 1;

export type TriageLevel = 'P1' | 'P2' | 'P3' | 'P4';

export type TriageReason =
  | 'attackOngoing'
  | 'standstill'
  | 'severeDisclosure'
  | 'attackOrBreach'
  | 'manyOrSensitive'
  | 'unencryptedLoss'
  | 'personalData'
  | 'securityRelevant'
  | 'personsUnknown'
  | 'noUrgency';

export interface Triage {
  level: TriageLevel;
  reasons: TriageReason[];
  /** Submission plus 72 hours when personal data may be involved: an orientation, not the legal deadline. */
  orientation72h: string | null;
  version: number;
}

/**
 * Data categories that make a breach heavier: the special categories of
 * Art. 9(1) GDPR (biometric data only where it identifies a person), data on
 * offences (Art. 10 GDPR), and data that can be misused directly.
 */
export const SENSITIVE_DATA_CATEGORIES: readonly string[] = [
  'healthData',
  'biometricData',
  'religiousPolitical',
  'sexualOrientation',
  'criminalRecords',
  'socialSecurityId',
  'credentials',
  'financialData',
];

type TriageInput = Pick<
  FormData,
  | 'isOngoing'
  | 'workImpact'
  | 'affectedInformation'
  | 'informationEffects'
  | 'personalDataInvolved'
  | 'attackSigns'
  | 'dataEncrypted'
  | 'affectedPersons'
  | 'dataCategories'
>;

const has = (list: readonly string[], ...values: string[]) => values.some((v) => list.includes(v));

export function triage(data: TriageInput, submittedAt: Date = new Date()): Triage {
  const ongoing = data.isOngoing === 'yes' || data.isOngoing === 'unknown';
  const realSign = has(data.attackSigns, 'ransom', 'foreignUse', 'lostDevice');
  const attack = has(data.attackSigns, 'ransom', 'foreignUse');
  const disclosed = data.informationEffects.includes('disclosed');
  const personal = data.personalDataInvolved;
  const personalPossible = personal === 'yes' || personal === 'unknown';
  const sensitive =
    has(data.dataCategories, ...SENSITIVE_DATA_CATEGORIES) ||
    data.affectedInformation.includes('credentials');
  const many = data.affectedPersons === '11-100' || data.affectedPersons === 'over-100';

  const rules: [TriageLevel, TriageReason, boolean][] = [
    ['P1', 'attackOngoing', ongoing && (data.informationEffects.includes('unavailable') || attack)],
    [
      'P1',
      'standstill',
      data.workImpact === 'stopped' && (informationAtStake(data.affectedInformation) || realSign),
    ],
    ['P1', 'severeDisclosure', disclosed && (sensitive || data.affectedPersons === 'over-100')],
    [
      'P2',
      'attackOrBreach',
      has(data.informationEffects, 'disclosed', 'altered', 'unavailable') || attack,
    ],
    ['P2', 'manyOrSensitive', personal === 'yes' && (many || sensitive)],
    [
      'P2',
      'unencryptedLoss',
      data.attackSigns.includes('lostDevice') && data.dataEncrypted !== 'yes' && personal !== 'no',
    ],
    ['P3', 'personalData', personalPossible],
    ['P3', 'securityRelevant', informationAtStake(data.affectedInformation) || realSign],
  ];

  const matched = rules.filter(([, , applies]) => applies);
  const reasons: TriageReason[] = matched.map(([, reason]) => reason);
  if (personalPossible && data.affectedPersons === 'unknown') reasons.push('personsUnknown');

  const level: TriageLevel = matched[0]?.[0] ?? 'P4';
  if (level === 'P4') reasons.push('noUrgency');

  return {
    level,
    reasons,
    orientation72h: personalPossible
      ? new Date(submittedAt.getTime() + 72 * 3600 * 1000).toISOString()
      : null,
    version: TRIAGE_VERSION,
  };
}

/** Whether the reporter should also phone in: an attack may be running or work has stopped. */
export function isEmergency(t: Triage): boolean {
  return t.reasons.includes('attackOngoing') || t.reasons.includes('standstill');
}
