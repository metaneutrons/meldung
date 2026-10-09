/**
 * Plain `{name}` placeholders for the mail texts in report.confirmationMail.
 * Deliberately not ICU MessageFormat: a deployment overriding the text should
 * not have to know that an apostrophe changes the meaning of what follows.
 */
export const MAIL_PLACEHOLDERS = ['reference', 'name', 'orgName', 'ticketLine', 'ticket'] as const;
export type MailPlaceholder = (typeof MAIL_PLACEHOLDERS)[number];

const PLACEHOLDER = /\{(\w+)\}/g;

/** Fills the given placeholders; any other {name} is left as it is. */
export function fillTemplate(
  template: string,
  values: Partial<Record<MailPlaceholder, string>>,
): string {
  return template.replace(PLACEHOLDER, (match, key: string) => {
    const value = values[key as MailPlaceholder];
    return value ?? match;
  });
}
