import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ProductCard } from "@/components/storefront/ProductCard"
import { ProductDetail } from "@/components/storefront/ProductDetail"
import { ProductReviews } from "@/components/storefront/ProductReviews"
import { getProductReviews } from "@/app/actions/reviews"

import { generateMetadata as seoMetadata } from "@/lib/seo"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: product } = await supabase
    .from("products")
    .select("title, description, slug, product_images(image_url)")
    .eq("slug", slug)
    .single()

  if (!product) return seoMetadata()

  return seoMetadata(
    product.title,
    product.description,
    product.product_images?.[0]?.image_url,
    product.slug
  )
}


export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const supabase = createAdminClient()



  // 1. Fetch Product with images, category, and options
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(image_url, alt_text),
      options:product_options(
        id,
        name,
        values:product_option_values(id, value)
      ),
      variants:product_variants(*)
    `)
    .eq("slug", slug)

    .single()

  if (error || !product) {
    return notFound()
  }

  // 1.5 Fetch Product Reviews
  const reviews = await getProductReviews(product.id)

  // 2. Fetch Related Products
  const { data: relatedProducts } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(image_url)
    `)
    .or(
      product.related_categories && product.related_categories.length > 0
        ? `category_id.in.(${product.related_categories.join(',')})`
        : `category_id.eq.${product.category_id}`
    )
    .neq("id", product.id)
    .limit(4)


  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-16 md:py-20">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary-text">
        <Link href="/" className="hover:text-primary-text">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary-text">Shop</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category?.slug}`} className="hover:text-primary-text">
          {product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-primary-text">{product.title}</span>
      </nav>

      {/* Main Product Section */}
      <ProductDetail product={product} reviews={reviews} />

      {/* Reviews Section */}
      <ProductReviews productId={product.id} productSlug={product.slug} initialReviews={reviews as any[]} />

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-32">
          <div className="mb-12 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Related Products</h2>
            <Link href="/products" className="text-sm font-bold uppercase tracking-widest text-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

