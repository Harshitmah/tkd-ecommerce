"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag, Heart, Eye, Star } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { useSettings } from "@/hooks/useSettings"

interface ProductCardProps {
  product: {
    id: string
    title: string
    price: number
    sale_price?: number | null
    slug: string
    images: { image_url: string }[]
    category?: { name: string; slug: string }
    is_new?: boolean
    is_sale?: boolean
    tags?: string[] | null
    description?: string | null
    meta_description?: string | null
    variants?: any[]
    reviews?: { rating: number, is_verified: boolean }[]
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { settings } = useSettings()
  const currency = settings?.currency_code || "USD"
  const symbol = settings?.currency_symbol || "$"

  const mainImage = product.images?.[0]?.image_url || "/placeholder.jpg"
  const hoverImage = product.images?.[1]?.image_url || mainImage

  const currentPrice = product.sale_price || product.price
  const originalPrice = product.price
  const hasSale = !!product.sale_price && product.sale_price < product.price

  const discount = hasSale
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0

  const approvedReviews = product.reviews?.filter(r => r.is_verified !== false) || []
  const reviewCount = approvedReviews.length
  const avgRating = reviewCount > 0 
    ? Math.round(approvedReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviewCount)
    : 5

  return (
    <div className="group relative flex flex-col animate-in fade-in duration-500">
      {/* Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-square overflow-hidden bg-zinc-50"
      >
        {/* Badges */}
        <div className="absolute left-0 top-0 z-10 flex flex-col items-start gap-1">
          {product.tags?.filter(t => t.startsWith("badge:")).map(tag => (
            <span key={tag} className="bg-[#004236] px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
              {tag.replace("badge:", "")}
            </span>
          ))}
          {product.tags?.filter(t => t.startsWith("combo_badge:")).map(tag => (
            <span key={tag} className="bg-[#b91c1c] px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
              {tag.replace("combo_badge:", "")}
            </span>
          ))}
        </div>
        <div className="absolute right-0 top-0 z-10 flex">
          {product.is_new && (
            <span className="bg-[#C5A059] px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
              NEW LAUNCH
            </span>
          )}
        </div>
        {/* Wishlist Button */}
        <button className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white opacity-0 shadow-premium transition-all duration-500 hover:bg-accent hover:text-white group-hover:opacity-100">
          <Heart className="h-4 w-4" />
        </button>

        {/* Images */}
        <img
          src={mainImage}
          alt={product.title}
          className="absolute inset-0 h-full w-full object-cover transition-all duration-1000 group-hover:scale-110"
        />
        <img
          src={hoverImage}
          alt={product.title}
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-0 transition-all duration-1000 group-hover:scale-100 group-hover:opacity-100"
        />
      </Link>

      {/* Info Container */}
      <div className="mt-3 flex flex-col items-start text-left w-full">
        {/* Name */}
        <Link href={`/products/${product.slug}`} className="group/link w-full">
          <h3 className="font-sans text-lg md:text-[19px] font-bold text-zinc-900 line-clamp-2 leading-snug group-hover/link:text-black transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Rating Section */}
        <div className="flex items-center gap-1 mt-1.5 text-xs text-zinc-500">
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={cn("h-4 w-4", i <= avgRating ? "fill-current text-yellow-400" : "text-zinc-300")} />
            ))}
          </div>
          <span className="font-medium ml-1 text-sm">({reviewCount})</span>
        </div>

        {/* Mini Description */}
        <p className="mt-2 text-[13px] text-zinc-500 line-clamp-1 truncate w-full">
          {product.meta_description || "\u00A0"}
        </p>

        {/* Optional Gift Badge */}
        {product.tags?.some(t => t.toLowerCase() === "gift with purchase*") && (
          <div className="mt-2 bg-[#d4c852] text-black text-[11px] font-bold px-2 py-0.5">
            Gift with Purchase*
          </div>
        )}


        {/* Price */}
        <div className="mt-1 flex items-center font-sans">
          <span className="text-[22px] font-extrabold text-black">
            ₹{currentPrice.toFixed(0)}
          </span>
          {hasSale && (
            <span className="ml-2 text-[14px] text-zinc-400 line-through font-medium">
              ₹{originalPrice.toFixed(0)}
            </span>
          )}
        </div>

        {/* Add to Bag Button */}
        <button className="mt-3 w-full bg-black hover:bg-zinc-900 text-white py-3 px-4 font-bold text-[14px] transition-colors rounded-sm shadow-sm active:scale-[0.98]">
          Add to Bag
        </button>
      </div>
    </div>
  )
}
