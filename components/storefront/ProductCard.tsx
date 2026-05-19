"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag, Heart, Eye } from "lucide-react"
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
        className="relative aspect-[3/4] overflow-hidden bg-zinc-50 border border-black/[0.03]"
      >
        {/* Badges */}
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          {product.is_new && (
            <span className="bg-black px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-white">
              New Arrival
            </span>
          )}
          {discount > 0 && (
            <span className="bg-accent px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-white">
              -{discount}%
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
      <div className="mt-6 flex flex-col items-center text-center">
        {product.category && (
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent mb-2">
            {product.category.name}
          </span>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-serif text-base font-bold tracking-tight text-primary-text transition-colors hover:text-accent">
            {product.title}
          </h3>
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-bold text-black">
            {formatCurrency(currentPrice, currency, symbol)}
          </span>
          {hasSale && (
            <span className="text-xs text-zinc-400 line-through">
              {formatCurrency(originalPrice, currency, symbol)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
