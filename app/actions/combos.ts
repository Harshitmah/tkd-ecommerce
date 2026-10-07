"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function getAllCombos() {
  try {
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from("combo_offers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Failed to fetch all combos:", error)
    return []
  }
}

export async function getActiveCombos() {
  try {
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from("combo_offers")
      .select("*")
      .eq("is_active", true)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Failed to fetch active combos:", error)
    return []
  }
}

export async function createCombo(data: any) {
  try {
    const supabaseAdmin = createAdminClient()
    const { data: combo, error } = await supabaseAdmin
      .from("combo_offers")
      .insert(data)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/combos")
    return { success: true, data: combo }
  } catch (error: any) {
    console.error("Failed to create combo:", error)
    return { success: false, error: error.message }
  }
}

export async function updateCombo(id: string, data: any) {
  try {
    const supabaseAdmin = createAdminClient()
    const { data: combo, error } = await supabaseAdmin
      .from("combo_offers")
      .update(data)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/combos")
    return { success: true, data: combo }
  } catch (error: any) {
    console.error("Failed to update combo:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteCombo(id: string) {
  try {
    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin
      .from("combo_offers")
      .delete()
      .eq("id", id)

    if (error) throw error

    revalidatePath("/admin/combos")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete combo:", error)
    return { success: false, error: error.message }
  }
}
