"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { Button } from "@/components/ui/Button"
import { formatCurrency, cn } from "@/lib/utils"
import { useSettings } from "@/hooks/useSettings"

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, subtotal } = useCart()
  const { settings } = useSettings()

  const currency = settings?.currency_code || "USD"
  const symbol = settings?.currency_symbol || "$"

  // Prevent scroll when drawer is open
  React.useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isCartOpen])

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative flex h-full w-full max-w-md flex-col bg-white shadow-premium"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-6">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary-bg">
                    <ShoppingBag className="h-10 w-10 text-secondary-text" />
                  </div>
                  <h3 className="text-lg font-medium">Your cart is empty</h3>
                  <p className="mt-2 text-sm text-secondary-text">
                    Looks like you haven&apos;t added anything yet.
                  </p>
                  <Button
                    variant="primary"
                    className="mt-8"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {items.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      key={item.id}
                      className="flex gap-4"
                    >
                      <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-secondary-bg">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between py-1">
                        <div>
                          <div className="flex items-start justify-between">
                            <h3 className="text-sm font-semibold">{item.title}</h3>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-secondary-text hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {item.variantInfo && (
                            <p className="mt-1 text-xs text-secondary-text">
                              {Object.values(item.variantInfo).join(" / ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-black/5 px-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:text-accent transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[2rem] text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:text-accent transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-bold">
                            {formatCurrency(item.price * item.quantity, currency, symbol)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-black/5 bg-zinc-50/50 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-text">Subtotal</span>
                  <span className="text-xl font-bold">{formatCurrency(subtotal, currency, symbol)}</span>
                </div>
                <Link href="/checkout" onClick={() => setIsCartOpen(false)}>
                  <Button variant="primary" className="w-full h-14 text-base">
                    Checkout
                  </Button>
                </Link>
                <p className="mt-4 text-center text-xs text-secondary-text">
                  Shipping and taxes calculated at checkout.
                </p>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
