"use server"

import { createClient } from "@supabase/supabase-js"

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials in environment variables.")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function recordVisit(sessionId: string) {
  if (!sessionId) return { success: false, error: "Session ID is required" }
  
  try {
    const supabase = getSupabase()
    const email = `visit-${sessionId}@visit.local`
    
    // Use upsert to handle duplicate session triggers gracefully without throwing errors
    const { error } = await supabase
      .from("subscribers")
      .upsert({ email }, { onConflict: "email" })
      
    if (error) {
      console.error("Error recording visit:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    console.error("Exception in recordVisit server action:", err)
    return { success: false, error: err.message }
  }
}

export async function getVisitStats() {
  try {
    const supabase = getSupabase()
    
    const now = new Date()
    
    // start dates in ISO strings
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    
    // start of week (Monday)
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff).toISOString()
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString()

    // 1. Total visits
    const { count: total, error: totalErr } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .like("email", "visit-%@visit.local")

    // 2. Today
    const { count: today, error: todayErr } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .like("email", "visit-%@visit.local")
      .gte("created_at", startOfToday)

    // 3. This Week
    const { count: thisWeek, error: weekErr } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .like("email", "visit-%@visit.local")
      .gte("created_at", startOfWeek)

    // 4. This Month
    const { count: thisMonth, error: monthErr } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .like("email", "visit-%@visit.local")
      .gte("created_at", startOfMonth)

    // 5. This Year
    const { count: thisYear, error: yearErr } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .like("email", "visit-%@visit.local")
      .gte("created_at", startOfYear)

    if (totalErr || todayErr || weekErr || monthErr || yearErr) {
      console.error("Error fetching stats:", { totalErr, todayErr, weekErr, monthErr, yearErr })
    }

    return {
      total: total || 0,
      today: today || 0,
      thisWeek: thisWeek || 0,
      thisMonth: thisMonth || 0,
      thisYear: thisYear || 0
    }
  } catch (err: any) {
    console.error("Exception in getVisitStats server action:", err)
    return {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      thisYear: 0,
      error: err.message
    }
  }
}

export async function resetVisits() {
  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from("subscribers")
      .delete()
      .like("email", "visit-%@visit.local")

    if (error) {
      console.error("Error resetting visits:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    console.error("Exception in resetVisits server action:", err)
    return { success: false, error: err.message }
  }
}
