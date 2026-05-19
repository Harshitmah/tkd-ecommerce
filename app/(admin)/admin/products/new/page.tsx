import { createServerSupabaseClient } from "@/lib/supabase/server"
import ProductForm from "@/components/admin/ProductForm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewProductPage() {
  const supabase = await createServerSupabaseClient()
  const { data: categories } = await supabase.from("categories").select("id, name")

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/products" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">New Product</h1>
            <p className="mt-2 text-zinc-500">Create a new product in your catalog.</p>
          </div>
        </div>
      </div>

      <ProductForm categories={categories || []} />
    </div>
  )
}

