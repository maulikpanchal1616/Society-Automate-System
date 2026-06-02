'use client'

import React from 'react'

interface BillingMonthSelectorProps {
  activeMonth: string // Format: YYYY-MM-01
  onChange: (newMonth: string) => void
  label?: string
}

export function BillingMonthSelector({ 
  activeMonth, 
  onChange,
  label = "Select Billing Month"
}: BillingMonthSelectorProps) {
  
  // Extract year and month from activeMonth (YYYY-MM-01)
  const activeYear = parseInt(activeMonth.split('-')[0], 10)
  const activeMonthNum = parseInt(activeMonth.split('-')[1], 10)

  // Generate Year Options: 2025 to CurrentYear + 1
  const currentYear = new Date().getFullYear()
  const yearOptions = []
  for (let y = 2025; y <= currentYear + 1; y++) {
    yearOptions.push(y)
  }

  // Generate Month Options: 1 to 12
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value
    const formattedMonth = String(activeMonthNum).padStart(2, '0')
    onChange(`${newYear}-${formattedMonth}-01`)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value
    const formattedMonth = String(newMonth).padStart(2, '0')
    onChange(`${activeYear}-${formattedMonth}-01`)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-bold text-[#8C8680] uppercase tracking-wider block">
          {label}
        </label>
      )}
      <div className="flex flex-row items-center gap-2">
        <select
          value={activeMonthNum}
          onChange={handleMonthChange}
          className="input text-sm bg-white border-slate-200 text-[#2D2A26] flex-1 min-w-[120px] focus:border-[#B79B6C] focus:ring-1 focus:ring-[#B79B6C] rounded-md shadow-sm"
        >
          {monthNames.map((name, index) => (
            <option key={index + 1} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={activeYear}
          onChange={handleYearChange}
          className="input text-sm bg-white border-slate-200 text-[#2D2A26] min-w-[90px] focus:border-[#B79B6C] focus:ring-1 focus:ring-[#B79B6C] rounded-md shadow-sm"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
