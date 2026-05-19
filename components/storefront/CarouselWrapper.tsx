"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CarouselWrapperProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function CarouselWrapper({ title, subtitle, children }: CarouselWrapperProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.75
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="w-full">
      {/* Carousel Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1 text-left min-w-0">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">
            {subtitle}
          </span>
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-black uppercase leading-tight">
            {title}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black transition-all hover:bg-black hover:text-white active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 stroke-[2]" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black transition-all hover:bg-black hover:text-white active:scale-95 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="hide-scrollbar flex overflow-x-auto snap-x snap-mandatory gap-6 scroll-smooth pb-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>
    </div>
  )
}
