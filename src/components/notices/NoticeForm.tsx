'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createNotice, updateNotice } from '@/features/notices/actions'

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["general", "maintenance", "payment_reminder", "emergency", "meeting", "festival"]),
  priority: z.enum(["normal", "important", "emergency"]),
  status: z.enum(["draft", "published", "archived"]),
  audience: z.enum(["all", "block_specific", "admin_only"]),
  expiry_date: z.string().optional()
})

type FormData = z.infer<typeof schema>

export default function NoticeForm({ 
  initialData, 
  onSuccess, 
  onCancel 
}: { 
  initialData?: any, 
  onSuccess: () => void,
  onCancel: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description || '',
      type: initialData.type,
      priority: initialData.priority,
      status: initialData.status,
      audience: initialData.audience,
      expiry_date: initialData.expiry_date ? new Date(initialData.expiry_date).toISOString().split('T')[0] : ''
    } : {
      type: 'general',
      priority: 'normal',
      status: 'draft',
      audience: 'all'
    }
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        expiry_date: data.expiry_date ? new Date(data.expiry_date).toISOString() : null
      }
      
      const res = initialData 
        ? await updateNotice(initialData.id, payload)
        : await createNotice(payload)
        
      if (res.error) throw new Error(res.error)
      onSuccess()
    } catch (err) {
      console.error(err)
      alert("Failed to save notice")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ color: '#2D2A26' }}>Title</label>
        <input 
          {...register('title')} 
          className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none" 
          style={{ borderColor: 'rgba(183,155,108,0.3)', backgroundColor: '#F5F1EB' }}
          placeholder="e.g. Lift Maintenance Schedule"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ color: '#2D2A26' }}>Description</label>
        <textarea 
          {...register('description')} 
          rows={4}
          className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none" 
          style={{ borderColor: 'rgba(183,155,108,0.3)', backgroundColor: '#F5F1EB' }}
          placeholder="Notice details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: '#2D2A26' }}>Type</label>
          <select 
            {...register('type')} 
            className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none" 
            style={{ borderColor: 'rgba(183,155,108,0.3)', backgroundColor: '#F5F1EB' }}
          >
            <option value="general">General</option>
            <option value="maintenance">Maintenance</option>
            <option value="payment_reminder">Payment Reminder</option>
            <option value="emergency">Emergency</option>
            <option value="meeting">Meeting</option>
            <option value="festival">Festival</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: '#2D2A26' }}>Priority</label>
          <select 
            {...register('priority')} 
            className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none" 
            style={{ borderColor: 'rgba(183,155,108,0.3)', backgroundColor: '#F5F1EB' }}
          >
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: '#2D2A26' }}>Audience</label>
          <select 
            {...register('audience')} 
            className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none" 
            style={{ borderColor: 'rgba(183,155,108,0.3)', backgroundColor: '#F5F1EB' }}
          >
            <option value="all">All Residents</option>
            <option value="admin_only">Admins Only</option>
            <option value="block_specific">Block Specific</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: '#2D2A26' }}>Expiry Date (Optional)</label>
          <input 
            type="date"
            {...register('expiry_date')} 
            className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none" 
            style={{ borderColor: 'rgba(183,155,108,0.3)', backgroundColor: '#F5F1EB' }}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ color: '#2D2A26' }}>Status</label>
        <select 
          {...register('status')} 
          className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none" 
          style={{ borderColor: 'rgba(183,155,108,0.3)', backgroundColor: '#F5F1EB' }}
        >
          <option value="draft">Save as Draft</option>
          <option value="published">Publish Immediately</option>
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'rgba(183,155,108,0.2)' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          style={{ color: '#54504B', backgroundColor: 'rgba(183,155,108,0.1)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg font-semibold text-sm text-white transition-opacity disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #C56E4D, #B55F3E)' }}
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Notice' : 'Create Notice')}
        </button>
      </div>
    </form>
  )
}
