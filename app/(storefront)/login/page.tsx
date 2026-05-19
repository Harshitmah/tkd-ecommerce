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
    <div className="mx-auto flex min-h-[90vh] max-w-lg flex-col items-center justify-center px-6 py-20 animate-in fade-in duration-1000">
      <div className="w-full bg-white border border-zinc-100 shadow-2xl rounded-[40px] p-10 md:p-16">
        <div className="flex flex-col items-center text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.6em] text-accent mb-6">Portal Authorization</span>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-black">
            Access Vault
          </h1>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-zinc-400 leading-relaxed max-w-[280px]">
            Enter your credentials to continue the Telkidukan experience.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-lg py-6"
          />
          
          <div className="space-y-4">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-lg py-6"
            />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-accent transition-colors">
                Forgot your password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100 flex items-start gap-4">
              <X className="h-5 w-5 text-red-600 shrink-0 mt-1" />
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.2em] leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="h-16 w-full rounded-2xl shadow-premium text-xs font-bold uppercase tracking-[0.3em]"
            type="submit"
            loading={loading}
          >
            Initialize Session
            <ArrowRight className="ml-4 h-5 w-5" />
          </Button>
        </form>

        <div className="mt-10 text-center">
          <Link 
            href="/register" 
            className="group flex items-center justify-center gap-3 w-full text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 hover:text-black transition-all"
          >
            <div className="h-px w-8 bg-zinc-200 transition-all group-hover:w-12 group-hover:bg-black" />
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}
