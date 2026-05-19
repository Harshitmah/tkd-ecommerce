"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client to bypass client RLS policies for database operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function updateCustomerProfile(
  id: string,
  data: {
    fullName: string
    email: string
    phone: string
    city: string
    role: "customer" | "admin"
  }
) {
  try {
    // 1. Update Auth Email using service role admin client
    if (data.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        email: data.email,
        email_confirm: true
      })
      if (authError) {
        console.warn("Auth email update warning:", authError.message)
      }
    }

    // 2. Update profiles table
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        city: data.city,
        role: data.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/admin/customers")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update customer profile:", error)
    return { success: false, error: error.message || "Failed to update profile." }
  }
}

export async function deleteCustomer(id: string) {
  try {
    // Delete user from auth (will cascade delete the profile record due to ON DELETE CASCADE references)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    
    if (authError) {
      // Fallback: try deleting database profile directly if auth delete fails (e.g. mock environment)
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", id)
      
      if (profileError) throw profileError
    }

    revalidatePath("/admin/customers")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete customer:", error)
    return { success: false, error: error.message || "Failed to delete customer." }
  }
}
