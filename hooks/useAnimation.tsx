"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

interface FlyingImage {
  id: string
  src: string
  startX: number
  startY: number
}

interface AnimationContextType {
  triggerFly: (src: string, startX: number, startY: number) => void
}

const AnimationContext = React.createContext<AnimationContextType | undefined>(undefined)

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [flyingImages, setFlyingImages] = React.useState<FlyingImage[]>([])

  const triggerFly = (src: string, startX: number, startY: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    setFlyingImages((prev) => [...prev, { id, src, startX, startY }])
    
    // Remove after animation completes
    setTimeout(() => {
      setFlyingImages((prev) => prev.filter((img) => img.id !== id))
    }, 1000)
  }

  return (
    <AnimationContext.Provider value={{ triggerFly }}>
      {children}
      <AnimatePresence>
        {flyingImages.map((img) => (
          <motion.div
            key={img.id}
            initial={{
              position: "fixed",
              top: img.startY,
              left: img.startX,
              width: 100,
              height: 125,
              zIndex: 1000,
              opacity: 1,
              scale: 1,
              borderRadius: "24px",
              overflow: "hidden",
            }}
            animate={{
              top: 20, // Approximate cart icon position (top-right)
              left: "calc(100vw - 80px)",
              width: 20,
              height: 25,
              opacity: 0,
              scale: 0.2,
              rotate: 10,
            }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{ pointerEvents: "none" }}
          >
            <img src={img.src} alt="Flying product" className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </AnimatePresence>
    </AnimationContext.Provider>
  )
}

export const useAnimation = () => {
  const context = React.useContext(AnimationContext)
  if (!context) throw new Error("useAnimation must be used within AnimationProvider")
  return context
}
