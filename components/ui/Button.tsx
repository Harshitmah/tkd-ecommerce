"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "gold"
  size?: "sm" | "md" | "lg" | "icon"
  loading?: boolean
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, ...props }, ref) => {
    const variants = {
      primary: "bg-black text-white hover:bg-zinc-900 transition-all duration-300 shadow-sm",
      secondary: "bg-secondary-bg text-primary-text hover:bg-zinc-200",
      outline: "border-2 border-black bg-transparent text-black hover:bg-black hover:text-white transition-all duration-300",
      ghost: "bg-transparent text-primary-text hover:bg-black/5",
      destructive: "bg-destructive text-white hover:bg-destructive/90",
      gold: "bg-[#C5A059] text-white hover:opacity-90",
    }

    const sizes = {
      sm: "h-12 px-8 text-[11px] uppercase tracking-normal font-bold",
      md: "h-14 px-12 text-[13px] uppercase tracking-normal font-bold",
      lg: "h-18 px-16 text-[15px] uppercase tracking-normal font-bold",
      icon: "h-12 w-12",
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-xl transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        ) : (
          <span className="relative z-10 flex items-center gap-3">{children}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = "Button"

export { Button }
