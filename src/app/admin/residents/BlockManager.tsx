'use client'

import { useState, useTransition } from 'react'
import { createBlock, deleteBlock } from '@/features/society/actions'
import { AlertBanner } from '@/components/ui/PageUI'
import type { Block } from '@/types/database'

interface BlockWithCount extends Block { house_count: number }
interface Props { blocks: BlockWithCount[] }

export default function BlockManager({ blocks }: Props) {
  const [isPending, startTransition] = useTransition()
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setAlert(null)
    startTransition(async () => {
      const result = await createBlock({ name: name.trim() })
      if (result.success) {
        setAlert({ type: 'success', message: `Block "${name.toUpperCase()}" created.` })
        setShowForm(false)
        setName('')
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  function handleDelete(block: BlockWithCount) {
    if (!confirm(`Delete "${block.name}" block? This cannot be undone.`)) return
    setAlert(null)
    startTransition(async () => {
      const result = await deleteBlock(block.id)
      if (result.success) {
        setAlert({ type: 'success', message: `Block "${block.name}" deleted.` })
      } else {
        setAlert({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="form-section-title mb-0 pb-0 border-none">Block Management</p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-semibold transition-colors"
          style={{ color: '#C56E4D' }}
        >
          {showForm ? 'Cancel' : '+ Add Block'}
        </button>
      </div>

      {alert && <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />}

      {showForm && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-3">
          <input
            className="input text-sm flex-1 uppercase placeholder:normal-case"
            placeholder="e.g. A, B, C or Wing1"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            maxLength={10}
            required
          />
          <button type="submit" disabled={isPending} className="btn btn-primary text-sm px-4 shrink-0">
            {isPending ? '...' : 'Add'}
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg group"
            style={{ background: 'rgba(183,155,108,0.06)', border: '1px solid rgba(183,155,108,0.12)' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#2D2A26' }}>{block.name}</span>
            <span className="text-xs" style={{ color: '#8C8680' }}>{block.house_count} houses</span>
            {block.house_count === 0 && (
              <button
                type="button"
                onClick={() => handleDelete(block)}
                disabled={isPending}
                className="transition-colors ml-1 text-xs opacity-0 group-hover:opacity-100"
                style={{ color: '#C56E4D' }}
                title="Delete empty block"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {blocks.length === 0 && (
          <p className="text-xs" style={{ color: '#8C8680' }}>No blocks yet — add one above.</p>
        )}
      </div>
    </div>
  )
}
