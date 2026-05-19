import Link from "next/link"
import { ArrowRight, Truck, Headset, ShieldCheck, RefreshCw, Star } from "lucide-react"
import { ProductCard } from "@/components/storefront/ProductCard"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CarouselWrapper } from "@/components/storefront/CarouselWrapper"
import { ReviewsCarousel } from "@/components/storefront/ReviewsCarousel"
import { getStorefrontReviews } from "@/app/actions/reviews"

export default async function Home() {
  const supabase = await createServerSupabaseClient()

  // 1. Fetch Categories (fetching more for carousel)
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .limit(8)

  // 2. Fetch Recently Added (fetching 8 for carousel)
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(image_url)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8)

  // 3. Fetch Storefront Reviews
  const storefrontReviews = await getStorefrontReviews()

  // 4. Fetch Hero Slide/Banner
  const { data: heroSlide } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(1)
    .maybeSingle()

  const bannerUrl = heroSlide?.image_url || "/images/hero-banner.png"
  const bannerHeading = heroSlide?.heading || "Elevate Your\nDaily Routine."
  const bannerSubheading = heroSlide?.subheading || "Discover our new collection of meticulously crafted essentials for modern living."
  const bannerCtaText = heroSlide?.cta_text || "Shop Collection"
  const bannerCtaLink = heroSlide?.cta_link || "/products"

  return (
    <div className="flex flex-col bg-white">
      {/* 1. Premium Banner Section (Rounded contained aesthetic matching mockup) */}
      <section className="px-4 py-4 md:px-8 md:py-6 bg-white">
        <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden rounded-[32px]">
          <img
            src={bannerUrl}
            alt="Elevate Your Daily Routine"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Grayscale gradient overlay for optimal high-contrast legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

          <div className="relative mx-auto flex h-full max-w-[1600px] flex-col items-start justify-center px-10 md:px-20 text-left text-white">
            <h1 className="max-w-2xl font-serif text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl lg:text-8xl animate-in fade-in duration-1000 whitespace-pre-line">
              {bannerHeading}
            </h1>
            <p className="mt-6 max-w-lg text-sm font-medium leading-relaxed tracking-wide text-zinc-300 animate-in fade-in duration-1000 delay-300">
              {bannerSubheading}
            </p>

            <div className="mt-8 animate-in fade-in duration-1000 delay-500">
              <Link href={bannerCtaLink}>
                <button className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer">
                  {bannerCtaText}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust Badges Section (Reduced padding & clean B&W) */}
      <section className="border-b border-black/5 py-10 bg-white">
        <div className="mx-auto max-w-[1600px] px-6 md:px-16">
          <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-8">
            <TrustBadge
              icon={Truck}
              title="All India Delivery"
              description="Fast and secure shipping nationwide"
            />
            <TrustBadge
              icon={Headset}
              title="Expert Support"
              description="Dedicated assistance for your needs"
            />
            <TrustBadge
              icon={ShieldCheck}
              title="Pure & Certified"
              description="100% organic and laboratory tested"
            />
            <TrustBadge
              icon={RefreshCw}
              title="Easy Returns"
              description="Hassle-free 7-day return policy"
            />
          </div>
        </div>
      </section>

      {/* 3. Curated Categories Carousel (Reduced padding & smaller gap cards) */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-[1600px] px-6 md:px-16">
          <CarouselWrapper title="Shop by Category" subtitle="Discover">
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden bg-zinc-150 aspect-[4/5] h-[340px] w-[260px] shrink-0 snap-start rounded-2xl transition-all duration-300 hover:shadow-premium"
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-zinc-200" />
                )}
                <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-30" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                  <h3 className="font-serif text-lg font-extrabold uppercase tracking-wider">{cat.name}</h3>
                  <div className="mt-2 h-[1px] w-0 bg-white transition-all duration-500 group-hover:w-8" />
                  <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.3em] opacity-0 transition-all duration-500 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                    Discover More
                  </p>
                </div>
              </Link>
            ))}
          </CarouselWrapper>
        </div>
      </section>

      {/* 4. Recently Added Carousel (Reduced padding & smaller gap cards) */}
      <section className="bg-zinc-50/50 py-12 md:py-16 border-t border-b border-black/5">
        <div className="mx-auto max-w-[1600px] px-6 md:px-16">
          <CarouselWrapper title="Recently Added" subtitle="Latest Drops">
            {products?.map((product) => (
              <div key={product.id} className="w-[230px] shrink-0 snap-start bg-white p-3 rounded-2xl border border-black/[0.03] hover:shadow-premium transition-all">
                <ProductCard product={product as any} />
              </div>
            ))}
          </CarouselWrapper>
        </div>
      </section>

      {/* 5. Split Lookbook & Mini Product Carousel Section (Added below Recently Added) */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-[1600px] px-6 md:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Promo Card (40% width on large screens) */}
            <div className="lg:col-span-4 relative overflow-hidden rounded-[24px] bg-black text-white p-8 flex flex-col justify-between min-h-[380px] lg:min-h-full">
              <div className="absolute inset-0 opacity-40">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000"
                  alt="Modern Lookbook"
                  className="h-full w-full object-cover grayscale"
                />
              </div>
              <div className="relative z-10 text-left">
                <span className="text-[8px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">
                  New Lookbook
                </span>
                <h3 className="mt-4 font-serif text-2xl font-extrabold leading-tight uppercase tracking-tight">
                  The Modern<br />Minimalist
                </h3>
                <p className="mt-3 text-xs text-zinc-400 font-medium leading-relaxed max-w-[200px]">
                  Meticulously designed essentials for your daily routine. Strictly black and white.
                </p>
              </div>
              <div className="relative z-10 pt-8 text-left">
                <Link href="/products">
                  <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white border-b border-white pb-1 hover:text-zinc-300 transition-colors">
                    Explore New Items &rarr;
                  </span>
                </Link>
              </div>
            </div>

            {/* Product Carousel (60% width on large screens) */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <CarouselWrapper title="New In Collection" subtitle="Featured Drops">
                {products?.slice(0, 6).map((product) => (
                  <div key={`new-${product.id}`} className="w-[210px] shrink-0 snap-start bg-zinc-50/50 p-3 rounded-2xl border border-black/[0.03]">
                    <ProductCard product={product as any} />
                  </div>
                ))}
              </CarouselWrapper>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Reviews Section (Reduced padding & clean B&W) */}
      <section className="py-12 md:py-16 bg-white border-b border-black/5">
        <div className="mx-auto max-w-[1600px] px-6 md:px-16 text-center">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">Testimonials</span>
          <h2 className="mt-4 font-serif text-3xl font-extrabold md:text-4xl mb-12 uppercase tracking-tight">The Telkidukan Experience</h2>

          <ReviewsCarousel reviews={storefrontReviews as any[]} />
        </div>
      </section>

      {/* 7. Brand Ethos Section (Reduced padding & Grayscale style) */}
      <section className="relative overflow-hidden bg-black py-20 text-white md:py-28">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
          <img src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=1018&auto=format&fit=crop" alt="Nature" className="h-full w-full object-cover grayscale" />
        </div>
        <div className="relative mx-auto max-w-[1600px] px-6 md:px-16">
          <div className="max-w-2xl text-left">
            <span className="text-[8px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">Our Philosophy</span>
            <h2 className="mt-4 font-serif text-4xl font-extrabold leading-tight md:text-6xl uppercase tracking-tight">
              Crafted by Nature, <br />
              Perfected by Us.
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-zinc-400 font-medium">
              At Telkidukan, we believe that the purest ingredients make the finest products.
              Every drop is a testament to our commitment to quality, sustainability, and your well-being.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-12">
              <div>
                <h4 className="text-2xl font-extrabold text-white">100%</h4>
                <p className="mt-2 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Pure Organic</p>
              </div>
              <div>
                <h4 className="text-2xl font-extrabold text-white">Hand</h4>
                <p className="mt-2 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Cold Pressed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Minimalist Lifestyle Moodboard (Replacing Newsletter) */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-[1600px] px-6 md:px-16 text-center">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">Aesthetic Living</span>
          <h2 className="mt-3 font-serif text-3xl font-extrabold md:text-4xl text-black uppercase tracking-tight">Curated Spaces</h2>
          <p className="mt-2 text-xs text-zinc-500 max-w-md mx-auto font-medium">
            Explore the intersection of luxury, minimalism, and premium craftsmanship designed for your contemporary living.
          </p>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 1, url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800" },
              { id: 2, url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800" },
              { id: 3, url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800" },
              { id: 4, url: "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800" }
            ].map((img) => (
              <div key={img.id} className="relative overflow-hidden rounded-2xl aspect-square bg-zinc-150 group">
                <img
                  src={img.url}
                  alt="Minimalist Lifestyle"
                  className="absolute inset-0 h-full w-full object-cover grayscale transition-transform duration-1000 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function TrustBadge({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 group">
      <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center text-black border border-black/5 transition-all duration-500 group-hover:bg-black group-hover:text-white">
        <Icon className="h-5 w-5 stroke-[1.5]" />
      </div>
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">{title}</h4>
        <p className="text-[8px] text-zinc-400 font-bold tracking-widest uppercase">{description}</p>
      </div>
    </div>
  )
}

function ReviewCard({ author, rating, text, date }: { author: string, rating: number, text: string, date: string }) {
  return (
    <div className="p-8 border border-black/5 bg-zinc-50/30 rounded-2xl space-y-4 hover:bg-white hover:shadow-premium transition-all duration-500">
      <div className="flex gap-0.5">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-black text-black" />
        ))}
      </div>
      <p className="text-xs italic leading-relaxed text-zinc-600 font-medium">"{text}"</p>
      <div className="pt-4 border-t border-black/5">
        <h5 className="text-[9px] font-bold uppercase tracking-widest text-black">{author}</h5>
        <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold mt-1">{date}</p>
      </div>
    </div>
  )
}
