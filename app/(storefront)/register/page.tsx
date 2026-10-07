"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { X, Mail, Lock, User, ArrowRight, Globe, ShieldCheck, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await signUp(email, password, fullName, phone)
      if (error) throw error
      alert("Registration successful! Please check your email for verification.")
      router.push("/login")
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
            Create Account
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Sign up for a new account.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            placeholder="e.g. +91 99999 99999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

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
            Sign Up
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link 
            href="/login" 
            className="text-sm font-semibold text-zinc-500 hover:text-black transition-all"
          >
            Already have an account? <span className="text-black">Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
