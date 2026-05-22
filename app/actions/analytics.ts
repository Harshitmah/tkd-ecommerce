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

// Helper to retrieve the current historical deleted visits offset
async function getDeletedOffset(supabase: any): Promise<number> {
  try {
    const { data } = await supabase
      .from("subscribers")
      .select("email")
      .like("email", "visit-offset-total-deleted-%@visit.local")

    if (data && data.length > 0) {
      const match = data[0].email.match(/visit-offset-total-deleted-(\d+)@visit.local/)
      if (match) return parseInt(match[1])
    }
  } catch (e) {
    console.error("Error reading deleted offset:", e)
  }
  return 0
}

// Helper to update/increment the historical deleted visits offset
async function updateDeletedOffset(supabase: any, additionalOffset: number) {
  if (additionalOffset === 0) return
  
  const current = await getDeletedOffset(supabase)
  const next = current + additionalOffset

  // 1. Delete old offset rows
  await supabase
    .from("subscribers")
    .delete()
    .like("email", "visit-offset-total-deleted-%@visit.local")

  // 2. Insert new offset row
  const email = `visit-offset-total-deleted-${next}@visit.local`
  await supabase
    .from("subscribers")
    .insert({ email })
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

    // 1. Get current deleted historical visits offset
    const deletedOffset = await getDeletedOffset(supabase)

    // 2. Total visits (normal ones, excluding offset markers)
    const { count: totalNormal, error: totalErr } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .like("email", "visit-%@visit.local")
      .not("email", "like", "visit-offset-%")

    // 3. Today (excluding offset markers)
    const { count: today, error: todayErr } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .like("email", "visit-%@visit.local")
      .not("email", "like", "visit-offset-%")
      .gte("created_at", startOfToday)

    // 4. This Week (excluding offset markers)
    const { count: thisWeek, error: weekErr } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .like("email", "visit-%@visit.local")
      .not("email", "like", "visit-offset-%")
      .gte("created_at", startOfWeek)

    // 5. This Month (excluding offset markers)
    const { count: thisMonth, error: monthErr } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .like("email", "visit-%@visit.local")
      .not("email", "like", "visit-offset-%")
      .gte("created_at", startOfMonth)

    // 6. This Year (excluding offset markers)
    const { count: thisYear, error: yearErr } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .like("email", "visit-%@visit.local")
      .not("email", "like", "visit-offset-%")
      .gte("created_at", startOfYear)

    if (totalErr || todayErr || weekErr || monthErr || yearErr) {
      console.error("Error fetching stats:", { totalErr, todayErr, weekErr, monthErr, yearErr })
    }

    return {
      total: (totalNormal || 0) + deletedOffset,
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
    
    // Deletes both normal visits and any offset marker entries
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

// Deletes 1 visit record belonging to a specific period, and increments the total offset
export async function decreaseVisitCount(period: "today" | "week" | "month" | "year") {
  try {
    const supabase = getSupabase()
    const now = new Date()
    
    let gteDateStr = ""
    if (period === "today") {
      gteDateStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    } else if (period === "week") {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      gteDateStr = new Date(now.getFullYear(), now.getMonth(), diff).toISOString()
    } else if (period === "month") {
      gteDateStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (period === "year") {
      gteDateStr = new Date(now.getFullYear(), 0, 1).toISOString()
    }

    // Find one normal visit record created in this period
    const { data: records, error: fetchErr } = await supabase
      .from("subscribers")
      .select("id, email")
      .like("email", "visit-%@visit.local")
      .not("email", "like", "visit-offset-%")
      .gte("created_at", gteDateStr)
      .order("created_at", { ascending: false })
      .limit(1)

    if (fetchErr) throw fetchErr
    if (!records || records.length === 0) {
      return { success: false, error: `No visits logged for ${period} to decrease.` }
    }

    const recordToDelete = records[0]
    
    // Delete this record
    const { error: deleteErr } = await supabase
      .from("subscribers")
      .delete()
      .eq("id", recordToDelete.id)

    if (deleteErr) throw deleteErr

    // Increment deleted visits offset by 1 so Total count is preserved
    await updateDeletedOffset(supabase, 1)

    return { success: true }
  } catch (err: any) {
    console.error(`Error decreasing ${period} visit count:`, err)
    return { success: false, error: err.message }
  }
}

// Deletes all visit records belonging to a specific period, and adds that count to the total offset
export async function resetVisitCountForPeriod(period: "today" | "week" | "month" | "year") {
  try {
    const supabase = getSupabase()
    const now = new Date()
    
    let gteDateStr = ""
    if (period === "today") {
      gteDateStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    } else if (period === "week") {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      gteDateStr = new Date(now.getFullYear(), now.getMonth(), diff).toISOString()
    } else if (period === "month") {
      gteDateStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (period === "year") {
      gteDateStr = new Date(now.getFullYear(), 0, 1).toISOString()
    }

    // Get all normal records in this period to delete
    const { data: records, error: fetchErr } = await supabase
      .from("subscribers")
      .select("id")
      .like("email", "visit-%@visit.local")
      .not("email", "like", "visit-offset-%")
      .gte("created_at", gteDateStr)

    if (fetchErr) throw fetchErr
    if (!records || records.length === 0) {
      return { success: true, message: "Already 0 visits for this period." }
    }

    const idsToDelete = records.map((r: any) => r.id)

    // Delete them
    const { error: deleteErr } = await supabase
      .from("subscribers")
      .delete()
      .in("id", idsToDelete)

    if (deleteErr) throw deleteErr

    // Increment offset by the number of deleted records
    await updateDeletedOffset(supabase, idsToDelete.length)

    return { success: true }
  } catch (err: any) {
    console.error(`Error resetting ${period} visit count:`, err)
    return { success: false, error: err.message }
  }
}
