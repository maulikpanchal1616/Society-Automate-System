'use client'

import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Info, X } from 'lucide-react'

type Toast = {
  id: string
  message: string
  type?: 'success' | 'info'
}

type ToastStore = {
  toasts: Toast[]
  addToast: (message: string, type?: 'success' | 'info') => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 5000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}))

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] max-w-sm ${
              toast.type === 'success' 
                ? 'bg-[#F5F1EB]/95 border-[rgba(122,139,116,0.3)]' 
                : 'bg-[#F5F1EB]/95 border-[rgba(197,110,77,0.3)]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#7A8B74] shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-[#C56E4D] shrink-0 mt-0.5" />
            )}
            
            <p className="flex-1 text-sm font-medium text-[#2D2A26]">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-[#8C8680] hover:text-[#2D2A26] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
