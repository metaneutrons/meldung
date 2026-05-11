import { renderToBuffer } from '@react-pdf/renderer';
import { IncidentReport } from './incident-report';
import { getConfig } from '@/lib/config';
import type { FormData } from './types';

export type { FormData };

export async function generatePdf(data: FormData, referenceNumber: string): Promise<Buffer> {
  const config = getConfig();
  const generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');

  const buffer = await renderToBuffer(
    IncidentReport({
      data,
      referenceNumber,
      orgName: config.branding.orgName,
      locale: config.defaultLocale,
      generatedAt,
    }),
  );

  return Buffer.from(buffer);
}
