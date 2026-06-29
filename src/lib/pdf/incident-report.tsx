import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReportModel } from '@/lib/report/model';

interface IncidentReportProps {
  referenceNumber: string;
  orgName: string;
  generatedAt: string;
  model: ReportModel;
}

const ACCENT = '#38b449';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', lineHeight: 1.4 },
  header: { marginBottom: 20, borderBottom: '2 solid ' + ACCENT, paddingBottom: 12 },
  orgName: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: ACCENT, marginBottom: 4 },
  meta: { fontSize: 9, color: '#666' },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    marginBottom: 6,
    borderBottom: '1 solid #e0e0e0',
    paddingBottom: 3,
  },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 160, fontFamily: 'Helvetica-Bold', color: '#333' },
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
}: IncidentReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.orgName}>{orgName}</Text>
          <Text style={styles.title}>{model.title}</Text>
          <Text style={styles.meta}>
            {model.meta.reference}: {referenceNumber} | {model.meta.generated}: {generatedAt}
          </Text>
        </View>

        {model.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
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
