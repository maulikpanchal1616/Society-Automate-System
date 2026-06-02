'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { formatCurrency } from '@/lib/utils'

export function CollectionTrendChart({ data }: { data: any[] }) {
  return (
    <div className="glass-card p-6 h-[300px]">
      <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#2D2A26' }}>6-Month Collection Trend</h3>
      <div className="h-full w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E1D8" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8C8680' }} dy={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#8C8680' }}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />
            <Tooltip 
              cursor={{ fill: '#F5F1EB' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E6E1D8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => [formatCurrency(value), 'Collected']}
            />
            <Bar dataKey="Collected" fill="#7A8B74" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
