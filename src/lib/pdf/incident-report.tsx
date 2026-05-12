import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FormData } from './types';

interface IncidentReportProps {
  data: FormData;
  referenceNumber: string;
  orgName: string;
  locale: string;
  generatedAt: string;
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
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#999' },
});

function Field({ label, value }: { label: string; value: string | string[] }) {
  const display = Array.isArray(value) ? value.join(', ') : value;
  if (!display) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{display}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function IncidentReport({ data, referenceNumber, orgName, generatedAt }: IncidentReportProps) {
  const showGdpr = data.personalDataInvolved === 'yes' || data.personalDataInvolved === 'unknown';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.orgName}>{orgName}</Text>
          <Text style={styles.title}>IT Security Incident Report</Text>
          <Text style={styles.meta}>
            Reference: {referenceNumber} | Generated: {generatedAt}
          </Text>
        </View>

        <Section title="Reporter Information">
          <Field label="Name" value={data.reporterName} />
          <Field label="Department" value={data.department} />
          <Field label="Role" value={data.role} />
          <Field label="Email" value={data.email} />
          <Field label="Phone" value={data.phone} />
          <Field label="Report Date" value={data.reportDate} />
        </Section>

        <Section title="Timeline">
          <Field label="Discovery Date" value={data.discoveryDate} />
          <Field label="Occurrence Date" value={data.occurrenceDate} />
          <Field label="Ongoing" value={data.isOngoing} />
        </Section>

        <Section title="Classification">
          <Field label="Category" value={data.incidentCategory} />
          <Field label="Sub-Type" value={data.incidentSubType} />
        </Section>

        <Section title="Description">
          <Field label="Description" value={data.description} />
          <Field label="How Discovered" value={data.howDiscovered} />
          <Field label="Attack Vector" value={data.attackVector} />
        </Section>

        <Section title="Affected Systems">
          <Field label="Systems" value={data.affectedSystems} />
          <Field label="Other" value={data.affectedSystemsOther} />
        </Section>

        <Section title="Impact Assessment">
          <Field label="Functional Impact" value={data.functionalImpact} />
          <Field label="Information Impact" value={data.informationImpact} />
          <Field label="Recoverability" value={data.recoverability} />
          <Field label="Personal Data Involved" value={data.personalDataInvolved} />
        </Section>

        <Section title="Measures Taken">
          <Field label="Measures" value={data.measuresTaken} />
          <Field label="Resolved" value={data.isResolved} />
          <Field label="Recommended Actions" value={data.recommendedActions} />
        </Section>

        {showGdpr && (
          <Section title="GDPR Assessment">
            <Field label="Data Categories" value={data.dataCategories} />
            <Field label="Person Categories" value={data.personCategories} />
            <Field label="Estimated Records" value={data.estimatedRecords} />
            <Field label="DPO Contact" value={data.dpoContact} />
            <Field label="GDPR Breach" value={data.isGdprBreach} />
          </Section>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
