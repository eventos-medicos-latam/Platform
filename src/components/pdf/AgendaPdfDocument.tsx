import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { PdfAgendaDay } from '../../lib/pdf/fetchAgendaForPdf';
import { agendaTypeLabels } from '../../data/agenda';
import { formatTimeRange } from '../../utils/format';

const BRAND = '#0f2d52';
const BRAND_SUPPORT = '#1c5f8c';
const INK_MUTED = '#5b6b80';
const LINE = '#dbe4ee';

const styles = StyleSheet.create({
  page: { paddingHorizontal: 36, paddingVertical: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#33475f' },
  coverPage: { paddingHorizontal: 48, paddingVertical: 64, backgroundColor: BRAND, color: '#ffffff' },
  logo: { width: 140, marginBottom: 40 },
  coverEyebrow: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#ffffffaa', marginBottom: 10 },
  coverTitle: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  coverSubtitle: { fontSize: 13, color: '#ffffffcc', marginBottom: 28 },
  coverMetaRow: { flexDirection: 'row', gap: 24, marginTop: 12 },
  coverMetaLabel: { fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: '#ffffff88', marginBottom: 3 },
  coverMetaValue: { fontSize: 12, fontWeight: 700 },
  dayHeader: { marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: BRAND },
  dayLabel: { fontSize: 15, fontWeight: 700, color: BRAND },
  dayConcept: { fontSize: 10, color: BRAND_SUPPORT, marginTop: 2 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 8, gap: 10 },
  timeCol: { width: 80 },
  time: { fontSize: 10, fontWeight: 700, color: BRAND },
  type: { fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', color: INK_MUTED, marginTop: 2 },
  mainCol: { flex: 1 },
  title: { fontSize: 11, fontWeight: 700, color: BRAND },
  description: { fontSize: 9, color: INK_MUTED, marginTop: 2 },
  meta: { fontSize: 8, color: INK_MUTED, marginTop: 3 },
  roomCol: { width: 80, fontSize: 9, color: INK_MUTED, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, fontSize: 7, color: INK_MUTED, textAlign: 'center' }
});

interface AgendaPdfDocumentProps {
  logoUrl: string;
  eventName: string;
  editionLabel: string;
  venueLine: string;
  dateLine: string;
  days: PdfAgendaDay[];
  generatedAtLabel: string;
}

export function AgendaPdfDocument({ logoUrl, eventName, editionLabel, venueLine, dateLine, days, generatedAtLabel }: AgendaPdfDocumentProps) {
  return <Document>
      <Page size="A4" style={styles.coverPage}>
        <Image src={logoUrl} style={styles.logo} />
        <Text style={styles.coverEyebrow}>Agenda académica</Text>
        <Text style={styles.coverTitle}>{eventName}</Text>
        <Text style={styles.coverSubtitle}>{editionLabel}</Text>
        <View style={styles.coverMetaRow}>
          <View>
            <Text style={styles.coverMetaLabel}>Fecha</Text>
            <Text style={styles.coverMetaValue}>{dateLine}</Text>
          </View>
          <View>
            <Text style={styles.coverMetaLabel}>Sede</Text>
            <Text style={styles.coverMetaValue}>{venueLine}</Text>
          </View>
        </View>
      </Page>
      {days.map((day) => <Page key={day.day} size="A4" style={styles.page}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            {day.concept ? <Text style={styles.dayConcept}>{day.concept}</Text> : null}
          </View>
          {day.items.map((item) => <View key={item.id} style={styles.row} wrap={false}>
              <View style={styles.timeCol}>
                <Text style={styles.time}>{item.start_time === 'PENDIENTE' ? 'Por confirmar' : formatTimeRange(item.start_time, item.end_time)}</Text>
                <Text style={styles.type}>{agendaTypeLabels[item.type as keyof typeof agendaTypeLabels] ?? item.type}</Text>
              </View>
              <View style={styles.mainCol}>
                <Text style={styles.title}>{item.title}</Text>
                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                {item.trackName || item.speakerNames.length > 0 ? <Text style={styles.meta}>
                    {[item.trackName, item.speakerNames.join(', ')].filter(Boolean).join(' · ')}
                  </Text> : null}
              </View>
              <Text style={styles.roomCol}>{item.room === 'PENDIENTE' ? '' : item.room}</Text>
            </View>)}
          <Text style={styles.footer}>Generado el {generatedAtLabel} · sujeto a cambios del comité académico</Text>
        </Page>)}
    </Document>;
}
