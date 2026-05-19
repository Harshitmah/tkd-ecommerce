"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Review {
  id: string
  rating: number
  title: string // reviewer name
  body: string // review body
  is_verified: boolean
  created_at: string
}

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [windowWidth, setWindowWidth] = React.useState(1024)

  // Listen to window resizing to calculate responsive card layout
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth)
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  // 1 card on mobile, 2 on tablet, 3 on desktop
  const itemsPerSlide = windowWidth < 640 ? 1 : windowWidth < 1024 ? 2 : 3
  const totalSlides = Math.max(0, reviews.length - itemsPerSlide + 1)

  // Auto-scroll loop
  React.useEffect(() => {
    if (totalSlides <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides)
    }, 5000) // Slide every 5 seconds
    return () => clearInterval(interval)
  }, [totalSlides, reviews.length])

  // Reset index if size changes itemsPerSlide
  React.useEffect(() => {
    if (currentIndex >= totalSlides && totalSlides > 0) {
      setCurrentIndex(totalSlides - 1)
    }
  }, [totalSlides, currentIndex])

  if (!reviews || reviews.length === 0) return null

  return (
    <div className="w-full overflow-hidden py-4">
      {/* Cards Viewport Container */}
      <div className="relative overflow-hidden w-full px-1">
        <div
          className="flex transition-transform duration-1000 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerSlide)}%)`,
          }}
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className="shrink-0 px-3 transition-all duration-500"
              style={{ width: `${100 / itemsPerSlide}%` }}
            >
              <div className="h-full flex flex-col justify-between p-8 border border-black/5 bg-zinc-50/30 hover:bg-white hover:shadow-premium rounded-[24px] space-y-4 transition-all duration-500 min-h-[220px]">
                <div className="space-y-4">
                  {/* Stars Row */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < review.rating ? "fill-black text-black" : "text-zinc-200"
                        )}
                      />
                    ))}
                  </div>

                  {/* Body Text */}
                  <p className="text-xs italic leading-relaxed text-zinc-600 font-medium line-clamp-4">
                    "{review.body}"
                  </p>
                </div>

                {/* Reviewer Meta */}
                <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-black">
                      {review.title || "Anonymous"}
                    </h5>
                    <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold mt-1">
                      {review.is_verified ? "Verified Collector" : "Community Reviewer"}
                    </p>
                  </div>
                  <span className="text-[8px] font-extrabold text-zinc-300 uppercase tracking-widest">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots (expanding luxury pills) */}
      {totalSlides > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {[...Array(totalSlides)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500 cursor-pointer",
                currentIndex === idx ? "w-6 bg-black" : "w-1.5 bg-zinc-200 hover:bg-zinc-400"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
