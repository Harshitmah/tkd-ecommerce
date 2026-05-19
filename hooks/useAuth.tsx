"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { type User, type Session } from "@supabase/supabase-js"
import { upsertUserProfile } from "@/app/actions/profiles"

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let active = true

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn("Auth session retrieval error:", error.message)
          if (error.message?.includes("Refresh Token Not Found") || error.message?.includes("invalid_grant")) {
            await supabase.auth.signOut()
            if (active) {
              setSession(null)
              setUser(null)
            }
            return
          }
        }
        if (active) {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error("Failed to check auth session:", err)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) {
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      if (!error && data) {
        setProfile(data)
      }
    }

    fetchProfile()
  }, [user, supabase])

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    })
    
    if (!res.error && res.data.user) {
      // Create profile entry using the server action to bypass client RLS rules
      const upsertRes = await upsertUserProfile(res.data.user.id, email, fullName, phone)
      if (!upsertRes.success) {
        console.error("Failed to create profile during signup:", upsertRes.error)
      }
    }
    
    return res
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}


export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
