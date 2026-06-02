'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { FileDown, Table, BarChart2 } from 'lucide-react'

export default function ReportsClient({
  collectionData,
  outstandingData,
  summaryData
}: {
  collectionData: any[]
  outstandingData: any[]
  summaryData: any
}) {
  const [activeTab, setActiveTab] = useState<'collections' | 'outstanding' | 'summary'>('summary')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2D2A26]">Financial Reports</h1>
        
        <div className="flex gap-2">
          {/* Future: Excel Export Button */}
          <button className="btn btn-secondary flex items-center gap-2" disabled title="Excel export coming soon">
            <Table size={16} /> Excel
          </button>
          {/* PDF Export Placeholder - Route will be built next */}
          <a 
            href={`/api/reports-pdf?type=${activeTab}`}
            target="_blank"
            className="btn btn-primary flex items-center gap-2"
          >
            <FileDown size={16} /> Download PDF
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar space-x-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors ${activeTab === 'summary' ? 'border-[#C56E4D] text-[#C56E4D]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Income vs Expense
        </button>
        <button 
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors ${activeTab === 'collections' ? 'border-[#C56E4D] text-[#C56E4D]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Collection Statement
        </button>
        <button 
          onClick={() => setActiveTab('outstanding')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors ${activeTab === 'outstanding' ? 'border-[#C56E4D] text-[#C56E4D]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Outstanding Dues
        </button>
      </div>

      {/* Tab Content */}
      <div className="glass-card p-6 bg-white min-h-[400px]">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#2D2A26]">Summary: {summaryData.month}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Income</p>
                <p className="text-2xl font-bold text-[#7A8B74] mt-1">{formatCurrency(summaryData.totalIncome)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Approved Expenses</p>
                <p className="text-2xl font-bold text-[#C56E4D] mt-1">{formatCurrency(summaryData.totalExpense)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Surplus / Deficit</p>
                <p className={`text-2xl font-bold mt-1 ${summaryData.netSurplus >= 0 ? 'text-[#7A8B74]' : 'text-[#C56E4D]'}`}>
                  {formatCurrency(summaryData.netSurplus)}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-[#2D2A26] mb-4">Expense Breakdown</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F5F1EB] text-[#8C8680] text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaryData.expenseBreakdown.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500">No expenses recorded</td></tr>
                    ) : summaryData.expenseBreakdown.map((e: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{e.category}</td>
                        <td className="px-4 py-3 text-slate-900 font-medium text-right">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#2D2A26]">Collection Statement (Current Month)</h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F1EB] text-[#8C8680] text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Receipt #</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">House</th>
                    <th className="px-4 py-3 font-semibold">Mode</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collectionData.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No collections found</td></tr>
                  ) : collectionData.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{row.receipt}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-slate-900 font-medium">{row.house}</td>
                      <td className="px-4 py-3 text-slate-600 uppercase text-xs">{row.mode}</td>
                      <td className="px-4 py-3 text-slate-900 font-bold text-right">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'outstanding' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#2D2A26]">Outstanding Dues Report</h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F1EB] text-[#8C8680] text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">House</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">Bill Month</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outstandingData.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">All dues cleared!</td></tr>
                  ) : outstandingData.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900 font-medium">{row.house}</td>
                      <td className="px-4 py-3 text-slate-600">{row.contact || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(row.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3"><span className={`badge ${row.status === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{row.status}</span></td>
                      <td className="px-4 py-3 text-[#C56E4D] font-bold text-right">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
