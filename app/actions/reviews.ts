"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client to bypass RLS policies
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Storefront default testimonials to seed if none exist
const DEFAULT_TESTIMONIALS = [
  {
    rating: 5,
    title: "Ananya Sharma",
    body: "The purity of Telkidukan oils is unmatched. I've been using the organic almond oil for three months, and the results are truly transformative.",
    is_verified: true,
  },
  {
    rating: 5,
    title: "Rahul Verma",
    body: "A truly premium experience from packaging to the product itself. The fast delivery across India makes it so convenient for someone always on the move.",
    is_verified: true,
  },
  {
    rating: 5,
    title: "Priya Patel",
    body: "Exceptional customer support. I had a question about the extraction process and they provided detailed laboratory certifications instantly. Impressive.",
    is_verified: true,
  },
]

/**
 * Fetch all storefront reviews (where product_id IS NULL).
 * If empty, automatically seed and return the default testimonials.
 */
export async function getStorefrontReviews() {
  try {
    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .is("product_id", null)
      .order("created_at", { ascending: false })

    if (error) throw error

    if (!reviews || reviews.length === 0) {
      console.log("No storefront reviews found. Seeding defaults...")
      // Insert default testimonials
      const { data: seeded, error: seedError } = await supabaseAdmin
        .from("reviews")
        .insert(
          DEFAULT_TESTIMONIALS.map((t) => ({
            rating: t.rating,
            title: t.title,
            body: t.body,
            is_verified: t.is_verified,
            product_id: null,
            user_id: null,
          }))
        )
        .select()

      if (seedError) {
        console.error("Error seeding default reviews:", seedError)
        return DEFAULT_TESTIMONIALS.map((t, idx) => ({
          id: `default-${idx}`,
          product_id: null,
          user_id: null,
          rating: t.rating,
          title: t.title,
          body: t.body,
          is_verified: t.is_verified,
          created_at: new Date().toISOString(),
        }))
      }

      return seeded
    }

    return reviews
  } catch (error: any) {
    console.error("Failed to fetch storefront reviews:", error)
    return []
  }
}

/**
 * Create a new storefront review
 */
export async function createStorefrontReview(data: {
  reviewerName: string
  rating: number
  body: string
  isVerified: boolean
}) {
  try {
    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        title: data.reviewerName,
        rating: data.rating,
        body: data.body,
        is_verified: data.isVerified,
        product_id: null,
        user_id: null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/reviews")
    revalidatePath("/")
    return { success: true, data: review }
  } catch (error: any) {
    console.error("Failed to create storefront review:", error)
    return { success: false, error: error.message || "Failed to create review." }
  }
}

/**
 * Update an existing storefront review
 */
export async function updateStorefrontReview(
  id: string,
  data: {
    reviewerName: string
    rating: number
    body: string
    isVerified: boolean
  }
) {
  try {
    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .update({
        title: data.reviewerName,
        rating: data.rating,
        body: data.body,
        is_verified: data.isVerified,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/reviews")
    revalidatePath("/")
    return { success: true, data: review }
  } catch (error: any) {
    console.error("Failed to update storefront review:", error)
    return { success: false, error: error.message || "Failed to update review." }
  }
}

/**
 * Delete a storefront review
 */
export async function deleteStorefrontReview(id: string) {
  try {
    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/admin/reviews")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete storefront review:", error)
    return { success: false, error: error.message || "Failed to delete review." }
  }
}

/**
 * Fetch all reviews for a specific product
 */
export async function getProductReviews(productId: string) {
  try {
    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select(`
        *,
        profile:profiles(full_name, avatar_url)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return reviews || []
  } catch (error: any) {
    console.error(`Failed to fetch product reviews for product ID ${productId}:`, error)
    return []
  }
}

/**
 * Fetch all product reviews (where product_id IS NOT NULL).
 */
export async function getAllProductReviews() {
  try {
    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select(`
        *,
        product:products(title, slug)
      `)
      .not("product_id", "is", null)
      .order("created_at", { ascending: false })

    if (error) throw error
    return reviews || []
  } catch (error: any) {
    console.error("Failed to fetch product reviews:", error)
    return []
  }
}

/**
 * Create a new product review
 */
export async function createProductReview(
  productId: string,
  userId: string,
  data: {
    rating: number
    title: string
    body: string
  }
) {
  try {
    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: userId,
        rating: data.rating,
        title: data.title,
        body: data.body,
        is_verified: true, // Auto verify authenticated reviews
      })
      .select()
      .single()

    if (error) throw error

    // Revalidate paths to update UI instantly
    revalidatePath(`/products`)
    return { success: true, data: review }
  } catch (error: any) {
    console.error("Failed to create product review:", error)
    return { success: false, error: error.message || "Failed to create product review." }
  }
}

