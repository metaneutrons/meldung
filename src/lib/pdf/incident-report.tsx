import { resolve } from 'path';
import { Document, Font, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { ReportModel } from '@/lib/report/model';

// The PDF standard fonts (Helvetica & co.) cover Western European characters
// only: Cyrillic came out as unrelated Latin glyphs and Turkish ı, ğ, ş, İ as
// digits and punctuation. Noto Sans covers every language the portal offers
// and is embedded with a Unicode map, so the text can also be copied and
// searched. It ships in public/fonts, which Docker and Vercel already carry.
const FONT = 'Noto Sans';
Font.register({
  family: FONT,
  fonts: [
    { src: resolve(process.cwd(), 'public/fonts/NotoSans-Regular.ttf') },
    { src: resolve(process.cwd(), 'public/fonts/NotoSans-Bold.ttf'), fontWeight: 'bold' },
  ],
});

interface GlyphCache {
  characterSet: number[];
  glyphForCodePoint: (codePoint: number) => unknown;
}

let primed: Promise<void> | undefined;

/**
 * Fills fontkit's glyph cache once, every glyph with the characters it stands
 * for, before the first PDF is built.
 *
 * Noto draws some Cyrillic letters from Latin parts (Т from T, А from A).
 * When a subset embeds such a letter, fontkit caches the Latin part without
 * its character, and the cache outlives the document: in a later PDF that
 * Latin letter lost its text mapping, so it could not be copied or searched,
 * and sometimes did not render at all. With the cache filled first, every
 * entry carries its character from the start.
 */
export function primePdfFonts(): Promise<void> {
  primed ??= (async () => {
    // Numeric weights: getFont() does not resolve 'bold' and would hand back
    // the regular face twice.
    for (const fontWeight of [400, 700]) {
      const source = Font.getFont({ fontFamily: FONT, fontWeight });
      await source.load();
      const font = source.data as unknown as GlyphCache;
      for (const codePoint of font.characterSet) font.glyphForCodePoint(codePoint);
    }
  })();
  return primed;
}

// The built-in hyphenation follows English rules and split German words in
// the wrong places ("weit-erarbeiten"). Long words wrap whole instead.
Font.registerHyphenationCallback((word) => [word]);

interface IncidentReportProps {
  referenceNumber: string;
  orgName: string;
  generatedAt: string;
  model: ReportModel;
  /** Optional raster logo as a data URI (see generate.ts). */
  logo?: string | undefined;
  /** Brand color from config; drives header rule + headings. */
  accentColor: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: FONT, lineHeight: 1.4 },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomStyle: 'solid', paddingBottom: 12 },
  logo: { height: 32, marginBottom: 8, objectFit: 'contain' },
  // Larger text sets its own line height: inherited from the page it would be
  // 1.4 × 10 pt and too low for these sizes, so the title ran into the meta line.
  orgName: { fontSize: 14, fontWeight: 'bold', lineHeight: 1.3, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 'bold', lineHeight: 1.3, marginBottom: 6 },
  meta: { fontSize: 9, color: '#666' },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 1.3,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e0e0e0',
    paddingBottom: 3,
  },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 160, fontWeight: 'bold', color: '#333' },
  value: { flex: 1, color: '#111' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
});

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function IncidentReport({
  referenceNumber,
  orgName,
  generatedAt,
  model,
  logo,
  accentColor,
}: IncidentReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { borderBottomColor: accentColor }]}>
          {logo ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logo} style={styles.logo} />
          ) : (
            <Text style={styles.orgName}>{orgName}</Text>
          )}
          <Text style={[styles.title, { color: accentColor }]}>{model.title}</Text>
          <Text style={styles.meta}>
            {model.meta.reference}: {referenceNumber} | {model.meta.generated}: {generatedAt}
          </Text>
        </View>

        {model.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: accentColor }]}>{section.title}</Text>
            {section.fields.map((field) => (
              <Field key={field.label} label={field.label} value={field.value} />
            ))}
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${model.meta.page} ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
