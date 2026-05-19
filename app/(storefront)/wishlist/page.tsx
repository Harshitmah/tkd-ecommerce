"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Trash2, ShoppingBag, ArrowRight, ShoppingCart } from "lucide-react"
import { useWishlist } from "@/hooks/useWishlist"
import { useCart } from "@/hooks/useCart"
import { useSettings } from "@/hooks/useSettings"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist()
  const { addItem, setIsCartOpen } = useCart()
  const { settings } = useSettings()

  const currency = settings?.currency_code || "INR"
  const symbol = settings?.currency_symbol || "₹"

  const handleMoveToCart = (item: any) => {
    addItem({
      id: item.id,
      productId: item.id,
      title: item.title,
      price: item.price,
      quantity: 1,
      image: item.image
    })
    removeFromWishlist(item.id)
    setIsCartOpen(true)
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-16 md:py-20 animate-in fade-in duration-1000">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-8 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-black font-serif flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            My Wishlist
          </h1>
          <p className="mt-2 text-sm text-zinc-500 font-medium">Keep track of your favorite premium Ayurvedic products.</p>
        </div>
        {items.length > 0 && (
          <button 
            onClick={clearWishlist}
            className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-red-500 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Main Wishlist Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-[32px]">
          <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
            <Heart className="h-6 w-6 text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold text-black font-serif">Your Wishlist is Empty</h2>
          <p className="mt-2 text-sm text-zinc-400 font-medium max-w-sm text-center">
            Save items you love here to easily purchase them or share them with family later.
          </p>
          <Link href="/products" className="mt-8">
            <Button variant="primary" className="px-8 py-4 rounded-xl">
              Explore Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item) => (
            <div 
              key={item.id}
              className="group relative flex flex-col bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Product Image Wrapper */}
              <div className="relative aspect-square w-full bg-zinc-50 overflow-hidden">
                <Image 
                  src={item.image || "/placeholder.jpg"} 
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Instant Remove Circle Button */}
                <button 
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-white hover:scale-110 shadow-sm transition-all duration-200"
                  aria-label="Remove from Wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-1">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  {item.categoryName || "Premium Oil"}
                </span>
                <Link href={`/products/${item.slug}`} className="mt-1">
                  <h3 className="font-serif font-bold text-base text-black hover:text-zinc-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                </Link>
                <p className="mt-2 font-bold text-sm text-black">
                  {formatCurrency(item.price, currency, symbol)}
                </p>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-zinc-100 flex gap-3">
                  <Link href={`/products/${item.slug}`} className="flex-1">
                    <button className="w-full py-3 border border-zinc-200 hover:border-black text-xs font-bold uppercase tracking-wider text-black rounded-xl transition-all text-center">
                      View Details
                    </button>
                  </Link>
                  <button 
                    onClick={() => handleMoveToCart(item)}
                    className="h-10 w-10 shrink-0 bg-black hover:bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
                    title="Move to Bag"
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
