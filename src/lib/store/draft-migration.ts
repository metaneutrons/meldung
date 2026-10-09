import { formDataSchema, type FormData } from '@/lib/form/schema';

const initialState: FormData = formDataSchema.parse({});

/** Bumped whenever a stored draft needs translating to the current form. */
export const DRAFT_VERSION = 2;

/**
 * Brings a draft saved by an older version of the form up to date.
 *
 * Version 0 asked three impact questions that no longer exist and "personal
 * data involved?" on its own. Only that last answer maps unambiguously onto
 * the new questions; the reporter answers the rest again. Version 1 took the
 * number of affected records as free text; a number maps onto the bands.
 */
export function migrateDraft(persisted: unknown, version: number): FormData {
  const draft = { ...(persisted as Record<string, unknown>) };
  if (version < 1) {
    const personal = draft.personalDataInvolved;
    draft.affectedInformation =
      personal === 'yes' ? ['personal'] : personal === 'unknown' ? ['unknown'] : [];
    delete draft.functionalImpact;
    delete draft.informationImpact;
    delete draft.recoverability;
  }
  if (version < 2) {
    // Version 1 asked for the number of affected records as free text.
    draft.affectedPersons = personsBand(draft.estimatedRecords);
    delete draft.estimatedRecords;
  }
  // Anything still unreadable falls back to an empty field instead of breaking the draft.
  const parsed = formDataSchema.safeParse(draft);
  return parsed.success ? parsed.data : { ...initialState, ...pickValid(draft) };
}

/** A free-text record count from an old draft, as the band the form now asks for. */
function personsBand(value: unknown): string {
  const n = typeof value === 'string' ? Number.parseInt(value.replace(/[^0-9]/g, ''), 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n <= 10) return '1-10';
  if (n <= 100) return '11-100';
  return 'over-100';
}

function pickValid(draft: Record<string, unknown>): Partial<FormData> {
  const shape = formDataSchema.shape;
  const valid: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (!(key in shape)) continue;
    const field = shape[key as keyof typeof shape].safeParse(value);
    if (field.success) valid[key] = field.data;
  }
  return valid;
}
