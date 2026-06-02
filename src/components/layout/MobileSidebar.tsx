'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SignOutButton from './SignOutButton'

export default function MobileSidebar({ 
  children, 
  userInitials, 
  userName, 
  userRole 
}: { 
  children: React.ReactNode
  userInitials: string
  userName: string
  userRole: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 -ml-1.5 text-[#54504B] hover:text-[#2D2A26] rounded-md hover:bg-black/5 transition-colors"
      >
        <Menu size={22} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#2D2A26]/40 backdrop-blur-sm z-[100] lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 glass-panel border-r z-[101] lg:hidden flex flex-col shadow-2xl"
              style={{ borderColor: 'rgba(183,155,108,0.15)', background: '#F5F1EB' }}
            >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
            </div>
            <span className="text-sm font-bold" style={{ color: '#2D2A26' }}>Shyamved</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-[#8C8680] hover:text-[#2D2A26] rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* User footer in mobile menu */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(183,155,108,0.12)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white gradient-brand shadow-sm">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#2D2A26' }}>{userName}</p>
              <p className="text-xs capitalize" style={{ color: '#8C8680' }}>{userRole}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
