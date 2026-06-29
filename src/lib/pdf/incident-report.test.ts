import { describe, it, expect } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { IncidentReport } from './incident-report';
import type { ReportModel } from '@/lib/report/model';

const model: ReportModel = {
  title: 'Test Report',
  category: 'Malicious Code',
  meta: { reference: 'Reference', generated: 'Generated', page: 'Page' },
  sections: [
    { title: 'Reporter', fields: [{ label: 'Name', value: 'Jane Doe' }] },
    { title: 'Classification', fields: [{ label: 'Category', value: 'Malicious Code' }] },
  ],
};

// Valid 1x1 PNG (RGBA).
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==';

function isPdf(buf: Buffer): boolean {
  return buf.subarray(0, 5).toString('latin1') === '%PDF-';
}

describe('IncidentReport PDF', () => {
  it('renders a valid PDF using the org name when no logo is set', async () => {
    const buf = await renderToBuffer(
      IncidentReport({
        referenceNumber: 'INC-20260101-abcd',
        orgName: 'Hochschule Hannover',
        generatedAt: '2026-01-01 12:00',
        model,
        accentColor: '#38b449',
      }),
    );
    expect(isPdf(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('renders a valid PDF with an embedded raster logo', async () => {
    const buf = await renderToBuffer(
      IncidentReport({
        referenceNumber: 'INC-20260101-abcd',
        orgName: 'Hochschule Hannover',
        generatedAt: '2026-01-01 12:00',
        model,
        logo: PNG,
        accentColor: '#1d4ed8',
      }),
    );
    expect(isPdf(buf)).toBe(true);
  });
});
