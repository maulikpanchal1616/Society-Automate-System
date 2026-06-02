import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/utils'

Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf'
})

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Inter', backgroundColor: '#ffffff' },
  header: { marginBottom: 20, borderBottom: '1px solid #E6E1D8', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#2D2A26' },
  subtitle: { fontSize: 10, color: '#8C8680', marginTop: 4 },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#E6E1D8', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#E6E1D8', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#F5F1EB', padding: 5 },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#E6E1D8', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableCellHeader: { margin: 2, fontSize: 10, fontWeight: 'bold', color: '#54504B' },
  tableCell: { margin: 2, fontSize: 10, color: '#2D2A26' }
})

export function ReportPDF({ title, data, columns }: { title: string, data: any[], columns: string[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Generated on: {new Date().toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            {columns.map((col, i) => (
              <View style={{ ...styles.tableColHeader, width: `${100 / columns.length}%` }} key={i}>
                <Text style={styles.tableCellHeader}>{col}</Text>
              </View>
            ))}
          </View>
          {data.map((row, i) => (
            <View style={styles.tableRow} key={i}>
              {columns.map((col, j) => {
                const val = row[col.toLowerCase()]
                const displayVal = typeof val === 'number' ? formatCurrency(val) : String(val || '-')
                return (
                  <View style={{ ...styles.tableCol, width: `${100 / columns.length}%` }} key={j}>
                    <Text style={styles.tableCell}>{displayVal}</Text>
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
