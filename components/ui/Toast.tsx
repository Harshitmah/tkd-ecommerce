"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "info"

interface ToastProps {
  id: string
  message: string
  type?: ToastType
  onClose: (id: string) => void
}

export function Toast({ id, message, type = "success", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose(id), 3000)
    return () => clearTimeout(timer)
  }, [id, onClose])

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
    info: <AlertCircle className="h-5 w-5 text-accent" />,
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="pointer-events-auto relative flex w-80 items-center gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-premium border border-black/5"
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-medium text-primary-text">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="text-secondary-text hover:text-primary-text transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress Bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 3, ease: "linear" }}
        className={cn(
          "absolute bottom-0 left-0 h-1 w-full origin-left",
          type === "success" && "bg-success",
          type === "error" && "bg-destructive",
          type === "info" && "bg-accent"
        )}
      />
    </motion.div>
  )
}

// Simple Toast Provider/Container
export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: { id: string; message: string; type?: ToastType }[]
  onClose: (id: string) => void
}) {
  return (
    <div className="fixed right-6 top-6 z-[100] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}
