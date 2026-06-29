import postgres from 'postgres';
import type { IncidentRecord } from './index';

let client: ReturnType<typeof postgres> | null = null;
let tableReady = false;

function getClient(connectionString: string): ReturnType<typeof postgres> {
  client ??= postgres(connectionString, { max: 1, idle_timeout: 20 });
  return client;
}

export async function saveToPostgres(
  record: IncidentRecord,
  connectionString?: string,
): Promise<void> {
  if (!connectionString) {
    throw new Error('persistence.driver "postgres" requires a connectionString (DATABASE_URL).');
  }

  const sql = getClient(connectionString);

  if (!tableReady) {
    await sql`
      CREATE TABLE IF NOT EXISTS incidents (
        id uuid PRIMARY KEY,
        reference_number text NOT NULL,
        form_data jsonb NOT NULL,
        delivery_results jsonb NOT NULL,
        created_at timestamptz NOT NULL
      )
    `;
    tableReady = true;
  }

  await sql`
    INSERT INTO incidents (id, reference_number, form_data, delivery_results, created_at)
    VALUES (
      ${record.id},
      ${record.referenceNumber},
      ${sql.json(record.formData)},
      ${sql.json(record.deliveryResults as unknown as Parameters<typeof sql.json>[0])},
      ${record.createdAt}
    )
  `;
}
