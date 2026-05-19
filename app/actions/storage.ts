"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client to interact with Supabase Storage and database with service role permissions
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Automatically checks and provisions the necessary storage buckets in Supabase.
 * Bypasses client RLS policies using the Service Role Key.
 * Forces public status on buckets so they are always accessible on both storefront and admin panels.
 */
export async function ensureStorageBuckets() {
  try {
    // 1. Check & Provision 'brand-assets' bucket
    const { error: brandErr } = await supabaseAdmin.storage.getBucket('brand-assets')
    if (brandErr && (brandErr.message.includes('not found') || brandErr.message.includes('does not exist'))) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket('brand-assets', {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
      })
      if (createErr) throw createErr
      console.log("Successfully created 'brand-assets' storage bucket.")
    } else {
      // Force update preexisting buckets to ensure they are public
      await supabaseAdmin.storage.updateBucket('brand-assets', {
        public: true,
      })
    }

    // 2. Check & Provision 'media-library' bucket
    const { error: mediaErr } = await supabaseAdmin.storage.getBucket('media-library')
    if (mediaErr && (mediaErr.message.includes('not found') || mediaErr.message.includes('does not exist'))) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket('media-library', {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
      })
      if (createErr) throw createErr
      console.log("Successfully created 'media-library' storage bucket.")
    } else {
      // Force update preexisting buckets to ensure they are public
      await supabaseAdmin.storage.updateBucket('media-library', {
        public: true,
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error("Failed to automatically provision Supabase storage buckets:", error)
    return { success: false, error: error.message || "Failed to initialize storage buckets." }
  }
}

/**
 * Uploads a base64-encoded media file to 'media-library' and records it in the database.
 * Bypasses RLS constraints on storage and media table.
 */
export async function uploadMediaAsset(formData: FormData) {
  try {
    const file = formData.get("file") as Blob
    const filename = formData.get("filename") as string
    const mimeType = formData.get("mimeType") as string

    if (!file) throw new Error("No file payload found in FormData.")

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileExt = filename.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `library/${fileName}`

    // 1. Upload to Supabase Storage using admin client (bypasses RLS)
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('media-library')
      .upload(filePath, buffer, {
        contentType: mimeType,
        duplex: 'half'
      })

    if (uploadErr) throw uploadErr

    // 2. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('media-library')
      .getPublicUrl(filePath)

    // 3. Insert into Database using admin client (bypasses RLS)
    const { data: insertData, error: insertErr } = await supabaseAdmin
      .from("media")
      .insert({
        url: publicUrl,
        filename: filename,
        size: buffer.length,
        mime_type: mimeType,
      })
      .select()
      .single()

    if (insertErr) throw insertErr

    return { success: true, mediaItem: insertData }
  } catch (error: any) {
    console.error("Server upload failed:", error)
    return { success: false, error: error.message || "Failed to upload asset." }
  }
}

/**
 * Fetches all media items.
 * Bypasses RLS constraints on media table.
 */
export async function fetchMediaRecords() {
  try {
    const { data, error } = await supabaseAdmin
      .from("media")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    console.error("Failed to fetch media records:", error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Deletes a media item from storage and the database.
 * Bypasses RLS constraints.
 */
export async function deleteMediaRecord(id: string) {
  try {
    // 1. Fetch item from db to get URL
    const { data: item } = await supabaseAdmin.from("media").select("url").eq("id", id).maybeSingle()
    if (item) {
      const path = item.url.split('media-library/')[1]
      if (path) {
        await supabaseAdmin.storage.from('media-library').remove([path])
      }
    }

    // 2. Delete database record
    const { error } = await supabaseAdmin.from("media").delete().eq("id", id)
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete media record:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Uploads a base64-encoded logo/favicon file to 'brand-assets'.
 * Bypasses storage RLS constraints.
 */
export async function uploadBrandAsset(base64Data: string, filename: string, mimeType: string) {
  try {
    const buffer = Buffer.from(base64Data, "base64")
    
    // 1. Upload to Supabase Storage using admin client (bypasses RLS)
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('brand-assets')
      .upload(filename, buffer, {
        contentType: mimeType,
        duplex: 'half',
        upsert: true
      })

    if (uploadErr) throw uploadErr

    // 2. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('brand-assets')
      .getPublicUrl(filename)

    return { success: true, publicUrl }
  } catch (error: any) {
    console.error("Brand asset server upload failed:", error)
    return { success: false, error: error.message || "Failed to upload brand asset." }
  }
}

/**
 * Uploads a base64-encoded category image to 'media-library' under 'categories/'.
 * Bypasses storage RLS constraints.
 */
export async function uploadCategoryImage(base64Data: string, filename: string, mimeType: string) {
  try {
    const buffer = Buffer.from(base64Data, "base64")
    const fileExt = filename.split('.').pop()
    const fileName = `category-${Date.now()}.${fileExt}`
    const filePath = `categories/${fileName}`

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('media-library')
      .upload(filePath, buffer, {
        contentType: mimeType,
        duplex: 'half'
      })

    if (uploadErr) throw uploadErr

    // Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('media-library')
      .getPublicUrl(filePath)

    return { success: true, url: publicUrl }
  } catch (error: any) {
    console.error("Category image server upload failed:", error)
    return { success: false, error: error.message || "Failed to upload category image." }
  }
}

/**
 * Saves site settings securely using admin client.
 * Bypasses RLS constraints on site_settings table.
 */
export async function saveSiteSettings(payload: any, id?: string) {
  try {
    let error
    let insertedData = null

    if (id) {
      const { error: err } = await supabaseAdmin.from("site_settings").update(payload).eq("id", id)
      error = err
    } else {
      const { data, error: err } = await supabaseAdmin.from("site_settings").insert(payload).select().single()
      error = err
      insertedData = data
    }

    if (error) throw error
    return { success: true, data: insertedData }
  } catch (error: any) {
    console.error("Failed to save site settings:", error)
    return { success: false, error: error.message }
  }
}
