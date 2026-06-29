import type { FormData } from '@/lib/pdf/types';

export interface DeliveryResult {
  success: boolean;
  channel: string;
  error?: string;
}

export interface DeliveryContext {
  data: FormData;
  referenceNumber: string;
  pdfBuffer: Buffer;
  locale: string;
  /** ISO 8601 submission timestamp — shared with the persistence audit trail. */
  submittedAt: string;
}
