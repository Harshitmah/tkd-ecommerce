"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get("error")
  const { signIn, user, signOut } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [toast, setToast] = React.useState<{ message: string; type: "success" | "error" } | null>(null)

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
  }

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  React.useEffect(() => {
    if (urlError === "unauthorized") {
      setError("Unauthorized access: Your account does not have administrator privileges.")
      showToast("Access Denied: You do not have administrator privileges.", "error")
      setLoading(false)
      // Automatically sign out to clear the unauthorized customer session and break the redirect loop
      signOut()
    } else if (urlError === "timeout") {
      setError("Your session has expired due to 10 minutes of inactivity. Please log in again.")
      showToast("Session Expired: Please log in again.", "error")
      setLoading(false)
      signOut()
    }
  }, [urlError, signOut])

  React.useEffect(() => {
    if (user && !urlError) {
      router.push("/admin")
    }
  }, [user, router, urlError])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) throw signInError
      
      showToast("Success! Authenticating admin console...", "success")
      
      // Delay redirection slightly so the user experiences the beautiful success toast
      setTimeout(() => {
        router.push("/admin")
        router.refresh()
      }, 1200)
    } catch (err: any) {
      const errMsg = err.message || "Invalid credentials"
      setError(errMsg)
      showToast(errMsg, "error")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md relative animate-in fade-in duration-700">
      <div className="text-center mb-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-black border border-black mb-6 shadow-xl shadow-black/10">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-black mb-2 font-serif">Telkidukan <span className="text-zinc-600">Admin</span></h1>
        <p className="text-zinc-500 font-medium">Secure access to management console</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6 bg-white p-10 rounded-[40px] border border-gray-200/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
        <Input
          label="Admin Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="text-black placeholder:text-zinc-300 focus:border-black"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="text-black placeholder:text-zinc-300 focus:border-black"
        />

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center leading-normal">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full h-14 rounded-2xl bg-black text-white hover:bg-zinc-900 transition-all shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)]"
          loading={loading}
        >
          Authenticate
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </form>

      <p className="mt-8 text-center text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold">
        Authorized Personnel Only
      </p>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`fixed bottom-8 right-8 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md max-w-sm ${
              toast.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
                : "bg-red-50/95 border-red-200 text-red-900"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <div className="flex-1 text-xs font-bold uppercase tracking-wider leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-zinc-400 hover:text-black transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-200/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-black/5 rounded-full blur-[120px]" />
      </div>
      <React.Suspense fallback={
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-black/10 border-t-black rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading Console...</p>
        </div>
      }>
        <LoginContent />
      </React.Suspense>
    </div>
  )
}
