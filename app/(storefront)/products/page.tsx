import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/storefront/ProductCard"
import { Button } from "@/components/ui/Button"
import { ProductFilters } from "@/components/storefront/ProductFilters"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const revalidate = 60 // ISR: Revalidate every 60 seconds

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    q?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams
  const category = resolvedSearchParams.category
  const sort = resolvedSearchParams.sort || "newest"
  const minPrice = resolvedSearchParams.minPrice
  const maxPrice = resolvedSearchParams.maxPrice
  const q = resolvedSearchParams.q

  const supabase = await createServerSupabaseClient()

  // 1. Fetch Categories for Filter
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .order("name")

  // Resolve active category object and ID
  const activeCategoryObj = categories?.find((c) => c.slug === category)
  const activeCategoryId = activeCategoryObj?.id

  // 2. Build Query
  let query = supabase
    .from("products")
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(image_url)
    `)
    .eq("status", "active")

  // Filtering
  if (category) {
    if (activeCategoryId) {
      query = query.eq("category_id", activeCategoryId)
    } else {
      // Force empty results if category slug is invalid
      query = query.eq("category_id", "00000000-0000-0000-0000-000000000000")
    }
  }

  if (minPrice) {
    query = query.gte("price", parseFloat(minPrice))
  }
  if (maxPrice) {
    query = query.lte("price", parseFloat(maxPrice))
  }
  if (q) {
    query = query.ilike("title", `%${q}%`)
  }

  // Sorting
  switch (sort) {
    case "newest":
      query = query.order("created_at", { ascending: false })
      break
    case "price-low":
      query = query.order("price", { ascending: true })
      break
    case "price-high":
      query = query.order("price", { ascending: false })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  const { data: products, error } = await query

  if (error) {
    console.error("Error fetching products:", error)
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-12 md:px-16 md:py-20 bg-white">
      {/* Top Banner Image (Contained premium aesthetic matching homepage style but smaller) */}
      <div className="relative h-[38vh] min-h-[280px] w-full overflow-hidden rounded-[32px] mb-12 border border-white/[0.05] shadow-lg animate-in fade-in duration-1000 flex items-center bg-black">
        <img
          src={activeCategoryObj?.image_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"}
          alt={activeCategoryObj?.name || "Our Catalog"}
          className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity"
        />
        {/* Soft elegant deep black gradient overlay for an ultra-premium dark editorial look */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Content overlaid inside the banner */}
        <div className="relative z-10 max-w-2xl pl-8 md:pl-16 text-left">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-amber-400/90">
            Elegance Uncompromised
          </span>
          <h1 className="font-serif text-4xl font-extrabold md:text-5xl lg:text-6xl tracking-tight text-white mt-2 uppercase">
            {activeCategoryObj ? activeCategoryObj.name : "Shop All"}
          </h1>
          <p className="mt-4 text-xs font-medium tracking-wide text-zinc-300 max-w-md leading-relaxed">
            {activeCategoryObj 
              ? `Explore our curated selection of premium ${activeCategoryObj.name.toLowerCase()} products, crafted for your daily routine.`
              : "Explore our curated catalog of modern essentials and meticulously finished boutique garments."
            }
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-12 flex items-center justify-between border-b border-black/5 pb-6">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
          Showing {products?.length || 0} {products?.length === 1 ? "Product" : "Products"}
        </span>
        <ProductFilters 
          categories={categories || []}
          activeCategory={category}
          activeSort={sort}
          activeMinPrice={minPrice}
          activeMaxPrice={maxPrice}
        />
      </div>

      <div className="flex flex-col gap-10 md:flex-row">
        {/* Categories Sidebar (Desktop) */}
        <aside className="hidden w-56 flex-shrink-0 md:block text-left">
          <h3 className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400 border-b border-black/5 pb-3">
            Collections
          </h3>
          <ul className="mt-6 flex flex-col gap-5">
            <li>
              <Link
                href="/products"
                className={cn(
                  "inline-block text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all pb-0.5",
                  !category
                    ? "text-black border-b border-black"
                    : "text-zinc-400 hover:text-black"
                )}
              >
                All Products
              </Link>
            </li>
            {categories?.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className={cn(
                    "inline-block text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all pb-0.5",
                    category === cat.slug
                      ? "text-black border-b border-black"
                      : "text-zinc-400 hover:text-black"
                  )}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center text-center border border-dashed border-black/10 rounded-3xl p-6 bg-zinc-50/50">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.2em] text-black">
                No items matching criteria
              </h3>
              <p className="mt-2 text-xs font-medium tracking-wide text-zinc-500">
                Adjust your active filters, prices, or categories to explore other styles.
              </p>
              <Link href="/products" className="mt-6">
                <button className="h-10 px-6 rounded-full bg-black text-[10px] font-extrabold uppercase tracking-widest text-white hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer">
                  Clear Active Filters
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
