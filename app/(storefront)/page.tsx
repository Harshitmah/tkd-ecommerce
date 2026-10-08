import Link from "next/link"
import { ArrowRight, Truck, Headset, ShieldCheck, RefreshCw, Star } from "lucide-react"
import { ProductCard } from "@/components/storefront/ProductCard"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CarouselWrapper } from "@/components/storefront/CarouselWrapper"
import { HeroCarousel } from "@/components/storefront/HeroCarousel"
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
      images:product_images(image_url),
      variants:product_variants(*),
      reviews(rating, is_verified)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50)

  const activeProducts = products || [];

  const justArrived = activeProducts.some(p => p.tags?.includes('section:just_arrived'))
    ? activeProducts.filter(p => p.tags?.includes('section:just_arrived'))
    : activeProducts.slice(0, 8);

  const mostLoved = activeProducts.some(p => p.tags?.includes('section:most_loved'))
    ? activeProducts.filter(p => p.tags?.includes('section:most_loved'))
    : activeProducts.slice(0, 6);

  const recommended = activeProducts.some(p => p.tags?.includes('section:recommended'))
    ? activeProducts.filter(p => p.tags?.includes('section:recommended'))
    : activeProducts.slice(0, 8);

  // 3. Fetch Storefront Reviews
  const storefrontReviews = await getStorefrontReviews()

  // 4. Hardcoded Banner Slides for easy management
  const bannerSlides = [
    {
      id: "slide-1",
      image_url: "/images/banner-2.png",
      mobile_image_url: "/images/Banner-2-mobile.png",
      cta_link: "/products",
    },
    {
      id: "slide-2",
      image_url: "/images/Banner-1.png",
      mobile_image_url: "/images/Banner-1-mobile.png",
      cta_link: "/products",
    },
    {
      id: "slide-3",
      image_url: "/images/Banner-3.png",
      mobile_image_url: "/images/Banner-3-mobile.png",
      cta_link: "/products",
    },
  ]

  return (
    <div className="flex flex-col bg-white">
      {/* 1. Premium Auto-playing Carousel Section */}
      <HeroCarousel slides={bannerSlides} />

      {/* 1.5 Marquee Section */}
      <div className="bg-blue-900 py-3 overflow-hidden flex whitespace-nowrap">
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div className="flex animate-[marquee_30s_linear_infinite] items-center text-white font-medium text-sm sm:text-base tracking-wide">
          {Array(8).fill("✦     Limited Time Only     ✦     Buy 2 Get 2 Free     ✦").map((text, i) => (
            <span key={i} className="mx-4">{text}</span>
          ))}
        </div>
      </div>

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

      {/* 3. Curated Categories Carousel (Responsive & smaller gap cards) */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-[1600px] px-6 md:px-16">
          <CarouselWrapper title="Shop by Category" subtitle="Discover">
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden bg-zinc-150 aspect-[4/5] w-[75vw] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] shrink-0 snap-start rounded-2xl transition-all duration-300 hover:shadow-premium"
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
          <CarouselWrapper title="Just Arrived" subtitle="Latest Drops" rows={2}>
            {justArrived.map((product) => (
              <div key={product.id} className="w-[75vw] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] shrink-0 snap-start hover-lift transition-all">
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
                  src="/images/ascent-1.png"
                  alt="Naturally Better"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="relative z-10 text-left">
                <span className="text-[8px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">
                  Naturally Better
                </span>
                <h3 className="mt-4 font-serif text-2xl font-extrabold leading-tight uppercase tracking-tight">
                  Pure Essentials
                </h3>
                <p className="mt-3 text-xs text-zinc-400 font-medium leading-relaxed max-w-[200px]">
                  100% Pure. No Chemicals. <br></br> Made with care.
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
              <CarouselWrapper title="Most Loved" subtitle="Featured Drops">
                {mostLoved.map((product) => (
                  <div key={`new-${product.id}`} className="w-[210px] shrink-0 snap-start hover-lift transition-all">
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

      {/* Recommended For You Section */}
      <section className="bg-zinc-50/50 py-12 md:py-16 border-b border-black/5">
        <div className="mx-auto max-w-[1600px] px-6 md:px-16">
          <CarouselWrapper title="Recommended for you" subtitle="Curated Choices">
            {recommended.map((product) => (
              <div key={`rec-${product.id}`} className="w-[75vw] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] shrink-0 snap-start hover-lift transition-all">
                <ProductCard product={product as any} />
              </div>
            ))}
          </CarouselWrapper>
        </div>
      </section>

      {/* 7. Brand Ethos Section (Premium 50/50 Split) */}
      <section className="bg-white py-12 md:py-24">
        <div className="mx-auto max-w-[1600px] px-6 md:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-[32px] bg-black shadow-2xl">
            {/* Image Half */}
            <div className="relative h-[400px] lg:h-auto w-full">
              <img
                src="/images/ascent-2.png"
                alt="Nature's pure oils"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            {/* Text Half */}
            <div className="flex flex-col justify-center px-10 py-16 md:p-20 text-white">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-amber-400">Our Heritage</span>
              <h2 className="mt-6 font-serif text-3xl font-extrabold leading-tight md:text-5xl uppercase tracking-tight">
                The Essence <br /> of Purity
              </h2>
              <p className="mt-8 text-sm leading-relaxed text-zinc-300 font-medium">
                At Telkidukan, we believe true wellness begins with uncompromised quality. We source only the finest natural botanicals and seeds, meticulously cold-pressing them to ensure every drop retains its maximum nutritional profile and healing properties.
              </p>

              <div className="mt-12 grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
                <div>
                  <h4 className="text-3xl font-serif font-extrabold text-white">100%</h4>
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Unrefined & Pure</p>
                </div>
                <div>
                  <h4 className="text-3xl font-serif font-extrabold text-white">Zero</h4>
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Chemical Additives</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Combos & Premium Boxes Section */}
      <section className="py-16 md:py-24 bg-zinc-50 border-t border-zinc-100">
        <div className="mx-auto max-w-[1600px] px-6 md:px-16">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">Curated Sets</span>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl font-extrabold text-black uppercase tracking-tight">Exclusive Combos & Boxes</h2>
            <p className="mt-4 text-sm text-zinc-500 max-w-xl font-medium leading-relaxed">
              Discover our thoughtfully paired 2-pack combos and premium oil boxes. The perfect harmony of nature's best, bundled together for your daily wellness rituals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Combo 1 */}
            <Link href="/products?category=combos" className="group block">
              <div className="relative overflow-hidden aspect-[4/3] md:aspect-[16/10] bg-white border border-black/5 rounded-[32px] shadow-sm">
                <img
                  src="/images/combo-pack-1.png" // Add your combo image here
                  alt="Hair & Scalp Revitalizer Combo"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
                <div className="absolute top-6 left-6">
                  <span className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Most Popular
                  </span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-black group-hover:text-zinc-600 transition-colors">
                  Hair & Scalp Revitalizer (2-Pack)
                </h3>
                <p className="mt-2 text-sm text-zinc-500 font-medium">
                  Rosemary + Coconut Oil • Deep conditioning and root stimulation for thicker, stronger hair.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
                  <span>Explore Combo</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Combo 2 */}
            <Link href="/products?category=combos" className="group block">
              <div className="relative overflow-hidden aspect-[4/3] md:aspect-[16/10] bg-white border border-black/5 rounded-[32px] shadow-sm">
                <img
                  src="/images/combo-pack-1.png" // Add your combo image here
                  alt="Daily Glow Wellness Box"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
                <div className="absolute top-6 left-6">
                  <span className="bg-white text-black text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                    Premium Box
                  </span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-black group-hover:text-zinc-600 transition-colors">
                  Daily Glow Wellness Box
                </h3>
                <p className="mt-2 text-sm text-zinc-500 font-medium">
                  Lavender + Sweet Almond Oil • A complete rejuvenating ritual for radiant, healthy skin.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
                  <span>Explore Box</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
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
          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
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
