"use server"

import { createClient } from "@supabase/supabase-js"

export async function upsertUserProfile(userId: string, email: string, fullName: string, phone?: string) {
  if (!userId) {
    return { success: false, error: "User ID is required" }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in environment variables.")
    return { success: false, error: "Internal Server Error: Missing credentials" }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email: email,
      full_name: fullName,
      phone: phone || null,
      role: "customer"
    }, { onConflict: "id" })

  if (error) {
    console.error("Error in upsertUserProfile server action:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
