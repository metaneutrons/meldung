import { describe, it, expect } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { inflateSync } from 'zlib';
import { IncidentReport, primePdfFonts } from './incident-report';
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
        orgName: 'Example Organization',
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
        orgName: 'Example Organization',
        generatedAt: '2026-01-01 12:00',
        model,
        logo: PNG,
        accentColor: '#1d4ed8',
      }),
    );
    expect(isPdf(buf)).toBe(true);
  });
});

/** The Unicode code points each embedded font maps its glyphs to (ToUnicode CMaps). */
function unicodeMaps(pdf: Buffer): string[][] {
  const text = pdf.toString('latin1');
  const maps: string[][] = [];
  for (const match of text.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length;
    const end = text.indexOf('endstream', start);
    let body: string;
    try {
      body = inflateSync(pdf.subarray(start, end)).toString('latin1');
    } catch {
      continue;
    }
    const range = /beginbfrange([\s\S]*?)endbfrange/.exec(body)?.[1];
    if (range) maps.push([...range.matchAll(/<([0-9a-fA-F]*)>/g)].map((m) => m[1] ?? ''));
  }
  return maps;
}

describe('IncidentReport PDF text', () => {
  const render = (title: string, value: string) =>
    renderToBuffer(
      IncidentReport({
        referenceNumber: 'INC-20261009-abc6f7',
        orgName: 'Example Organization',
        generatedAt: '2026-10-09 12:00',
        accentColor: '#38b449',
        model: { ...model, title, sections: [{ title, fields: [{ label: title, value }] }] },
      }),
    );

  it('embeds a font with a Unicode map for Cyrillic and Turkish text', async () => {
    await primePdfFonts();
    const pdf = await render('Повідомлення ІТ-безпеки', 'Işık ğüşöç İĞŞ');
    const mapped = unicodeMaps(pdf).flat();
    // Т (U+0422), ı (U+0131), ğ (U+011F), İ (U+0130)
    for (const codePoint of ['0422', '0131', '011f', '0130']) {
      expect(mapped).toContain(codePoint);
    }
  });

  it('keeps every Latin letter mapped after a Cyrillic document', async () => {
    // Cyrillic Т and А are built from Latin T and A. Embedding them used to
    // strip T and A of their character for every later document in the
    // process, so they could not be copied, searched, or sometimes seen.
    await primePdfFonts();
    await render('ТАБЛИЦЯ ІТ', 'Т А');
    const pdf = await render('IT BT TA', 'Tag Abend');
    for (const map of unicodeMaps(pdf)) {
      expect(map).not.toContain('');
    }
    expect(unicodeMaps(pdf).flat()).toEqual(expect.arrayContaining(['0054', '0041']));
  });
});
