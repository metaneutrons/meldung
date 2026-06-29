import { renderToBuffer } from '@react-pdf/renderer';
import { IncidentReport } from './incident-report';
import { getConfig } from '@/lib/config';
import { buildReportModel } from '@/lib/report/model';
import type { FormData } from './types';

export type { FormData };

export async function generatePdf(
  data: FormData,
  referenceNumber: string,
  locale: string,
): Promise<Buffer> {
  const config = getConfig();
  const generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const model = await buildReportModel(data, locale);

  const buffer = await renderToBuffer(
    IncidentReport({
      referenceNumber,
      orgName: config.branding.orgName,
      generatedAt,
      model,
    }),
  );

  return Buffer.from(buffer);
}
