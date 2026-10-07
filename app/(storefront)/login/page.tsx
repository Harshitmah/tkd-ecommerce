"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { X, Mail, Lock, User, ArrowRight, Globe, ShieldCheck, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      router.push("/account")
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 py-12 animate-in fade-in duration-500">
      <div className="w-full bg-white border border-zinc-100 shadow-sm rounded-3xl p-8 md:p-10">
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-black">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Sign in to your account to continue.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <div className="space-y-2">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs font-semibold text-zinc-400 hover:text-black transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3">
              <X className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-red-600 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="h-14 w-full rounded-2xl text-sm font-bold tracking-wide"
            type="submit"
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link 
            href="/register" 
            className="text-sm font-semibold text-zinc-500 hover:text-black transition-all"
          >
            Don't have an account? <span className="text-black">Sign Up</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
