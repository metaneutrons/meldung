import { appendFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { IncidentRecord } from './index';

export async function saveToFile(record: IncidentRecord, path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, JSON.stringify(record) + '\n', 'utf-8');
}
