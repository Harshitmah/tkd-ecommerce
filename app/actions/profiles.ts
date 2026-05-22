"use server"

import { createClient } from "@supabase/supabase-js"

import { triggerWorkflowEvent } from "./workflows"

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

  // Check if profile already exists to preserve role/email and detect new signup
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .single()

  const payload: any = {
    id: userId,
    full_name: fullName,
    phone: phone || null,
  }

  if (!existing) {
    // Only set email and role on creation
    payload.email = email;
    payload.role = "customer";
  } else {
    // Preserve existing email and role during an update to avoid unique constraint errors
    // and prevent downgrading admins to customers
    payload.email = existing.email;
    payload.role = existing.role;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })

  if (error) {
    console.error("Error in upsertUserProfile server action:", error)
    return { success: false, error: error.message }
  }

  // Trigger CUSTOMER_SIGNUP visual automation workflow if new user profile created
  if (!existing) {
    const signupPayload = {
      id: userId,
      customer_id: userId,
      customer_name: fullName,
      email: email,
      phone: phone || "None",
      created_at: new Date().toISOString()
    }
    triggerWorkflowEvent("CUSTOMER_SIGNUP", signupPayload).catch(e => {
      console.error("Workflow signup trigger execution error:", e)
    })
  }

  return { success: true }
}
