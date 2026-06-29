import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { renderToBuffer } from '@react-pdf/renderer';
import { IncidentReport } from './incident-report';
import { getConfig } from '@/lib/config';
import { buildReportModel } from '@/lib/report/model';
import type { FormData } from './types';

export type { FormData };

const RASTER_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Loads the PDF logo as a data URI. @react-pdf can only embed raster images,
 * so SVG (and missing files) gracefully fall back to the org-name heading.
 */
function loadPdfLogo(logoPdfUrl?: string, logoUrl?: string): string | undefined {
  const candidate = logoPdfUrl ?? logoUrl;
  if (!candidate) return undefined;

  const ext = candidate.split('.').pop()?.toLowerCase() ?? '';
  const mime = RASTER_MIME[ext];
  if (!mime) return undefined;

  const file = resolve(process.cwd(), 'public', candidate.replace(/^\/+/, ''));
  if (!existsSync(file)) return undefined;

  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

export async function generatePdf(
  data: FormData,
  referenceNumber: string,
  locale: string,
): Promise<Buffer> {
  const config = getConfig();
  const generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const model = await buildReportModel(data, locale);
  if (config.branding.appTitle) model.title = config.branding.appTitle;
  const logo = loadPdfLogo(config.branding.logoPdfUrl, config.branding.logoUrl);

  const buffer = await renderToBuffer(
    IncidentReport({
      referenceNumber,
      orgName: config.branding.orgName,
      generatedAt,
      model,
      logo,
      accentColor: config.branding.primaryColor,
    }),
  );

  return Buffer.from(buffer);
}
