import { describe, it, expect } from 'vitest';
import { TAXONOMY_CATEGORY_VALUES, TAXONOMY_ENTRY_VALUES } from './enisa-rsit';
import { SYSTEM_KEYS } from '@/lib/systems';
import { routing } from '@/i18n/routing';

import taxDe from '@/i18n/messages/taxonomy.de.json';
import taxEn from '@/i18n/messages/taxonomy.en.json';
import taxEs from '@/i18n/messages/taxonomy.es.json';
import taxFr from '@/i18n/messages/taxonomy.fr.json';
import taxIt from '@/i18n/messages/taxonomy.it.json';
import taxTr from '@/i18n/messages/taxonomy.tr.json';
import taxRu from '@/i18n/messages/taxonomy.ru.json';
import taxUk from '@/i18n/messages/taxonomy.uk.json';
import uiDe from '@/i18n/messages/de.json';
import uiEn from '@/i18n/messages/en.json';
import uiEs from '@/i18n/messages/es.json';
import uiFr from '@/i18n/messages/fr.json';
import uiIt from '@/i18n/messages/it.json';
import uiTr from '@/i18n/messages/tr.json';
import uiRu from '@/i18n/messages/ru.json';
import uiUk from '@/i18n/messages/uk.json';

interface Tax {
  categories: Record<string, { label?: string; description?: string }>;
  entries: Record<string, { label?: string; description?: string }>;
}
type Ui = { steps: { systems: { options: Record<string, string> } } };

const taxonomies = {
  de: taxDe,
  en: taxEn,
  es: taxEs,
  fr: taxFr,
  it: taxIt,
  tr: taxTr,
  ru: taxRu,
  uk: taxUk,
} as Record<string, Tax>;
const uis = {
  de: uiDe,
  en: uiEn,
  es: uiEs,
  fr: uiFr,
  it: uiIt,
  tr: uiTr,
  ru: uiRu,
  uk: uiUk,
} as Record<string, Ui>;

describe('domain i18n completeness', () => {
  for (const locale of routing.locales) {
    it(`taxonomy.${locale} covers every ENISA category + entry (label + description)`, () => {
      const tax = taxonomies[locale]!;
      for (const value of TAXONOMY_CATEGORY_VALUES) {
        expect(tax.categories[value]?.label, `${locale} category ${value}`).toBeTruthy();
        expect(tax.categories[value]?.description, `${locale} category ${value} desc`).toBeTruthy();
      }
      for (const value of TAXONOMY_ENTRY_VALUES) {
        expect(tax.entries[value]?.label, `${locale} entry ${value}`).toBeTruthy();
        expect(tax.entries[value]?.description, `${locale} entry ${value} desc`).toBeTruthy();
      }
    });

    it(`${locale} provides a label for every affected-system key`, () => {
      const options = uis[locale]!.steps.systems.options;
      for (const key of SYSTEM_KEYS) {
        expect(options[key], `${locale} system ${key}`).toBeTruthy();
      }
    });
  }
});
