"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client to interact with Supabase database with service role permissions (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function saveProductData(
  productData: any,
  images: string[],
  variants: any[],
  initialDataId?: string
) {
  try {
    let productId = initialDataId

    // 1. Save Product
    if (productId) {
      const { error } = await supabaseAdmin.from("products").update(productData).eq("id", productId)
      if (error) throw error
    } else {
      const { data, error } = await supabaseAdmin.from("products").insert(productData).select().single()
      if (error) throw error
      productId = data.id
    }

    // 2. Save Images
    if (initialDataId) {
      await supabaseAdmin.from("product_images").delete().eq("product_id", productId)
    }
    const imageRecords = images.map((url, index) => ({
      product_id: productId,
      image_url: url,
      sort_order: index,
    }))
    if (imageRecords.length > 0) {
      const { error } = await supabaseAdmin.from("product_images").insert(imageRecords)
      if (error) throw error
    }

    // 3. Save Variants
    if (initialDataId) {
      await supabaseAdmin.from("product_variants").delete().eq("product_id", productId)
    }
    const variantRecords = variants.map(v => ({
      product_id: productId,
      sku: v.sku || `${productData.slug}-${v.label.toLowerCase().replace(/\s+/g, '-')}`,
      price: v.price ? parseFloat(v.price) : null,
      stock_quantity: parseInt(v.stock_quantity) || 0,
      option_values: [{ 
        option_name: "Size/Variant", 
        value: v.label,
        sale_price: v.sale_price ? parseFloat(v.sale_price) : null,
        image_url: v.image_url || null
      }]
    }))
    if (variantRecords.length > 0) {
      const { error } = await supabaseAdmin.from("product_variants").insert(variantRecords)
      if (error) throw error
    }

    return { success: true, productId }
  } catch (error: any) {
    console.error("Failed to save product data:", error)
    return { success: false, error: error.message }
  }
}
