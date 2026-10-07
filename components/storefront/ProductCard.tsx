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

  return (
    <div className="group relative flex flex-col animate-in fade-in duration-500">
      {/* Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-square overflow-hidden bg-zinc-50"
      >
        {/* Badges */}
        <div className="absolute left-0 top-0 z-10 flex flex-col items-start gap-1">
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
          className="absolute inset-0 h-full w-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:opacity-0"
        />
        <img
          src={hoverImage}
          alt={product.title}
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-0 transition-all duration-1000 group-hover:scale-100 group-hover:opacity-100"
        />

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-accent p-4 transition-transform duration-500 group-hover:translate-y-0">
          <button className="flex w-full items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </button>
        </div>
      </Link>

      {/* Info Container */}
      <div className="mt-3 flex flex-col items-start text-left">
        {/* Mock Reviews Section */}
        <div className="flex items-center gap-1 mb-1.5 text-xs text-zinc-500">
          <Star className="h-3.5 w-3.5 fill-[#fbbf24] text-[#fbbf24]" />
          <span className="font-medium text-zinc-800">4.8</span>
          <span className="text-blue-500 mx-0.5" title="Verified">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"></path>
            </svg>
          </span>
          <span className="ml-1">(341 Reviews)</span>
        </div>

        <Link href={`/products/${product.slug}`} className="group/link w-full">
          <h3 className="font-sans text-[13px] md:text-sm font-medium text-black line-clamp-2 leading-snug group-hover/link:underline decoration-1 underline-offset-2">
            {product.title}
          </h3>
        </Link>

        <div className="mt-2.5 flex items-center gap-2 font-sans">
          {hasSale ? (
            <>
              <span className="text-xs md:text-[13px] text-zinc-500 line-through">
                Rs. {originalPrice.toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-red-600">
                From Rs. {currentPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-red-600">
              Rs. {currentPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
