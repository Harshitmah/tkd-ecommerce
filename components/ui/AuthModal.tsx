"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Lock, User, ArrowRight, Globe, ShieldCheck, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = React.useState<"signin" | "signup">("signin")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [fullName, setFullName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { error } = await signUp(email, password, fullName, phone)
        if (error) throw error
      }
      onClose()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white shadow-2xl rounded-[40px] p-10 md:p-16 z-10 overflow-y-auto max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-black hover:bg-zinc-200 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.6em] text-accent mb-6">Portal Access</span>
              <h2 className="font-serif text-4xl font-bold tracking-tight text-black">
                {mode === "signin" ? "Welcome Back" : "Create Profile"}
              </h2>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-zinc-400 leading-relaxed max-w-[280px]">
                {mode === "signin" 
                  ? "Authenticate your session to continue." 
                  : "Create a new account."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-8"
                  >
                    <div>
                      <Input
                        label="Full Name"
                        placeholder="e.g. John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        variant="pill"
                      />
                    </div>
                    <div>
                      <Input
                        label="Phone Number"
                        placeholder="e.g. +91 99999 99999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        variant="pill"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
 
              <Input
                label="Email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                variant="pill"
              />
              
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                variant="pill"
              />

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 p-6 rounded-2xl border-2 border-red-100 flex items-start gap-4"
                >
                   <X className="h-5 w-5 text-red-600 shrink-0 mt-1" />
                   <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.2em] leading-relaxed">
                    Authentication Failed: {error}
                   </p>
                </motion.div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="h-16 w-full rounded-2xl shadow-premium text-xs font-bold uppercase tracking-[0.3em]"
                type="submit"
                loading={loading}
              >
                {mode === "signin" ? "Login" : "Sign Up"}
                <ArrowRight className="ml-4 h-5 w-5" />
              </Button>
            </form>

            <div className="mt-10 text-center">
              <button
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="group flex items-center justify-center gap-3 w-full text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 hover:text-black transition-all"
              >
                <div className="h-px w-8 bg-zinc-200 transition-all group-hover:w-12 group-hover:bg-black" />
                {mode === "signin" 
                  ? "Sign Up" 
                  : "Login"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
