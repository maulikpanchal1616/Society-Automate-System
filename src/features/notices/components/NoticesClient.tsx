'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NoticeForm from '@/components/notices/NoticeForm'
import { archiveNotice, deleteNotice, updateNotice } from '@/features/notices/actions'
import { Plus, Archive, Edit2, CheckCircle2, XCircle } from 'lucide-react'
import { useRealtimeSubscription } from '@/lib/supabase/hooks/useRealtimeSubscription'
import { useToastStore } from '@/components/ui/Toast'

export default function NoticesClient({ initialNotices, isAdmin, currentUserId }: { initialNotices: any[], isAdmin: boolean, currentUserId: string }) {
  const router = useRouter()
  const { addToast } = useToastStore()
  const [notices, setNotices] = useState(initialNotices)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'published' | 'draft' | 'archived'>('published')

  const { payload } = useRealtimeSubscription({
    table: 'notices',
    event: '*'
  })

  useEffect(() => {
    // If there's an external update, refresh the page data
    // Local optimistic updates are handled in handlePublish/Archive
    if (payload && payload.new && payload.new.published_by !== currentUserId) {
      if (payload.eventType === 'INSERT') {
        addToast(`New Notice: ${payload.new.title}`, 'info')
      }
      router.refresh()
    }
  }, [payload, router, currentUserId, addToast])

  useEffect(() => {
    // Sync initialNotices when router.refresh() provides new data
    setNotices(initialNotices)
  }, [initialNotices])

  const handleEdit = (notice: any) => {
    setEditingNotice(notice)
    setIsFormOpen(true)
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this notice?')) return
    const res = await archiveNotice(id)
    if (res.data) {
      setNotices(notices.map(n => n.id === id ? { ...n, status: 'archived' } : n))
    }
  }

  const handlePublish = async (id: string) => {
    const res = await updateNotice(id, { status: 'published' })
    if (res.data) {
      setNotices(notices.map(n => n.id === id ? { ...n, status: 'published' } : n))
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-50 text-red-600 border-red-200'
      case 'important': return 'bg-orange-50 text-orange-600 border-orange-200'
      default: return 'bg-blue-50 text-blue-600 border-blue-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'text-orange-600'
      case 'emergency': return 'text-red-600'
      case 'meeting': return 'text-purple-600'
      case 'festival': return 'text-green-600'
      case 'payment_reminder': return 'text-blue-600'
      default: return 'text-slate-600'
    }
  }

  const filteredNotices = notices.filter(n => n.status === activeTab)

  return (
    <div className="space-y-6">
      {!isFormOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
          <div className="flex overflow-x-auto hide-scrollbar w-full sm:w-auto">
            {(['published', 'draft', 'archived'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === tab 
                    ? 'border-[#C56E4D] text-[#C56E4D]' 
                    : 'border-transparent text-[#8C8680] hover:text-[#54504B]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({notices.filter(n => n.status === tab).length})
              </button>
            ))}
          </div>
          <div className="hidden sm:block flex-1" />
          <button
            onClick={() => { setEditingNotice(null); setIsFormOpen(true) }}
            className="flex items-center justify-center gap-2 px-4 py-2 mb-2 w-full sm:w-auto rounded-lg text-white font-semibold text-sm transition-opacity"
            style={{ background: 'linear-gradient(135deg, #C56E4D, #B55F3E)' }}
          >
            <Plus size={16} /> Create Notice
          </button>
        </div>
      )}

      {isFormOpen ? (
        <div className="glass-panel rounded-2xl p-6 border" style={{ borderColor: 'rgba(183,155,108,0.15)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2D2A26' }}>
            {editingNotice ? 'Edit Notice' : 'New Notice'}
          </h2>
          <NoticeForm 
            initialData={editingNotice}
            onSuccess={() => {
              setIsFormOpen(false)
              window.location.reload() // Reload to get fresh data
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotices.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <p className="text-[#8C8680]">No {activeTab} notices found.</p>
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const canEdit = isAdmin || notice.published_by === currentUserId

              return (
                <div key={notice.id} className="glass-panel rounded-xl p-5 border flex flex-col" style={{ borderColor: 'rgba(183,155,108,0.15)' }}>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(notice.priority)}`}>
                      {notice.priority}
                    </span>
                    <span className="text-[10px] font-semibold text-[#8C8680] bg-white/50 px-2 py-0.5 rounded-full">
                      {notice.audience === 'all' ? 'All Residents' : notice.audience.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-1 leading-tight" style={{ color: '#2D2A26' }}>{notice.title}</h3>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${getTypeColor(notice.type)}`}>
                    {notice.type.replace('_', ' ')}
                  </p>
                  
                  <p className="text-sm text-[#54504B] mb-4 line-clamp-3 flex-1">
                    {notice.description || 'No description provided.'}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(183,155,108,0.1)' }}>
                    <div className="text-[10px] text-[#8C8680]">
                      {notice.published_at ? `Published: ${new Date(notice.published_at).toLocaleDateString('en-IN')}` : 'Draft'}
                      {notice.publisher && ` • By ${notice.publisher.full_name}`}
                    </div>
                    
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        {notice.status === 'draft' && (
                          <button onClick={() => handlePublish(notice.id)} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors" title="Publish">
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button onClick={() => handleEdit(notice)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        {notice.status !== 'archived' && (
                          <button onClick={() => handleArchive(notice.id)} className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors" title="Archive">
                            <Archive size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
