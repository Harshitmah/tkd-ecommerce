"use client"

import * as React from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Plus, Minus, Heart, ShoppingBag, ShieldCheck, Truck, RefreshCw, Share2, CheckCircle2, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { formatCurrency, cn } from "@/lib/utils"
import { useCart } from "@/hooks/useCart"
import { useWishlist } from "@/hooks/useWishlist"
import { useAnimation } from "@/hooks/useAnimation"
import { useSettings } from "@/hooks/useSettings"

interface ProductDetailProps {
  product: any
  reviews?: any[]
}

export function ProductDetail({ product, reviews = [] }: ProductDetailProps) {
  const { addItem, setIsCartOpen } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { triggerFly } = useAnimation()
  const { settings } = useSettings()
  const [selectedImage, setSelectedImage] = React.useState(0)
  const [quantity, setQuantity] = React.useState(1)
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null)
  const [copiedShare, setCopiedShare] = React.useState(false)
  const [isShareDropdownOpen, setIsShareDropdownOpen] = React.useState(false)
  const shareDropdownRef = React.useRef<HTMLDivElement>(null)

  const isWishlisted = isInWishlist(product.id)

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2000)
    }
  }

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target as Node)) {
        setIsShareDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  React.useEffect(() => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0])
    }
  }, [product.variants, selectedVariant])

  const reviewsCount = reviews.length
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
  const averageRating = reviewsCount > 0 ? (totalRating / reviewsCount).toFixed(1) : "5.0"

  const variantImage = selectedVariant?.option_values?.[0]?.image_url
  const mainImage = variantImage || product.images?.[selectedImage]?.image_url || "/placeholder.jpg"
  
  const currency = settings?.currency_code || "INR"
  const symbol = settings?.currency_symbol || "₹"

  const variantSalePrice = selectedVariant?.option_values?.[0]?.sale_price
  const variantRegularPrice = selectedVariant?.price

  const displayPrice = selectedVariant 
    ? (variantSalePrice || variantRegularPrice || product.price)
    : (product.sale_price || product.price)

  const hasSale = selectedVariant 
    ? (!!variantSalePrice && variantSalePrice < variantRegularPrice) 
    : (!!product.sale_price && product.sale_price < product.price)

  const originalPrice = hasSale 
    ? (selectedVariant ? variantRegularPrice : product.price) 
    : null

  // Parse structured data from description
  const parseDescription = (desc: string) => {
    try {
      if (desc && desc.includes("<!--PRODUCT_DATA:")) {
        const parts = desc.split("<!--PRODUCT_DATA:")
        const rawJson = parts[1].split("-->")[0]
        const data = JSON.parse(rawJson)
        return {
          text: parts[0].trim(),
          highlights: data.highlights || [],
          specifications: data.specifications || []
        }
      }
    } catch (e) {
      console.error("Error parsing product data", e)
    }
    return { text: desc, highlights: [], specifications: [] }
  }

  const { text, highlights, specifications } = parseDescription(product.description || "")

  const handleAddToCart = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    triggerFly(mainImage, rect.left, rect.top)

    addItem({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      productId: product.id,
      variantId: selectedVariant?.id,
      title: product.title,
      price: displayPrice,
      quantity,
      image: mainImage,
      variantInfo: selectedVariant ? { "Variant": selectedVariant.option_values?.[0]?.value } : undefined,
    })
    
    setTimeout(() => setIsCartOpen(true), 500)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:py-20 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
        {/* Left: Image Gallery */}
        <div className="flex flex-col gap-6">
          <div className="relative aspect-square w-full overflow-hidden rounded-[32px] bg-zinc-50 border border-zinc-100 shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="h-full w-full"
              >
                <Image
                  src={mainImage}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {product.images?.map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={cn(
                  "relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-50 transition-all duration-300",
                  selectedImage === idx ? "ring-2 ring-black scale-95 shadow-lg" : "opacity-60 hover:opacity-100 border border-zinc-100"
                )}
              >
                <Image
                  src={img.image_url}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col py-2">
          <div className="flex items-center justify-between mb-6">
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
              <span className="hover:text-black cursor-pointer transition-colors">SHOP</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-black">{product.category?.name || "COLLECTION"}</span>
            </nav>
            <div className="flex items-center gap-6">
              <div className="relative" ref={shareDropdownRef}>
                <button 
                  onClick={() => setIsShareDropdownOpen(!isShareDropdownOpen)}
                  className="text-zinc-400 hover:text-black transition-all hover:scale-110 flex items-center justify-center h-10 w-10 rounded-full hover:bg-zinc-50 border border-transparent hover:border-zinc-200"
                  aria-label="Share Product Options"
                >
                  {copiedShare ? (
                    <Check className="h-5 w-5 text-emerald-500 animate-pulse" />
                  ) : (
                    <Share2 className="h-5 w-5" />
                  )}
                </button>

                <AnimatePresence>
                  {isShareDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-56 rounded-2xl bg-white border border-zinc-100 p-3.5 shadow-xl z-50 flex flex-col gap-1 text-left"
                    >
                      <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest px-2 mb-2 block">
                        Share Product
                      </span>
                      
                      {/* WhatsApp Option */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this premium organic product: ${product.title} - ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors text-[10px] font-bold text-black uppercase tracking-wider cursor-pointer"
                        onClick={() => setIsShareDropdownOpen(false)}
                      >
                        <svg className="h-4 w-4 fill-current text-[#25D366]" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.58 2.017 14.12 1.01 11.5 1.01c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.453 3.39 1.31 4.877L1.93 21.07l5.42-1.42.71-.486zM17.47 14.39c-.294-.148-1.745-.86-2.012-.96-.267-.098-.463-.148-.658.148-.196.297-.759.957-.93 1.15-.173.196-.347.218-.64.07-.294-.148-1.24-.457-2.36-1.457-.872-.778-1.46-1.74-1.63-2.037-.173-.294-.018-.454.13-.601.132-.132.294-.347.44-.52.146-.173.196-.297.294-.495.097-.198.05-.37-.024-.52-.074-.148-.658-1.587-.902-2.174-.236-.57-.478-.49-.658-.5-.164-.008-.352-.01-.54-.01-.19 0-.498.07-.759.352-.26.297-1.002.978-1.002 2.385 0 1.408 1.023 2.77 1.168 2.968.145.195 2.012 3.073 4.875 4.314.68.295 1.212.472 1.626.604.684.218 1.306.187 1.8.113.548-.08 1.745-.713 1.99-1.402.244-.69.244-1.28.172-1.402-.072-.12-.267-.197-.56-.347z" />
                        </svg>
                        WhatsApp
                      </a>

                      {/* Twitter / X Option */}
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this premium organic product: ${product.title}`)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors text-[10px] font-bold text-black uppercase tracking-wider cursor-pointer"
                        onClick={() => setIsShareDropdownOpen(false)}
                      >
                        <svg className="h-4 w-4 fill-current text-black" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Twitter / X
                      </a>

                      {/* Facebook Option */}
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors text-[10px] font-bold text-black uppercase tracking-wider cursor-pointer"
                        onClick={() => setIsShareDropdownOpen(false)}
                      >
                        <svg className="h-4 w-4 fill-current text-[#1877F2]" viewBox="0 0 24 24">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                        </svg>
                        Facebook
                      </a>

                      {/* Copy Link Option */}
                      <button
                        onClick={() => {
                          handleShare()
                          setIsShareDropdownOpen(false)
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors text-left text-[10px] font-bold text-black uppercase tracking-wider cursor-pointer"
                      >
                        <svg className="h-4 w-4 stroke-current text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        Copy Link
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={() => toggleWishlist({
                  id: product.id,
                  title: product.title,
                  price: displayPrice,
                  image: mainImage,
                  slug: product.slug,
                  categoryName: product.category?.name
                })}
                className={cn(
                  "transition-all hover:scale-110 flex items-center justify-center h-10 w-10 rounded-full hover:bg-zinc-50 border border-transparent hover:border-zinc-200",
                  isWishlisted ? "text-red-500 hover:text-red-600" : "text-zinc-400 hover:text-red-500"
                )}
                aria-label="Add to Wishlist"
              >
                <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
              </button>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-black md:text-6xl">
            {product.title}
          </h1>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center bg-zinc-50 px-3 py-1.5 rounded-full">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.round(parseFloat(averageRating))
                      ? "fill-black text-black"
                      : "text-zinc-200"
                  )}
                />
              ))}
              <span className="ml-2 text-[10px] font-bold text-black">{averageRating}</span>
            </div>
            {reviewsCount > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-200 cursor-pointer hover:text-black transition-colors">
                {reviewsCount} Verified Review{reviewsCount !== 1 && "s"}
              </span>
            )}
          </div>

          <div className="mt-10 flex items-baseline gap-4">
            <span className="text-4xl font-extrabold tracking-tighter text-black">
              {formatCurrency(displayPrice, currency, symbol)}
            </span>
            {originalPrice && (
              <span className="text-xl text-zinc-300 line-through font-bold">
                {formatCurrency(originalPrice, currency, symbol)}
              </span>
            )}
          </div>

          <p className="mt-8 text-base leading-relaxed text-zinc-600 font-medium max-w-xl">
            {text || "Perfect for home workouts, this resistance band set helps improve strength, flexibility, and endurance. Suitable for beginners and professionals."}
          </p>

          {/* Highlights Summary */}
          {highlights.length > 0 && (
            <div className="mt-8 space-y-3">
              {highlights.slice(0, 3).map((h: string, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium text-black/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {h}
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 space-y-10 border-t border-zinc-100 pt-10">
            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">
                  Select Configuration
                </h3>
                <div className="flex flex-wrap gap-4">
                  {product.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={cn(
                        "flex h-14 px-8 items-center justify-center rounded-2xl border-2 transition-all font-bold text-sm",
                        selectedVariant?.id === v.id
                          ? "border-black bg-black text-white shadow-lg scale-95"
                          : "border-zinc-100 hover:border-black/20 text-black bg-white"
                      )}
                    >
                      {v.option_values?.[0]?.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-full items-center justify-between border border-zinc-200 rounded-2xl px-8 sm:w-48 bg-white shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:text-black transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-lg font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 hover:text-black transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="h-16 w-full sm:w-auto sm:flex-1 rounded-2xl bg-black text-white hover:bg-zinc-900 transition-all font-bold text-base shadow-xl active:scale-95"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="mr-3 h-5 w-5" />
                ADD TO BAG
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 bg-zinc-50/50 rounded-2xl p-5 border border-zinc-100/50">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-black tracking-tight">Available Inventory</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Ready for immediate dispatch</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-zinc-50/50 rounded-2xl p-5 border border-zinc-100/50">
                <Truck className="h-5 w-5 text-zinc-300" />
                <div>
                  <p className="text-xs font-bold text-black tracking-tight">Complementary Logistics</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">On all domestic orders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details Section */}
      {(highlights.length > 0 || specifications.length > 0) && (
        <div className="mt-16 md:mt-32 border-t border-zinc-100 pt-12 md:pt-24 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {highlights.length > 0 && (
            <div className="space-y-8 md:space-y-12">
              <div className="space-y-2 md:space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-400">Superiority</span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black">Product Highlights</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:gap-8">
                {highlights.map((h: string, i: number) => (
                  <div key={i} className="flex items-center md:items-start gap-4 md:gap-6 group">
                    <div className="h-8 w-8 md:h-10 md:w-10 shrink-0 rounded-[10px] md:rounded-xl bg-zinc-50 flex items-center justify-center text-black font-bold text-xs md:text-sm group-hover:bg-black group-hover:text-white transition-all">
                      0{i + 1}
                    </div>
                    <p className="text-base md:text-lg leading-relaxed text-zinc-600 font-medium">
                      {h}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {specifications.length > 0 && (
            <div className="space-y-8 md:space-y-12">
              <div className="space-y-2 md:space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-400">Intelligence</span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black">Technical Specs</h2>
              </div>
              <div className="bg-zinc-50/50 rounded-[24px] md:rounded-[32px] p-6 md:p-10 border border-zinc-100 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-zinc-100">
                    {specifications.map((s: any, i: number) => (
                      <tr key={i} className="group">
                        <td className="py-4 md:py-6 pr-4 md:pr-6 text-[11px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">{s.key}</td>
                        <td className="py-4 md:py-6 pl-4 md:pl-6 text-xs md:text-sm font-bold text-black text-right">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
