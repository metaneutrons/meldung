import { describe, expect, it } from 'vitest';
import { routing } from '@/i18n/routing';
import {
  AFFECTED_INFORMATION,
  INFORMATION_EFFECTS,
  WORK_IMPACT,
  formDataSchema,
  informationAtStake,
  personalDataFrom,
  submissionSchema,
  toggleChoice,
} from './schema';
import { DRAFT_VERSION, migrateDraft } from '@/lib/store/draft-migration';

describe('impact answers', () => {
  it('derives "personal data involved" from the affected information', () => {
    expect(personalDataFrom(['confidential', 'personal'])).toBe('yes');
    expect(personalDataFrom(['unknown'])).toBe('unknown');
    expect(personalDataFrom(['confidential'])).toBe('no');
    expect(personalDataFrom(['none'])).toBe('no');
    expect(personalDataFrom([])).toBe('');
  });

  it('asks what happened only when some information is at stake', () => {
    expect(informationAtStake(['none'])).toBe(false);
    expect(informationAtStake([])).toBe(false);
    expect(informationAtStake(['unknown'])).toBe(true);
    expect(informationAtStake(['credentials'])).toBe(true);
  });

  it('keeps "none" and "unknown" exclusive', () => {
    expect(toggleChoice(['personal', 'confidential'], 'none')).toEqual(['none']);
    expect(toggleChoice(['unknown'], 'personal')).toEqual(['personal']);
    expect(toggleChoice(['personal'], 'credentials')).toEqual(['personal', 'credentials']);
    expect(toggleChoice(['personal', 'credentials'], 'personal')).toEqual(['credentials']);
  });

  it('rejects answers the form does not offer', () => {
    expect(formDataSchema.safeParse({ affectedInformation: ['privacy-breach'] }).success).toBe(
      false,
    );
    expect(formDataSchema.safeParse({ workImpact: 'high' }).success).toBe(false);
  });

  it('derives the dependent answers again on the server', () => {
    const base = { reporterName: 'A', email: 'a@example.com', phone: '1' };
    const forged = submissionSchema.parse({
      ...base,
      affectedInformation: ['none'],
      informationEffects: ['disclosed'],
      personalDataInvolved: 'yes',
    });
    expect(forged.personalDataInvolved).toBe('no');
    expect(forged.informationEffects).toEqual([]);
  });
});

describe('draft migration', () => {
  it('carries the old personal-data answer over and drops the retired questions', () => {
    const migrated = migrateDraft(
      {
        reporterName: 'Ada',
        functionalImpact: 'high',
        informationImpact: 'privacy-breach',
        recoverability: 'extended',
        personalDataInvolved: 'yes',
      },
      0,
    );
    expect(migrated.reporterName).toBe('Ada');
    expect(migrated.affectedInformation).toEqual(['personal']);
    expect(migrated.workImpact).toBe('');
    expect(migrated).not.toHaveProperty('functionalImpact');
    expect(migrated).not.toHaveProperty('informationImpact');
  });

  it('keeps the readable fields of a damaged draft', () => {
    const migrated = migrateDraft({ reporterName: 'Ada', workImpact: 'sideways' }, DRAFT_VERSION);
    expect(migrated.reporterName).toBe('Ada');
    expect(migrated.workImpact).toBe('');
  });
});

describe('impact texts', () => {
  it.each(routing.locales)('%s labels every answer', async (locale) => {
    const messages = (await import(`@/i18n/messages/${locale}.json`)) as {
      default: { steps: { impact: Record<string, Record<string, string> | string> } };
    };
    const impact = messages.default.steps.impact;
    const keys = (group: string) => Object.keys(impact[group] as Record<string, string>).sort();
    expect(keys('workOptions')).toEqual([...WORK_IMPACT].sort());
    expect(keys('informationOptions')).toEqual([...AFFECTED_INFORMATION].sort());
    expect(keys('effectOptions')).toEqual([...INFORMATION_EFFECTS].sort());
  });
});
