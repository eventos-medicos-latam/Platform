import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const BRAND = '#0f2d52';
const INK_MUTED = '#5b6b80';
const LINE = '#dbe4ee';

const styles = StyleSheet.create({
  page: { paddingHorizontal: 44, paddingVertical: 44, fontSize: 10, fontFamily: 'Helvetica', color: '#33475f' },
  logo: { width: 150, marginBottom: 28 },
  eyebrow: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: INK_MUTED, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 700, color: BRAND, marginBottom: 4 },
  subtitle: { fontSize: 11, color: INK_MUTED, marginBottom: 22 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#e8eef6', color: BRAND, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 4, marginBottom: 20 },
  amount: { fontSize: 26, fontWeight: 700, color: BRAND, marginBottom: 24 },
  grid: { flexDirection: 'row', gap: 28, marginBottom: 22 },
  col: { flex: 1 },
  label: { fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: INK_MUTED, marginBottom: 3 },
  value: { fontSize: 11, fontWeight: 700, color: BRAND },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: BRAND, paddingBottom: 6, marginBottom: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 8 },
  th: { fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: INK_MUTED },
  td: { fontSize: 10, color: BRAND },
  colConcept: { flex: 1.4 },
  colKind: { width: 90 },
  colDate: { width: 80 },
  colAmount: { width: 90, textAlign: 'right' },
  totals: { marginTop: 16, paddingTop: 12, borderTopWidth: 1.5, borderTopColor: BRAND },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  note: { marginTop: 28, fontSize: 8, color: INK_MUTED, lineHeight: 1.45 },
  footer: { position: 'absolute', bottom: 28, left: 44, right: 44, fontSize: 7, color: INK_MUTED, textAlign: 'center' }
});

export interface ReceiptLine {
  concept: string;
  kindLabel: string;
  amountLabel: string;
  paidAtLabel: string;
  methodLabel: string;
  reference: string;
}

export interface ReceiptPdfProps {
  logoUrl: string;
  title: string;
  kindLabel: string | null;
  amountLabel: string | null;
  issuerName: string;
  issuerPlace: string;
  companyName: string;
  companyLegalName: string;
  companyNit: string;
  editionName: string;
  planName: string;
  agreedLabel: string;
  paidLabel: string;
  remainingLabel: string;
  lines: ReceiptLine[];
  generatedAtLabel: string;
}

export function PaymentReceiptPdfDocument({
  logoUrl,
  title,
  kindLabel,
  amountLabel,
  issuerName,
  issuerPlace,
  companyName,
  companyLegalName,
  companyNit,
  editionName,
  planName,
  agreedLabel,
  paidLabel,
  remainingLabel,
  lines,
  generatedAtLabel
}: ReceiptPdfProps) {
  return <Document>
      <Page size="A4" style={styles.page}>
        <Image src={logoUrl} style={styles.logo} />
        <Text style={styles.eyebrow}>Comprobante de pago</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{editionName}{planName ? ` · ${planName}` : ''}</Text>
        {kindLabel ? <Text style={styles.badge}>{kindLabel}</Text> : null}
        {amountLabel ? <Text style={styles.amount}>{amountLabel}</Text> : null}

        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Emitido por</Text>
            <Text style={styles.value}>{issuerName}</Text>
            <Text style={styles.td}>{issuerPlace}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Pagado por</Text>
            <Text style={styles.value}>{companyName}</Text>
            {companyLegalName ? <Text style={styles.td}>{companyLegalName}</Text> : null}
            {companyNit ? <Text style={styles.td}>NIT {companyNit}</Text> : null}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colConcept]}>Concepto</Text>
          <Text style={[styles.th, styles.colKind]}>Tipo</Text>
          <Text style={[styles.th, styles.colDate]}>Fecha</Text>
          <Text style={[styles.th, styles.colAmount]}>Valor</Text>
        </View>
        {lines.map((line, index) => <View key={`${line.concept}-${index}`} style={styles.tableRow} wrap={false}>
            <View style={styles.colConcept}>
              <Text style={styles.td}>{line.concept}</Text>
              <Text style={{ fontSize: 8, color: INK_MUTED, marginTop: 2 }}>{line.methodLabel}{line.reference ? ` · ${line.reference}` : ''}</Text>
            </View>
            <Text style={[styles.td, styles.colKind]}>{line.kindLabel}</Text>
            <Text style={[styles.td, styles.colDate]}>{line.paidAtLabel}</Text>
            <Text style={[styles.td, styles.colAmount]}>{line.amountLabel}</Text>
          </View>)}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Convenio pactado</Text>
            <Text style={styles.value}>{agreedLabel}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Pagado a la fecha</Text>
            <Text style={styles.value}>{paidLabel}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Saldo pendiente</Text>
            <Text style={styles.value}>{remainingLabel}</Text>
          </View>
        </View>

        <Text style={styles.note}>
          Este documento es un recibo interno de caja: acredita el pago recibido (anticipo, abono o liquidación del convenio). No reemplaza la factura electrónica de venta que emite el organizador cuando corresponda ante la DIAN.
        </Text>
        <Text style={styles.footer}>Generado el {generatedAtLabel} · {issuerName}</Text>
      </Page>
    </Document>;
}
