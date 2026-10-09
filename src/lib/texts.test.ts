import { mkdtempSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyOverrides, loadPage, mergeOverride, TextOverrideError } from './texts';

const defaults = {
  common: { submit: 'Absenden', back: 'Zurück' },
  footer: { copyright: '© {year} {orgName}' },
};

describe('mergeOverride', () => {
  it('replaces only the keys the override names', () => {
    expect(mergeOverride(defaults, { common: { submit: 'Melden' } }, 'x.json')).toEqual({
      common: { submit: 'Melden', back: 'Zurück' },
      footer: { copyright: '© {year} {orgName}' },
    });
  });

  it('accepts the placeholders the default offers, in any order or subset', () => {
    const merged = mergeOverride(defaults, { footer: { copyright: '{orgName}, {year}' } }, 'x');
    expect(merged.footer).toEqual({ copyright: '{orgName}, {year}' });
  });

  it.each([
    [{ comon: { submit: 'x' } }, 'x.json: comon does not exist in the default texts'],
    [{ common: { sumbit: 'x' } }, 'x.json: common.sumbit does not exist in the default texts'],
    [{ common: 'x' }, 'x.json: common must be an object of texts'],
    [{ common: { submit: { de: 'x' } } }, 'x.json: common.submit must be a text'],
    [{ common: { submit: 7 } }, 'x.json: common.submit must be a text'],
    [
      { footer: { copyright: '© {jahr}' } },
      'x.json: footer.copyright uses {jahr}; available here: {year}, {orgName}',
    ],
    [
      { common: { submit: 'Hi {name}' } },
      'x.json: common.submit uses {name}; available here: none',
    ],
    [['not', 'an', 'object'], 'x.json: (top level) must be an object of texts'],
  ])('rejects %j', (override, message) => {
    expect(() => mergeOverride(defaults, override, 'x.json')).toThrow(
      new TextOverrideError(message),
    );
  });

  it('does not treat inherited object keys as existing texts', () => {
    expect(() => mergeOverride(defaults, { constructor: 'x' }, 'x.json')).toThrow(
      'x.json: constructor does not exist in the default texts',
    );
  });
});

describe('custom directory', () => {
  let dir: string;
  const before = process.env.MELDUNG_CUSTOM_DIR;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'meldung-custom-'));
    mkdirSync(join(dir, 'messages'));
    mkdirSync(join(dir, 'content'));
    process.env.MELDUNG_CUSTOM_DIR = dir;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    if (before === undefined) delete process.env.MELDUNG_CUSTOM_DIR;
    else process.env.MELDUNG_CUSTOM_DIR = before;
  });

  const base = { ui: defaults, taxonomy: { a: 'A' }, report: { title: 'Bericht' } };

  it('leaves the defaults untouched without override files', () => {
    expect(applyOverrides('de', base)).toEqual(base);
  });

  it('merges each message file for its locale only', () => {
    writeFileSync(join(dir, 'messages', 'report.de.json'), '{"title":"Meldung"}');
    expect(applyOverrides('de', base).report).toEqual({ title: 'Meldung' });
    expect(applyOverrides('en', base).report).toEqual({ title: 'Bericht' });
  });

  it('names the file when the JSON is broken', () => {
    const path = join(dir, 'messages', 'de.json');
    writeFileSync(path, '{"common": ');
    expect(() => applyOverrides('de', base)).toThrow(`${path}: not valid JSON`);
  });

  it('picks up an edited file without a restart', () => {
    const path = join(dir, 'messages', 'taxonomy.de.json');
    writeFileSync(path, '{"a":"eins"}');
    expect(applyOverrides('de', base).taxonomy).toEqual({ a: 'eins' });
    writeFileSync(path, '{"a":"zwei"}');
    // Force a distinct mtime: two writes can land in the same clock tick.
    const later = new Date(Date.now() + 5_000);
    utimesSync(path, later, later);
    expect(applyOverrides('de', base).taxonomy).toEqual({ a: 'zwei' });
  });

  it('serves the custom page for the locale, then the custom neutral one, then the default', () => {
    expect(loadPage('welcome', 'de', { orgName: 'ACME' })).toContain('ACME');
    writeFileSync(join(dir, 'content', 'welcome.md'), '# Neutral {orgName}');
    expect(loadPage('welcome', 'en', { orgName: 'ACME' })).toBe('# Neutral ACME');
    writeFileSync(join(dir, 'content', 'welcome.en.md'), '# Hello {orgName}');
    expect(loadPage('welcome', 'en', { orgName: 'ACME' })).toBe('# Hello ACME');
  });
});
