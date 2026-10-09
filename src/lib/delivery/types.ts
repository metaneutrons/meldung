import type { FormData } from '@/lib/pdf/types';
import type { Triage } from '@/lib/triage';

export interface DeliveryResult {
  success: boolean;
  channel: string;
  error?: string;
  /** The ticket number a helpdesk assigned, for the reporter to quote. */
  ticketNumber?: string;
}

export interface DeliveryContext {
  data: FormData;
  referenceNumber: string;
  pdfBuffer: Buffer;
  locale: string;
  /** ISO 8601 submission timestamp — shared with the persistence audit trail. */
  submittedAt: string;
  /** Preliminary priority for the team; never shown to the reporter. */
  triage: Triage;
  /** Language of the team-facing triage note: the deployment's defaultLocale. */
  teamLocale: string;
}
