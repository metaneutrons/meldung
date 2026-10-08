/**
 * Plain `{name}` placeholders for operator-editable mail texts. Deliberately not
 * ICU MessageFormat: an operator writing YAML should not have to know that an
 * apostrophe or a brace changes the meaning of the text around it.
 */
export const MAIL_PLACEHOLDERS = ['reference', 'name', 'orgName'] as const;
export type MailPlaceholder = (typeof MAIL_PLACEHOLDERS)[number];

const PLACEHOLDER = /\{(\w+)\}/g;

/** Placeholders in a template that the mail cannot fill. */
export function unknownPlaceholders(template: string): string[] {
  const known = new Set<string>(MAIL_PLACEHOLDERS);
  return [...template.matchAll(PLACEHOLDER)]
    .map((m) => m[1] ?? '')
    .filter((key) => !known.has(key));
}

export function fillTemplate(template: string, values: Record<MailPlaceholder, string>): string {
  return template.replace(PLACEHOLDER, (match, key: string) =>
    key in values ? values[key as MailPlaceholder] : match,
  );
}
