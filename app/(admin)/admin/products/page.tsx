import { createServerSupabaseClient } from "@/lib/supabase/server"
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import ProductTable from "@/components/admin/ProductTable"

export default async function AdminProductsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name),
      images:product_images(image_url)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black font-serif">Product Catalog</h1>
          <p className="mt-1 text-sm text-gray-500">Manage, organize and monitor your Telkidukan inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="bg-white">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Link href="/admin/products/new">
            <Button variant="primary" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Products Catalog Table & Toolbar */}
      <ProductTable products={products || []} />

    </div>
  )
}
