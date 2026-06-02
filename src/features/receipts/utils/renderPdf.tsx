import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { ReceiptPDF, type ReceiptData } from '../components/ReceiptPDF'

export async function generateReceiptBuffer(data: ReceiptData) {
  return await renderToBuffer(<ReceiptPDF data={data} />)
}
