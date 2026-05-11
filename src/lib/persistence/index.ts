import { getConfig } from '@/lib/config';
import type { FormData } from '@/lib/pdf/types';
import type { DeliveryResult } from '@/lib/delivery/types';

export interface IncidentRecord {
  id: string;
  referenceNumber: string;
  formData: FormData;
  deliveryResults: DeliveryResult[];
  createdAt: string;
}

export async function saveIncident(record: IncidentRecord): Promise<void> {
  const config = getConfig();
  if (!config.persistence.enabled) return;

  if (config.persistence.driver === 'sqlite') {
    const { saveToFile } = await import('./file');
    await saveToFile(record, config.persistence.connectionString ?? './data/meldung.jsonl');
  }
  // PostgreSQL: future implementation
}
