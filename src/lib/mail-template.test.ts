import { describe, expect, it } from 'vitest';
import { fillTemplate } from './mail-template';

const values = { reference: 'INC-1', name: 'Ada', orgName: 'ACME' };

describe('mail templates', () => {
  it('fills every known placeholder, as often as it occurs', () => {
    expect(fillTemplate('{name}: {reference} ({reference}) – {orgName}', values)).toBe(
      'Ada: INC-1 (INC-1) – ACME',
    );
  });

  it('leaves an apostrophe and unrelated braces alone', () => {
    expect(fillTemplate("d'incident {reference} {}", values)).toBe("d'incident INC-1 {}");
  });
});
