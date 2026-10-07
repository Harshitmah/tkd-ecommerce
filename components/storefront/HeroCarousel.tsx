"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeroSlide {
  id: string
  image_url: string
  mobile_image_url?: string
  heading?: string
  subheading?: string
  cta_text?: string
  cta_link?: string
}

interface HeroCarouselProps {
  slides: HeroSlide[]
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isHovered, setIsHovered] = React.useState(false)

  React.useEffect(() => {
    if (slides.length <= 1 || isHovered) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [slides.length, isHovered])

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)

  if (!slides || slides.length === 0) {
    return null
  }

  return (
    <section 
      className="w-full bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden group">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full"
          >
            {slides[currentIndex].cta_link ? (
              <Link href={slides[currentIndex].cta_link} className="absolute inset-0 h-full w-full block">
                <picture className="absolute inset-0 h-full w-full">
                  {slides[currentIndex].mobile_image_url && (
                    <source media="(max-width: 768px)" srcSet={slides[currentIndex].mobile_image_url} />
                  )}
                  <img
                    src={slides[currentIndex].image_url}
                    alt="Banner"
                    className="h-full w-full object-cover"
                  />
                </picture>
              </Link>
            ) : (
              <picture className="absolute inset-0 h-full w-full">
                {slides[currentIndex].mobile_image_url && (
                  <source media="(max-width: 768px)" srcSet={slides[currentIndex].mobile_image_url} />
                )}
                <img
                  src={slides[currentIndex].image_url}
                  alt="Banner"
                  className="h-full w-full object-cover"
                />
              </picture>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Rectangle Pagination */}
        {slides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "transition-all duration-300 h-1",
                  currentIndex === idx 
                    ? "bg-white w-12" 
                    : "bg-white/50 hover:bg-white/80 w-6"
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
