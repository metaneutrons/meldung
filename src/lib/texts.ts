import { readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Per-deployment text overrides.
 *
 * Every text the portal shows or sends has a built-in default: the message
 * files in src/i18n/messages and the Markdown pages in content/. A deployment
 * changes any of them by placing files of the same name in its custom
 * directory (MELDUNG_CUSTOM_DIR, default ./custom):
 *
 *   custom/messages/<locale>.json           UI texts           (partial, merged)
 *   custom/messages/taxonomy.<locale>.json  classification     (partial, merged)
 *   custom/messages/report.<locale>.json    PDF, e-mail, tickets (partial, merged)
 *   custom/content/welcome.<locale>.md      welcome page       (replaces)
 *   custom/content/footer.<locale>.md       footer             (replaces)
 *
 * A JSON override only names the keys it changes. A key the defaults do not
 * have, a string where the default has a group (or the reverse), or a
 * placeholder the default does not offer is rejected with the file and key, so
 * a typo surfaces as an error instead of an untranslated or broken text.
 */

export type Messages = Record<string, unknown>;

export class TextOverrideError extends Error {
  override name = 'TextOverrideError';
}

export function customDir(): string {
  return resolve(process.cwd(), process.env.MELDUNG_CUSTOM_DIR ?? 'custom');
}

const PLACEHOLDER = /\{\s*([A-Za-z_]\w*)\s*\}/g;

function placeholdersOf(text: string): Set<string> {
  return new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1] ?? ''));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Lays an override over the defaults, refusing anything the defaults do not define. */
export function mergeOverride(
  defaults: Messages,
  override: unknown,
  source: string,
  path: readonly string[] = [],
): Messages {
  const where = (keys: readonly string[]) => `${source}: ${keys.join('.') || '(top level)'}`;
  if (!isPlainObject(override)) {
    throw new TextOverrideError(`${where(path)} must be an object of texts`);
  }
  const merged: Messages = { ...defaults };
  for (const [key, value] of Object.entries(override)) {
    const keys = [...path, key];
    if (!Object.hasOwn(defaults, key)) {
      throw new TextOverrideError(`${where(keys)} does not exist in the default texts`);
    }
    const fallback = defaults[key];
    if (typeof fallback === 'string') {
      if (typeof value !== 'string') {
        throw new TextOverrideError(`${where(keys)} must be a text`);
      }
      const allowed = placeholdersOf(fallback);
      const unknown = [...placeholdersOf(value)].filter((p) => !allowed.has(p));
      if (unknown.length > 0) {
        const offer = allowed.size > 0 ? [...allowed].map((p) => `{${p}}`).join(', ') : 'none';
        throw new TextOverrideError(
          `${where(keys)} uses ${unknown.map((p) => `{${p}}`).join(', ')}; available here: ${offer}`,
        );
      }
      merged[key] = value;
    } else {
      merged[key] = mergeOverride(fallback as Messages, value, source, keys);
    }
  }
  return merged;
}

// Files are re-read only when they change, so an edited override takes effect
// without a restart while an unchanged one costs a stat per request.
const cache = new Map<string, { mtimeMs: number; value: unknown }>();

function readIfPresent<T>(path: string, parse: (raw: string) => T): T | undefined {
  let mtimeMs: number;
  try {
    mtimeMs = statSync(path).mtimeMs;
  } catch {
    return undefined;
  }
  const hit = cache.get(path);
  if (hit?.mtimeMs === mtimeMs) return hit.value as T;
  const value = parse(readFileSync(path, 'utf-8'));
  cache.set(path, { mtimeMs, value });
  return value;
}

function parseJson(path: string) {
  return (raw: string): unknown => {
    try {
      return JSON.parse(raw) as unknown;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new TextOverrideError(`${path}: not valid JSON (${reason})`);
    }
  };
}

/** The default messages for a locale with the deployment's overrides applied. */
export function applyOverrides(
  locale: string,
  defaults: { ui: Messages; taxonomy: Messages; report: Messages },
): { ui: Messages; taxonomy: Messages; report: Messages } {
  const dir = join(customDir(), 'messages');
  const layer = (defaultsOf: Messages, file: string): Messages => {
    const path = join(dir, file);
    const override = readIfPresent(path, parseJson(path));
    return override === undefined ? defaultsOf : mergeOverride(defaultsOf, override, path);
  };
  return {
    ui: layer(defaults.ui, `${locale}.json`),
    taxonomy: layer(defaults.taxonomy, `taxonomy.${locale}.json`),
    report: layer(defaults.report, `report.${locale}.json`),
  };
}

/**
 * A Markdown page: the deployment's version for the locale, else its
 * language-neutral version, else the built-in default. {orgName} is filled in.
 */
export function loadPage(
  name: 'welcome' | 'footer',
  locale: string,
  values: { orgName: string },
): string {
  const candidates = [
    join(customDir(), 'content', `${name}.${locale}.md`),
    join(customDir(), 'content', `${name}.md`),
    resolve(process.cwd(), 'content', `${name}.${locale}.md`),
    resolve(process.cwd(), 'content', `${name}.md`),
  ];
  for (const path of candidates) {
    const text = readIfPresent(path, (raw) => raw);
    if (text !== undefined) return text.replaceAll('{orgName}', values.orgName);
  }
  return '';
}
