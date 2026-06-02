'use client'

// =============================================================================
// LOGIN PAGE — Premium 3D Split-Screen Design
// =============================================================================

import { useState, useTransition } from 'react'
import { signInWithEmail } from '@/features/auth/actions'
import { motion, AnimatePresence, Variants } from 'framer-motion'

const formVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
      type: 'spring',
      stiffness: 200,
      damping: 20
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

const glassVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.4,
      duration: 1.2,
      ease: "easeOut",
      staggerChildren: 0.15,
      delayChildren: 0.6
    }
  }
}

const glassItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
}

function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleEmailSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await signInWithEmail(formData)
      if (!result.success) setError(result.error)
    })
  }

  return (
    <motion.div 
      variants={formVariants}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      <div className="mb-10 flex flex-col items-center text-center">
        <motion.div 
          variants={itemVariants}
          className="w-28 h-28 mb-4 mx-auto bg-[#FFF5E1] rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-white/20 overflow-hidden"
        >
          <img 
            src="/logo.png?v=5" 
            alt="Shyamved Residency Logo" 
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-md" style={{ color: '#E6D5B8' }}>
          Welcome Back
        </motion.h1>
        <motion.p variants={itemVariants} className="text-sm font-semibold drop-shadow" style={{ color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          Sign in to the Shyamved Residency portal
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="mb-6 px-4 py-3 rounded-xl text-sm overflow-hidden bg-red-500/20 backdrop-blur-md text-red-100 border border-red-500/40 shadow-lg font-medium" 
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form action={handleEmailSubmit} className="space-y-6">
        <motion.div variants={itemVariants} className="group">
          <label htmlFor="email" className="block text-xs font-extrabold text-[#B79B6C] uppercase tracking-widest mb-2 drop-shadow-sm group-hover:text-[#E6D5B8] transition-colors">Email Address</label>
          <motion.div 
            className="relative rounded-xl transition-all duration-300 bg-black/20 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/5 focus-within:-translate-y-1 focus-within:border-white/40 focus-within:bg-white/10 shadow-sm !outline-none !ring-0"
          >
            <input
              id="email" name="email" type="email" required
              autoComplete="email" placeholder="you@example.com"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-4 py-4 rounded-xl !border-none !outline-none !ring-0 focus:!ring-0 focus:!outline-none bg-transparent text-sm text-[#FFFFFF] font-medium placeholder-[#EFEBE4]/50 transition-colors"
              style={{ outline: 'none', boxShadow: 'none', transition: 'background-color 5000s ease-in-out 0s', WebkitTextFillColor: '#FFFFFF' }}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="group">
          <label htmlFor="password" className="block text-xs font-extrabold text-[#B79B6C] uppercase tracking-widest mb-2 drop-shadow-sm group-hover:text-[#E6D5B8] transition-colors">Password</label>
          <motion.div 
            className="relative rounded-xl transition-all duration-300 bg-black/20 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/5 focus-within:-translate-y-1 focus-within:border-white/40 focus-within:bg-white/10 shadow-sm !outline-none !ring-0"
          >
            <input
              id="password" name="password" type={showPassword ? "text" : "password"} required
              autoComplete="current-password" placeholder="••••••••"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-4 py-4 rounded-xl !border-none !outline-none !ring-0 focus:!ring-0 focus:!outline-none bg-transparent text-sm text-[#FFFFFF] font-medium placeholder-[#EFEBE4]/50 transition-colors pr-12"
              style={{ outline: 'none', boxShadow: 'none', transition: 'background-color 5000s ease-in-out 0s', WebkitTextFillColor: '#FFFFFF' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#EFEBE4]/50 hover:text-[#E6D5B8] transition-colors hover:scale-110 active:scale-95"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </motion.div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="pt-4">
          <motion.button 
            type="submit" 
            disabled={isPending} 
            whileHover={{ scale: isPending ? 1 : 1.02, y: -2 }}
            whileTap={{ scale: isPending ? 1 : 0.98 }}
            className="relative w-full overflow-hidden rounded-xl text-white font-bold tracking-wide text-sm py-4 shadow-[0_8px_20px_rgba(197,110,77,0.3)] disabled:opacity-70 group border border-white/10"
            style={{ background: 'linear-gradient(135deg, rgba(197,110,77,0.9), rgba(158,88,62,0.9))' }}
          >
            {/* Animated hover glow inside button */}
            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isPending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...</>
              ) : 'Access Portal'}
            </span>
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-black p-4 sm:p-8 lg:p-24 fixed inset-0">
      
      {/* FULL PAGE BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/login-bg.png" 
          alt="Shyamved Residency 3D Render" 
          className="w-full h-full object-cover object-center opacity-85"
        />
      </div>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 z-0 bg-black/10" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      
      {/* Animated Orbs for Depth */}
      <motion.div 
        animate={{ y: [0, -50, 0], x: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#C56E4D]/20 blur-[120px] rounded-full mix-blend-screen z-0 pointer-events-none"
      />
      
      {/* FLOATING TEXT REMOVED PER USER REQUEST */}

      {/* RIGHT COMPARTMENT - Glassmorphism Login Form */}
      <div className="relative z-20 w-full max-w-[460px] flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 30, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, y: 0, backdropFilter: "blur(6px)" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full p-8 sm:p-10 rounded-[2.5rem] bg-black/20 backdrop-blur-sm border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group"
        >
          {/* Subtle interior glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <LoginForm />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-white/40 font-medium tracking-wide">
            © {new Date().getFullYear()} Shyamved Residency. All rights reserved.
          </p>
        </motion.div>
      </div>

    </div>
  )
}
