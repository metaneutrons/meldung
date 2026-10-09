import { describe, expect, it } from 'vitest';
import { formDataSchema } from '@/lib/form/schema';
import { isEmergency, triage, type TriageLevel } from './triage';

const base = formDataSchema.parse({});
const at = new Date('2026-10-10T08:00:00Z');
const run = (patch: Partial<typeof base>) => triage({ ...base, ...patch }, at);

describe('triage levels', () => {
  it.each<[string, Partial<typeof base>, TriageLevel, string]>([
    ['nothing reported', {}, 'P4', 'noUrgency'],
    ['ongoing ransomware', { isOngoing: 'yes', attackSigns: ['ransom'] }, 'P1', 'attackOngoing'],
    [
      'data unavailable, ongoing unknown',
      {
        isOngoing: 'unknown',
        affectedInformation: ['confidential'],
        informationEffects: ['unavailable'],
      },
      'P1',
      'attackOngoing',
    ],
    [
      'work stopped by a security incident',
      { workImpact: 'stopped', attackSigns: ['foreignUse'] },
      'P1',
      'standstill',
    ],
    [
      'credentials disclosed',
      { affectedInformation: ['credentials'], informationEffects: ['disclosed'] },
      'P1',
      'severeDisclosure',
    ],
    [
      'health data disclosed',
      {
        affectedInformation: ['personal'],
        personalDataInvolved: 'yes',
        informationEffects: ['disclosed'],
        dataCategories: ['healthData'],
      },
      'P1',
      'severeDisclosure',
    ],
    [
      'over 100 people disclosed',
      {
        affectedInformation: ['personal'],
        personalDataInvolved: 'yes',
        informationEffects: ['disclosed'],
        affectedPersons: 'over-100',
      },
      'P1',
      'severeDisclosure',
    ],
    [
      'attack over, data altered',
      { isOngoing: 'no', affectedInformation: ['confidential'], informationEffects: ['altered'] },
      'P2',
      'attackOrBreach',
    ],
    [
      'account taken over, not ongoing',
      { isOngoing: 'no', attackSigns: ['foreignUse'] },
      'P2',
      'attackOrBreach',
    ],
    [
      'personal data of 50 people',
      { affectedInformation: ['personal'], personalDataInvolved: 'yes', affectedPersons: '11-100' },
      'P2',
      'manyOrSensitive',
    ],
    [
      'laptop lost, encryption unknown',
      { attackSigns: ['lostDevice'], dataEncrypted: 'unknown' },
      'P2',
      'unencryptedLoss',
    ],
    [
      'personal data possibly involved',
      { affectedInformation: ['unknown'], personalDataInvolved: 'unknown' },
      'P3',
      'personalData',
    ],
    [
      'encrypted laptop lost, no personal data',
      { attackSigns: ['lostDevice'], dataEncrypted: 'yes', personalDataInvolved: 'no' },
      'P3',
      'securityRelevant',
    ],
  ])('%s → %s', (_, patch, level, reason) => {
    const result = run(patch);
    expect(result.level).toBe(level);
    expect(result.reasons[0]).toBe(reason);
  });

  it('lists the weaker reasons too', () => {
    const result = run({
      isOngoing: 'yes',
      attackSigns: ['ransom'],
      affectedInformation: ['personal'],
      personalDataInvolved: 'yes',
      informationEffects: ['unavailable'],
    });
    expect(result.reasons).toEqual([
      'attackOngoing',
      'attackOrBreach',
      'personalData',
      'securityRelevant',
    ]);
  });

  it('notes an unknown number of people when personal data may be involved', () => {
    const result = run({
      affectedInformation: ['personal'],
      personalDataInvolved: 'yes',
      affectedPersons: 'unknown',
    });
    expect(result.reasons).toContain('personsUnknown');
  });

  it('gives a 72-hour orientation only when personal data may be involved', () => {
    expect(run({ personalDataInvolved: 'unknown' }).orientation72h).toBe(
      '2026-10-13T08:00:00.000Z',
    );
    expect(run({ personalDataInvolved: 'no' }).orientation72h).toBeNull();
  });

  it('asks the reporter to phone in only for a running attack or a standstill', () => {
    expect(isEmergency(run({ isOngoing: 'yes', attackSigns: ['ransom'] }))).toBe(true);
    expect(isEmergency(run({ workImpact: 'stopped', attackSigns: ['lostDevice'] }))).toBe(true);
    expect(
      isEmergency(run({ affectedInformation: ['credentials'], informationEffects: ['disclosed'] })),
    ).toBe(false);
  });
});
