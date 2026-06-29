/**
 * Default affected-systems checklist — STABLE KEYS only.
 * Localized labels live under `steps.systems.options.<key>` in the messages,
 * so the stored affectedSystems values are language-independent.
 */
export const SYSTEM_KEYS = [
  'campus-management',
  'learning-platform',
  'email',
  'research-db',
  'local-machines',
  'vpn-network',
  'cloud',
  'databases',
] as const;

export type SystemKey = (typeof SYSTEM_KEYS)[number];
