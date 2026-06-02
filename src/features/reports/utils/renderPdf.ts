import { renderToStream } from '@react-pdf/renderer'
import { ReportPDF } from '../components/ReportPDF'
import React from 'react'

export async function generateReportBuffer(title: string, data: any[], columns: string[]): Promise<Buffer> {
  const stream = await renderToStream(
    React.createElement(ReportPDF, { title, data, columns })
  )

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}
