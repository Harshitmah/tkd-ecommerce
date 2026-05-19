"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-serif text-[120px] font-bold leading-none text-black/5 md:text-[200px]">
          404
        </h1>
        <div className="-mt-12 md:-mt-20">
          <h2 className="text-3xl font-bold md:text-4xl">Page not found</h2>
          <p className="mt-4 text-secondary-text max-w-md mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/" 
              className="relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 bg-accent text-white hover:bg-accent/90 shadow-premium h-14 px-10 text-base"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
            <Button variant="outline" size="lg" className="h-14 px-8" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
