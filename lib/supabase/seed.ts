import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log("Seeding data...")

  // 1. Create Categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .upsert([
      { 
        name: "Apparel", 
        slug: "apparel", 
        description: "Premium clothing",
        image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop"
      },
      { 
        name: "Accessories", 
        slug: "accessories", 
        description: "Elegant add-ons",
        image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop"
      },
      { 
        name: "Home", 
        slug: "home", 
        description: "Minimalist home decor",
        image_url: "https://images.unsplash.com/photo-1583847268964-b28dc2f51ac9?q=80&w=800&auto=format&fit=crop"
      },
    ], { onConflict: 'slug' })
    .select()



  if (catError) {
    console.error("Error seeding categories:", catError)
    return
  }

  const apparelId = categories.find((c) => c.slug === "apparel")?.id
  const accessoriesId = categories.find((c) => c.slug === "accessories")?.id

  // 2. Create Products
  const products = [
    {
      title: "Essential Silk Shirt",
      slug: "essential-silk-shirt",
      description: "A timeless piece crafted from the finest mulberry silk.",
      price: 240,
      category_id: apparelId,
      status: "active",
      sku: "ESS-SILK-001",
      stock_quantity: 50,
      tags: ["silk", "shirt", "essential"],
    },
    {
      title: "Tailored Wool Trousers",
      slug: "tailored-wool-trousers",
      description: "Perfectly cut wool trousers for a modern silhouette.",
      price: 320,
      category_id: apparelId,
      status: "active",
      sku: "TAIL-WOOL-001",
      stock_quantity: 30,
      tags: ["wool", "trousers", "tailored"],
    },
    {
      title: "Minimalist Leather Tote",
      slug: "minimalist-leather-tote",
      description: "Clean lines and premium Italian leather.",
      price: 450,
      category_id: accessoriesId,
      status: "active",
      sku: "MIN-TOTE-001",
      stock_quantity: 20,
      tags: ["leather", "tote", "bag"],
    },
    {
      title: "Cashmere Scarf",
      slug: "cashmere-scarf",
      description: "Ultra-soft Mongolian cashmere for cold winter days.",
      price: 180,
      category_id: accessoriesId,
      status: "active",
      sku: "CASH-SCARF-001",
      stock_quantity: 100,
      tags: ["cashmere", "scarf", "accessories"],
    },
  ]

  const { data: insertedProducts, error: prodError } = await supabase
    .from("products")
    .upsert(products, { onConflict: 'slug' })
    .select()


  if (prodError) {
    console.error("Error seeding products:", prodError)
    return
  }

  // 3. Add Images
  const productImages = [
    {
      product_id: insertedProducts[0].id,
      image_url: "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?q=80&w=800&auto=format&fit=crop",
      sort_order: 0,
    },
    {
      product_id: insertedProducts[1].id,
      image_url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=800&auto=format&fit=crop",
      sort_order: 0,
    },
    {
      product_id: insertedProducts[2].id,
      image_url: "https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800&auto=format&fit=crop",
      sort_order: 0,
    },
    {
      product_id: insertedProducts[3].id,
      image_url: "https://images.unsplash.com/photo-1511406361295-0a5ff814c0ad?q=80&w=800&auto=format&fit=crop",
      sort_order: 0,
    },
  ]

  const { error: imgError } = await supabase.from("product_images").upsert(productImages)


  if (imgError) {
    console.error("Error seeding product images:", imgError)
    return
  }

  console.log("Seeding completed successfully!")
}

seed()
