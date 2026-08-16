'use client'

import React from 'react'
import { CustomSelect } from './CustomSelect'

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
    yearOptions.push({ value: y, label: String(y) })
  }

  // Generate Month Options: 1 to 12
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const monthOptions = monthNames.map((name, index) => ({
    value: index + 1,
    label: name
  }))

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
        <CustomSelect
          value={activeMonthNum}
          onChange={handleMonthChange}
          options={monthOptions}
          className="min-w-[120px] flex-1"
        />

        <CustomSelect
          value={activeYear}
          onChange={handleYearChange}
          options={yearOptions}
          className="min-w-[90px]"
        />
      </div>
    </div>
  )
}
