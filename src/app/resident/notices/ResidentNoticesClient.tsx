'use client'

// =============================================================================
// RESIDENT COMPONENT — /resident/notices/ResidentNoticesClient.tsx
// Read-only notice viewer for residents. Shows priority badges, type tags,
// search filter, and real-time update subscription.
// =============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useRealtimeSubscription } from '@/lib/supabase/hooks/useRealtimeSubscription'
import { useToastStore } from '@/components/ui/Toast'

interface Notice {
  id: string
  title: string
  description: string | null
  type: string
  priority: string
  audience: string
  status: string
  published_at: string | null
  expiry_date: string | null
  publisher: { full_name: string } | null
}

interface Props {
  initialNotices: Notice[]
  currentUserId: string
}

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  emergency: {
    label: 'Emergency',
    bg: 'rgba(197,110,77,0.08)',
    text: '#C56E4D',
    border: 'rgba(197,110,77,0.25)',
    dot: '#C56E4D',
  },
  important: {
    label: 'Important',
    bg: 'rgba(183,155,108,0.08)',
    text: '#9E8357',
    border: 'rgba(183,155,108,0.25)',
    dot: '#B79B6C',
  },
  normal: {
    label: 'General',
    bg: 'rgba(84,80,75,0.06)',
    text: '#54504B',
    border: 'rgba(84,80,75,0.15)',
    dot: '#8C8680',
  },
}

const TYPE_ICONS: Record<string, string> = {
  general: '📋',
  maintenance: '🔧',
  payment_reminder: '💳',
  emergency: '🚨',
  meeting: '🤝',
  festival: '🎉',
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ResidentNoticesClient({ initialNotices, currentUserId }: Props) {
  const router = useRouter()
  const { addToast } = useToastStore()
  const [notices, setNotices] = useState(initialNotices)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  // Real-time subscription for live updates
  const { payload } = useRealtimeSubscription({ table: 'notices', event: '*' })

  useEffect(() => {
    if (payload && payload.new && payload.new.published_by !== currentUserId) {
      if (payload.eventType === 'INSERT' && payload.new.status === 'published') {
        addToast(`📢 New Notice: ${payload.new.title}`, 'info')
      }
      router.refresh()
    }
  }, [payload, router, currentUserId, addToast])

  useEffect(() => {
    setNotices(initialNotices)
  }, [initialNotices])

  // Unique notice types for filter chips
  const types = ['all', ...Array.from(new Set((notices || []).map((n) => n.type)))]

  const filtered = notices.filter((n) => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.description || '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || n.type === filterType
    return matchSearch && matchType
  })

  // Separate emergency notices to pin to top
  const emergency = filtered.filter((n) => n.priority === 'emergency')
  const rest = filtered.filter((n) => n.priority !== 'emergency')
  const sorted = [...emergency, ...rest]

  return (
    <div className="space-y-5">
      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8C8680', left: '0.875rem' }} aria-hidden />
          <input
            type="text"
            placeholder="Search notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full text-sm"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Type filter chips — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {(types || []).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all"
              style={
                filterType === type
                  ? { background: 'linear-gradient(135deg, #C56E4D, #B79B6C)', color: 'white' }
                  : { background: 'rgba(183,155,108,0.08)', color: '#8C8680' }
              }
            >
              {type === 'all' ? 'All' : `${TYPE_ICONS[type] || '📋'} ${type.replace('_', ' ')}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats summary pill */}
      <p className="text-xs font-semibold" style={{ color: '#8C8680' }}>
        {sorted.length} notice{sorted.length !== 1 ? 's' : ''} published
        {emergency.length > 0 && (
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(197,110,77,0.1)', color: '#C56E4D' }}>
            {emergency.length} emergency
          </span>
        )}
      </p>

      {/* Notice Cards */}
      {sorted.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl">
          <span className="text-4xl">📭</span>
          <h3 className="text-base font-bold mt-3" style={{ color: '#2D2A26' }}>No Notices Found</h3>
          <p className="text-sm mt-1" style={{ color: '#8C8680' }}>
            {search ? `No results for "${search}"` : 'There are no published notices right now.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(sorted || []).map((notice) => {
            const pConfig = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.normal
            const isExpanded = expanded === notice.id
            const isExpiring =
              notice.expiry_date &&
              new Date(notice.expiry_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

            return (
              <div
                key={notice.id}
                className="glass-card rounded-2xl overflow-hidden transition-all"
                style={{ border: `1px solid ${pConfig.border}` }}
              >
                {/* Priority accent bar */}
                <div className="h-1 w-full" style={{ background: pConfig.dot }} />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl shrink-0 mt-0.5">
                      {TYPE_ICONS[notice.type] || '📋'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: pConfig.bg, color: pConfig.text, border: `1px solid ${pConfig.border}` }}
                        >
                          {pConfig.label}
                        </span>
                        <span className="text-[10px] font-semibold capitalize" style={{ color: '#8C8680' }}>
                          {notice.type.replace('_', ' ')}
                        </span>
                        {isExpiring && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(197,110,77,0.1)', color: '#C56E4D' }}>
                            ⏳ Expiring soon
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold leading-snug" style={{ color: '#2D2A26' }}>
                        {notice.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description — collapsible */}
                  {notice.description && (
                    <div
                      className="text-sm leading-relaxed mb-3 transition-all"
                      style={{ color: '#54504B' }}
                    >
                      {isExpanded || notice.description.length < 120 ? (
                        notice.description
                      ) : (
                        <>
                          {notice.description.slice(0, 120)}…{' '}
                          <button
                            onClick={() => setExpanded(notice.id)}
                            className="font-bold underline-offset-2 hover:underline text-xs"
                            style={{ color: '#C56E4D' }}
                          >
                            Read more
                          </button>
                        </>
                      )}
                      {isExpanded && notice.description.length >= 120 && (
                        <button
                          onClick={() => setExpanded(null)}
                          className="block mt-1 font-bold underline-offset-2 hover:underline text-xs"
                          style={{ color: '#8C8680' }}
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-3 border-t"
                    style={{ borderColor: 'rgba(183,155,108,0.1)' }}
                  >
                    <div className="text-[10px]" style={{ color: '#8C8680' }}>
                      {notice.publisher?.full_name && (
                        <span className="font-semibold mr-1" style={{ color: '#54504B' }}>
                          {notice.publisher.full_name}
                        </span>
                      )}
                      {formatRelativeDate(notice.published_at)}
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: 'rgba(84,80,75,0.06)', color: '#8C8680' }}
                    >
                      {notice.audience === 'all' ? 'All Residents' : notice.audience.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
