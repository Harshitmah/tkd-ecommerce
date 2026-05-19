"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: "default" | "pill"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, variant = "default", ...props }, ref) => {
    return (
      <div className="w-full space-y-4 group">
        {label && (
          <label className="text-xs font-bold uppercase tracking-[0.4em] text-zinc-400 ml-1 transition-colors group-focus-within:text-accent">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            className={cn(
              variant === "pill"
                ? "flex h-14 w-full rounded-2xl border-2 border-zinc-100 bg-white px-4 text-sm font-semibold text-black placeholder:text-zinc-300 placeholder:font-medium focus:border-black focus:outline-none transition-all"
                : "flex h-16 w-full rounded-none border-b-2 border-zinc-100 bg-transparent px-1 py-6 text-lg font-bold tracking-tight transition-all placeholder:text-zinc-200 placeholder:font-medium focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-destructive" : "",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs font-bold text-destructive uppercase tracking-widest ml-1 mt-3">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
