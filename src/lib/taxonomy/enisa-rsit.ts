/**
 * ENISA RSIT incident taxonomy — STRUCTURE ONLY (stable keys).
 * Localized labels and descriptions live in the `taxonomy` message namespace
 * (src/i18n/messages/taxonomy.<locale>.json) keyed by these values, so the
 * stored incidentCategory / incidentSubType are language-independent.
 */
export interface TaxonomyCategory {
  value: string;
  entries: string[];
}

export const ENISA_RSIT_TAXONOMY: TaxonomyCategory[] = [
  { value: 'abusive-content', entries: ['spam', 'harmful-speech', 'child-abuse-material'] },
  {
    value: 'malicious-code',
    entries: [
      'virus',
      'worm',
      'trojan',
      'spyware',
      'ransomware',
      'rootkit',
      'dialer',
      'cryptominer',
    ],
  },
  {
    value: 'information-gathering',
    entries: ['scanning', 'sniffing', 'social-engineering', 'phishing'],
  },
  {
    value: 'intrusion-attempts',
    entries: ['exploitation-of-vulnerability', 'login-attempts', 'new-attack-signature'],
  },
  {
    value: 'intrusions',
    entries: ['compromised-account', 'compromised-application', 'compromised-system', 'bot'],
  },
  { value: 'availability', entries: ['dos', 'ddos', 'sabotage', 'outage'] },
  {
    value: 'information-content-security',
    entries: [
      'unauthorised-information-access',
      'unauthorised-information-modification',
      'data-loss',
      'data-leak',
    ],
  },
  {
    value: 'fraud',
    entries: ['unauthorised-use-of-resources', 'copyright', 'masquerade', 'phishing'],
  },
  {
    value: 'vulnerable',
    entries: [
      'weak-crypto',
      'ddos-amplifier',
      'potentially-unwanted-accessible',
      'information-disclosure',
      'vulnerable-system',
    ],
  },
];

/** All unique entry values across categories (for validation / iteration). */
export const TAXONOMY_ENTRY_VALUES = Array.from(
  new Set(ENISA_RSIT_TAXONOMY.flatMap((c) => c.entries)),
);
export const TAXONOMY_CATEGORY_VALUES = ENISA_RSIT_TAXONOMY.map((c) => c.value);
