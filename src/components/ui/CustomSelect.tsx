import React, { useState, useRef, useEffect, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string | number
  label: string
}

interface CustomSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'defaultValue'> {
  options: SelectOption[]
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  placeholder?: string
  dropdownClassName?: string
  value?: string | number
  defaultValue?: string | number
}

export const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(
  ({ options, placeholder = 'Select an option', className, dropdownClassName, disabled, value, defaultValue, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [internalValue, setInternalValue] = useState<string | number>(value ?? defaultValue ?? '')

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value)
      }
    }, [value])

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find((opt) => String(opt.value) === String(internalValue))

    const handleSelect = (optValue: string | number) => {
      if (value === undefined) {
        setInternalValue(optValue)
      }
      setIsOpen(false)
      if (onChange) {
        const event = {
          target: { value: String(optValue), name: props.name },
          currentTarget: { value: String(optValue), name: props.name },
          preventDefault: () => {},
          stopPropagation: () => {}
        } as React.ChangeEvent<HTMLSelectElement>
        onChange(event)
      }
    }

    return (
      <div className={cn("relative inline-block w-full", className)} ref={containerRef}>
        <select
          ref={ref}
          value={internalValue}
          onChange={(e) => handleSelect(e.target.value)}
          className="sr-only"
          tabIndex={-1}
          disabled={disabled}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C56E4D]/20 focus:border-[#C56E4D]",
            isOpen ? "border-[#C56E4D] ring-2 ring-[#C56E4D]/20" : "hover:border-[#B79B6C]",
            disabled && "opacity-50 cursor-not-allowed bg-slate-50"
          )}
        >
          <span className={cn("block truncate", !selectedOption && "text-slate-400")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={16} className={cn("ml-2 shrink-0 transition-transform duration-200 text-slate-400", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className={cn(
            "absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto",
            dropdownClassName
          )}>
            <ul className="p-1 space-y-0.5">
              {options.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleSelect(opt.value)
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                      String(internalValue) === String(opt.value)
                        ? "bg-[#C56E4D]/10 text-[#C56E4D] font-medium"
                        : "text-slate-700 hover:bg-[#B79B6C]/10 hover:text-[#2D2A26]"
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
)
CustomSelect.displayName = 'CustomSelect'
