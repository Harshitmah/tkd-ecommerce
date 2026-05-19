"use client"

import * as React from "react"
import { AuthProvider } from "@/hooks/useAuth"

import { CartProvider } from "@/hooks/useCart"
import { WishlistProvider } from "@/hooks/useWishlist"
import { AnimationProvider } from "@/hooks/useAnimation"
import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { SettingsProvider } from "@/hooks/useSettings"


export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <AnimationProvider>
                <div className="min-h-screen flex flex-col opacity-0">
                  {children}
                </div>
              </AnimationProvider>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <WishlistProvider>
            <AnimationProvider>
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="min-h-screen flex flex-col"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </AnimationProvider>
          </WishlistProvider>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}



