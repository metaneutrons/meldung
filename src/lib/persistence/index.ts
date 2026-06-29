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

/**
 * Optional audit trail. Disabled by default → delivery (e-mail / Znuny) is the
 * source of truth. Drivers are loaded lazily so unused ones add no runtime cost:
 *   - "postgres" — serverless-friendly (Vercel Postgres, Neon, Supabase, …)
 *   - "sqlite"   — append-only JSONL file (self-hosted / Docker volume)
 */
export async function saveIncident(record: IncidentRecord): Promise<void> {
  const config = getConfig();
  if (!config.persistence.enabled) return;

  if (config.persistence.driver === 'postgres') {
    const { saveToPostgres } = await import('./postgres');
    await saveToPostgres(record, config.persistence.connectionString);
    return;
  }

  const { saveToFile } = await import('./file');
  await saveToFile(record, config.persistence.connectionString ?? './data/meldung.jsonl');
}
