'use client'

// Mobile-optimized search bar — updates URL on submit (SSR filters)
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef } from 'react'

interface Props { defaultValue: string }

export default function ResidentSearch({ defaultValue }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const current = new URLSearchParams(params.toString())
    if (value.trim()) {
      current.set('q', value.trim())
    } else {
      current.delete('q')
    }
    current.set('page', '1')
    router.push(`/admin/residents?${current.toString()}`)
  }

  function handleClear() {
    setValue('')
    const current = new URLSearchParams(params.toString())
    current.delete('q')
    router.push(`/admin/residents?${current.toString()}`)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: '#8C8680' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          className="input !pl-10 pr-8 text-sm"
          placeholder="Search by house number, owner, phone..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: '#8C8680' }}
          >
            ✕
          </button>
        )}
      </div>
      <button type="submit" className="btn btn-primary text-sm px-4 shrink-0">
        Search
      </button>
    </form>
  )
}
