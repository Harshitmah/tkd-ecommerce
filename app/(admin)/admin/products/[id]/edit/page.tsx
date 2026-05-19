import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ProductForm from "@/components/admin/ProductForm"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      images:product_images(image_url),
      category:categories(id, name),
      variants:product_variants(*)
    `)
    .eq("id", id)
    .single()

  if (!product) return notFound()

  // Fetch categories for the form
  const { data: categories } = await supabase.from("categories").select("id, name")

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="mt-2 text-zinc-500">Update your product details and status.</p>
      </div>

      <ProductForm initialData={product} categories={categories || []} />
    </div>
  )
}
