'use client'

// =============================================================================
// LOGIN PAGE — Premium 3D Split-Screen Design
// =============================================================================

import { useState, useTransition } from 'react'
import { signInWithEmail } from '@/features/auth/actions'
import { motion, AnimatePresence } from 'framer-motion'

const formVariants = {
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

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
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
      className="w-full max-w-md"
    >
      <div className="mb-10 flex flex-col items-start">
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          className="w-16 h-16 rounded-2xl bg-white shadow-lg border border-[#E6E1D8] flex items-center justify-center p-2.5 mb-6"
        >
          <img src="/logo.png?v=5" alt="Icon" className="w-full h-full object-contain" />
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-3xl font-bold tracking-tight mb-2 text-[#2D2A26]">
          Welcome Back
        </motion.h1>
        <motion.p variants={itemVariants} className="text-sm font-medium text-[#8C8680]">
          Sign in to the Shyamved Residency portal
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="mb-6 px-4 py-3 rounded-xl text-sm overflow-hidden bg-red-50 text-red-600 border border-red-100 shadow-sm" 
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form action={handleEmailSubmit} className="space-y-5">
        <motion.div variants={itemVariants}>
          <label htmlFor="email" className="block text-xs font-bold text-[#54504B] uppercase tracking-wider mb-2">Email Address</label>
          <motion.div 
            animate={{ 
              boxShadow: focusedField === 'email' ? '0 0 0 2px rgba(197,110,77,0.3)' : '0 1px 2px 0 rgba(0,0,0,0.05)' 
            }}
            className="relative rounded-xl transition-shadow duration-300 bg-white"
          >
            <input
              id="email" name="email" type="email" required
              autoComplete="email" placeholder="you@example.com"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-4 py-3.5 rounded-xl border border-[#E6E1D8] focus:border-[#C56E4D] bg-transparent text-sm outline-none transition-colors"
              style={{ color: '#2D2A26' }}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="password" className="block text-xs font-bold text-[#54504B] uppercase tracking-wider mb-2">Password</label>
          <motion.div 
            animate={{ 
              boxShadow: focusedField === 'password' ? '0 0 0 2px rgba(197,110,77,0.3)' : '0 1px 2px 0 rgba(0,0,0,0.05)' 
            }}
            className="relative rounded-xl transition-shadow duration-300 bg-white"
          >
            <input
              id="password" name="password" type={showPassword ? "text" : "password"} required
              autoComplete="current-password" placeholder="••••••••"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-4 py-3.5 rounded-xl border border-[#E6E1D8] focus:border-[#C56E4D] bg-transparent text-sm outline-none transition-colors pr-12"
              style={{ color: '#2D2A26' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C8680] hover:text-[#C56E4D] transition-colors"
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
            className="relative w-full overflow-hidden rounded-xl text-white font-bold tracking-wide text-sm py-4 shadow-lg disabled:opacity-70 group"
            style={{ background: 'linear-gradient(135deg, #C56E4D, #9E583E)' }}
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
    <div className="flex min-h-dvh bg-[#F5F1EB] overflow-hidden">
      
      {/* LEFT COMPARTMENT - 3D Visual Showcase */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-black">
        <motion.div 
          animate={{ scale: [1, 1.08, 1] }} 
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          {/* This uses the generated 3D aesthetic image */}
          <img 
            src="/login-bg.png" 
            alt="Shyamved Residency 3D Render" 
            className="w-full h-full object-cover object-center opacity-90"
          />
        </motion.div>

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Animated Orbs for Depth */}
        <motion.div 
          animate={{ y: [0, -50, 0], x: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#C56E4D]/20 blur-[100px] rounded-full mix-blend-screen"
        />
        
        {/* Floating Text Element */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-16 left-16 max-w-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-0.5 w-10 bg-[#C56E4D]" />
            <p className="text-white/80 text-sm font-bold tracking-widest uppercase">Premium Living</p>
          </div>
          <h2 className="text-4xl font-light text-white leading-tight mb-4">
            Experience the pinnacle of <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Modern Management.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Welcome to the Shyamved Residency digital twin. Control, monitor, and optimize your society operations from a single unified ecosystem.
          </p>
        </motion.div>
      </div>

      {/* RIGHT COMPARTMENT - Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-24 relative z-10 bg-[#F5F1EB] shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
        
        {/* Mobile Background Fallback (Only visible on mobile) */}
        <div className="absolute inset-0 lg:hidden overflow-hidden z-[-1]">
          <img src="/login-bg.png" alt="Background" className="w-full h-full object-cover opacity-[0.08]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5F1EB]/80 to-[#F5F1EB]" />
        </div>

        <LoginForm />

        <div className="absolute bottom-8 left-0 right-0 flex justify-center lg:justify-start lg:pl-24">
          <p className="text-xs text-[#8C8680] font-medium tracking-wide">
            © {new Date().getFullYear()} Shyamved Residency. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  )
}
