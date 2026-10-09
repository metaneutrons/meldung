/**
 * Plain `{name}` placeholders for the mail texts in report.confirmationMail.
 * Deliberately not ICU MessageFormat: a deployment overriding the text should
 * not have to know that an apostrophe changes the meaning of what follows.
 */
export const MAIL_PLACEHOLDERS = ['reference', 'name', 'orgName'] as const;
export type MailPlaceholder = (typeof MAIL_PLACEHOLDERS)[number];

const PLACEHOLDER = /\{(\w+)\}/g;

export function fillTemplate(template: string, values: Record<MailPlaceholder, string>): string {
  return template.replace(PLACEHOLDER, (match, key: string) =>
    key in values ? values[key as MailPlaceholder] : match,
  );
}
