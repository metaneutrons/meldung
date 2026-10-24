import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { saveToFile } from './file';
import type { IncidentRecord } from './index';

const record = (id: string) => ({ id, referenceNumber: `INC-${id}` }) as unknown as IncidentRecord;

describe('saveToFile', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'meldung-file-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('creates missing directories and writes one JSON line per record', async () => {
    const path = join(dir, 'nested', 'reports.jsonl');
    await saveToFile(record('1'), path);
    await saveToFile(record('2'), path);
    const lines = (await readFile(path, 'utf-8')).trimEnd().split('\n');
    expect(lines.map((line) => (JSON.parse(line) as { id: string }).id)).toEqual(['1', '2']);
  });
});
