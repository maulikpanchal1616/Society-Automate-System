import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register Gujarati Font (Noto Sans Gujarati from Google Fonts via Raw GitHub)
Font.register({
  family: 'Noto Sans Gujarati',
  src: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf',
});

const PRIMARY_COLOR = '#a32e2e'; // Dark red/maroon matching the traditional receipt

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Noto Sans Gujarati',
    fontSize: 12,
    color: PRIMARY_COLOR,
    backgroundColor: '#Fdfbf7', // slight off-white paper feel
  },
  borderWrap: {
    border: `1.5pt solid ${PRIMARY_COLOR}`,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    paddingTop: 15,
    paddingBottom: 8,
    borderBottom: `1pt solid ${PRIMARY_COLOR}`,
  },
  omText: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 34,
    fontWeight: 'extrabold',
    marginBottom: 5,
    letterSpacing: 1,
  },
  addressLine: {
    fontSize: 10,
    marginTop: 5,
  },
  residentSection: {
    padding: 15,
    borderBottom: `1pt solid ${PRIMARY_COLOR}`,
  },
  residentRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dottedLineWrap: {
    flex: 1,
    borderBottom: `1pt dotted ${PRIMARY_COLOR}`,
    marginLeft: 5,
    marginRight: 5,
    display: 'flex',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  residentValueText: {
    fontSize: 14,
    paddingLeft: 10,
    color: PRIMARY_COLOR,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: `1pt solid ${PRIMARY_COLOR}`,
    backgroundColor: '#f5e9e9',
  },
  colParticulars: {
    width: '65%',
    padding: 8,
    borderRight: `1pt solid ${PRIMARY_COLOR}`,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  colRupeesTitle: {
    width: '20%',
    padding: 8,
    borderRight: `1pt solid ${PRIMARY_COLOR}`,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  colPaiseTitle: {
    width: '15%',
    padding: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  colParticularsVal: {
    width: '65%',
    padding: '8px 15px',
    borderRight: `1pt solid ${PRIMARY_COLOR}`,
    fontSize: 14,
  },
  colRupeesVal: {
    width: '20%',
    padding: 8,
    borderRight: `1pt solid ${PRIMARY_COLOR}`,
    textAlign: 'right',
    fontSize: 14,
  },
  colPaiseVal: {
    width: '15%',
    padding: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  totalsSection: {
    display: 'flex',
    flexDirection: 'row',
    borderTop: `1pt solid ${PRIMARY_COLOR}`,
    borderBottom: `1pt solid ${PRIMARY_COLOR}`,
    height: 70,
  },
  depositedTodayBox: {
    width: '65%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderRight: `1pt solid ${PRIMARY_COLOR}`,
  },
  redBoxLabel: {
    backgroundColor: PRIMARY_COLOR,
    color: '#ffffff',
    padding: '6px 15px',
    fontSize: 14,
    fontWeight: 'bold',
  },
  whiteBoxValue: {
    border: `1pt solid ${PRIMARY_COLOR}`,
    backgroundColor: '#ffffff',
    padding: '6px 15px',
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 100,
    textAlign: 'center',
    marginLeft: 5,
  },
  totalsRight: {
    width: '35%',
    display: 'flex',
    flexDirection: 'column',
  },
  totalRightRow: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
  },
  totalLabelBox: {
    width: '57%',
    padding: '4px 8px',
    borderRight: `1pt solid ${PRIMARY_COLOR}`,
    fontSize: 12,
  },
  totalValueBox: {
    width: '43%',
    padding: '4px 8px',
    textAlign: 'right',
    fontSize: 12,
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    padding: 15,
  },
  footerNotes: {
    width: '70%',
    fontSize: 12,
    lineHeight: 1.5,
  },
  signatureBox: {
    width: '30%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  metadataRow: {
    fontSize: 8,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  }
});

export interface ReceiptData {
  societyName: string;
  societyAddress: string;
  residentName: string;
  houseNumber: string;
  blockName: string;
  billMonth: string;
  maintenanceAmount: number;
  waterCharges: number;
  penaltyAmount: number;
  totalAmount: number;
  paymentMode?: string;
  payment_mode?: string;
  receiptNumber?: string;
  receipt_number?: string;
  paidAt?: string;
  paid_at?: string;
}

const splitAmount = (amount: number) => {
  const [rs, ps] = (amount || 0).toFixed(2).split('.');
  return { rs, ps };
};

export const ReceiptPDF = ({ data }: { data: ReceiptData }) => {
  // Safely resolve fields that might be snake_case from the RPC
  const paymentMode = data.paymentMode || data.payment_mode || 'cash';
  const receiptNumber = data.receiptNumber || data.receipt_number || 'N/A';
  const paidAt = data.paidAt || data.paid_at || new Date().toISOString();
  
  const maintAmt = splitAmount(data.maintenanceAmount);
  const waterAmt = splitAmount(data.waterCharges);
  const penAmt = splitAmount(data.penaltyAmount);
  const totalAmt = splitAmount(data.totalAmount);
  
  // Hardcode previous dues & other charges to 0 for now
  const prevAmt = { rs: '0', ps: '00' };
  const otherAmt = { rs: '0', ps: '00' };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.borderWrap}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.omText}>।। શ્રી ૧ ।।</Text>
            <Text style={styles.title}>{data.societyName || 'શ્યામવેદ રેસીડેન્સી'}</Text>
            <Text style={styles.addressLine}>
              {data.societyAddress || 'મનમોહન ચોકડી, રીંગ રોડની પાસે, જીવનજ્યોત સોસાયટીની સામે, નિકોલ, અમદાવાદ.'}
            </Text>
          </View>

          {/* Resident Details */}
          <View style={styles.residentSection}>
            <View style={styles.residentRow}>
              <Text style={{ fontSize: 14 }}>ફ્લેટ નં.</Text>
              <View style={styles.dottedLineWrap}>
                <Text style={styles.residentValueText}>{data.houseNumber}</Text>
              </View>
              
              <Text style={{ fontSize: 14, marginLeft: 15 }}>તા.</Text>
              <View style={[styles.dottedLineWrap, { maxWidth: 120 }]}>
                <Text style={styles.residentValueText}>{format(new Date(paidAt), 'dd - MM - yyyy')}</Text>
              </View>
            </View>

            <View style={[styles.residentRow, { marginBottom: 0 }]}>
              <Text style={{ fontSize: 14 }}>શ્રી.</Text>
              <View style={styles.dottedLineWrap}>
                <Text style={styles.residentValueText}>
                  {data.residentName} ({format(new Date(data.billMonth), 'MMMM-yyyy')})
                </Text>
              </View>
            </View>
          </View>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colParticulars}>વિગત</Text>
              <Text style={styles.colRupeesTitle}>રૂ.</Text>
              <Text style={styles.colPaiseTitle}>પૈસા</Text>
            </View>
            
            {/* Rows */}
            <View style={styles.tableRow}>
              <Text style={styles.colParticularsVal}>૧) મેન્ટેનન્સ</Text>
              <Text style={styles.colRupeesVal}>{maintAmt.rs}</Text>
              <Text style={styles.colPaiseVal}>{maintAmt.ps}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.colParticularsVal}>૨) પાણી વેરો</Text>
              <Text style={styles.colRupeesVal}>{data.waterCharges > 0 ? waterAmt.rs : ' '}</Text>
              <Text style={styles.colPaiseVal}>{data.waterCharges > 0 ? waterAmt.ps : ' '}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.colParticularsVal}>૩) દંડ</Text>
              <Text style={styles.colRupeesVal}>{data.penaltyAmount > 0 ? penAmt.rs : ' '}</Text>
              <Text style={styles.colPaiseVal}>{data.penaltyAmount > 0 ? penAmt.ps : ' '}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.colParticularsVal}>૪) અન્ય</Text>
              <Text style={styles.colRupeesVal}> </Text>
              <Text style={styles.colPaiseVal}> </Text>
            </View>
            <View style={[styles.tableRow, { flex: 1 }]}>
              <Text style={[styles.colParticularsVal, { borderBottom: 'none' }]}>૫) આગળના બાકી</Text>
              <Text style={[styles.colRupeesVal, { borderBottom: 'none' }]}> </Text>
              <Text style={[styles.colPaiseVal, { borderBottom: 'none' }]}> </Text>
            </View>
          </View>

          {/* Totals Section */}
          <View style={styles.totalsSection}>
            <View style={styles.depositedTodayBox}>
              <Text style={styles.redBoxLabel}>આજ રોજ જમા</Text>
              <Text style={styles.whiteBoxValue}>{totalAmt.rs}.{totalAmt.ps}</Text>
            </View>

            <View style={styles.totalsRight}>
              <View style={[styles.totalRightRow, { borderBottom: `1pt solid ${PRIMARY_COLOR}` }]}>
                <Text style={styles.totalLabelBox}>કુલ</Text>
                <Text style={styles.totalValueBox}>{totalAmt.rs}</Text>
              </View>
              <View style={[styles.totalRightRow, { borderBottom: `1pt solid ${PRIMARY_COLOR}` }]}>
                <Text style={styles.totalLabelBox}>જમા</Text>
                <Text style={styles.totalValueBox}>{totalAmt.rs}</Text>
              </View>
              <View style={styles.totalRightRow}>
                <Text style={styles.totalLabelBox}>બાકી</Text>
                <Text style={styles.totalValueBox}>0</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerNotes}>
              <Text>મેન્ટેનન્સ તા. ૧ થી ૧૫ માં ચુકવવાનું રહેશે.</Text>
              <Text>નહીતર ૫૦ રૂપિયા દંડ ચાર્જ લાગશે.</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={{ marginTop: 25 }}>નાણાં લેનારની સહી</Text>
            </View>
          </View>

        </View>

        {/* Small metadata text outside the receipt border */}
        <Text style={styles.metadataRow}>
          Receipt No: {receiptNumber} | Mode: {paymentMode.toUpperCase()} | Generated: {format(new Date(paidAt), 'dd/MM/yyyy HH:mm')}
        </Text>
      </Page>
    </Document>
  );
};
