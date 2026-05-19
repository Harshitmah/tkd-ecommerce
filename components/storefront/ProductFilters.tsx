"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, SlidersHorizontal, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductFiltersProps {
  categories: Category[]
  activeCategory?: string
  activeSort?: string
  activeMinPrice?: string
  activeMaxPrice?: string
}

export function ProductFilters({
  categories,
  activeCategory,
  activeSort = "newest",
  activeMinPrice = "",
  activeMaxPrice = "",
}: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isSortOpen, setIsSortOpen] = React.useState(false)
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  
  // Price inputs state
  const [minPrice, setMinPrice] = React.useState(activeMinPrice)
  const [maxPrice, setMaxPrice] = React.useState(activeMaxPrice)

  // Sync state with url parameters
  React.useEffect(() => {
    setMinPrice(activeMinPrice)
    setMaxPrice(activeMaxPrice)
  }, [activeMinPrice, activeMaxPrice])

  const sortOptions = [
    { name: "Newest Arrivals", value: "newest" },
    { name: "Price: Low to High", value: "price-low" },
    { name: "Price: High to Low", value: "price-high" },
  ]

  const currentSortLabel = sortOptions.find(o => o.value === activeSort)?.name || "Newest Arrivals"

  // Helper to build URLs with new parameters
  const updateQueries = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleSortSelect = (value: string) => {
    updateQueries({ sort: value })
    setIsSortOpen(false)
  }

  const handleCategorySelect = (slug: string | null) => {
    updateQueries({ category: slug })
    setIsFilterOpen(false)
  }

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault()
    updateQueries({
      minPrice: minPrice,
      maxPrice: maxPrice,
    })
    setIsFilterOpen(false)
  }

  const handleClearAll = () => {
    setMinPrice("")
    setMaxPrice("")
    router.push(pathname, { scroll: false })
    setIsFilterOpen(false)
  }

  return (
    <div className="relative flex items-center gap-4">
      {/* 1. Interactive Filter Button */}
      <button
        onClick={() => setIsFilterOpen(true)}
        className="flex h-10 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-[11px] font-extrabold uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white hover:border-black active:scale-95 cursor-pointer shadow-xs"
      >
        <Filter className="mr-2 h-3.5 w-3.5 stroke-[2.5]" />
        Filter
      </button>

      <div className="h-6 w-[1px] bg-black/10" />

      {/* 2. Interactive Sort Button */}
      <div className="relative">
        <button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className={cn(
            "flex h-10 items-center justify-center rounded-full border bg-white px-5 text-[11px] font-extrabold uppercase tracking-widest text-black transition-all active:scale-95 cursor-pointer shadow-xs",
            isSortOpen ? "border-black bg-zinc-50" : "border-black/10 hover:border-black"
          )}
        >
          <SlidersHorizontal className="mr-2 h-3.5 w-3.5 stroke-[2.5]" />
          Sort: {currentSortLabel.split(":")[0]}
        </button>

        {/* Sort Floating Dropdown Popover */}
        <AnimatePresence>
          {isSortOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-2 z-50 w-56 origin-top-right rounded-2xl bg-white p-2 shadow-2xl border border-black/5 text-left"
              >
                <div className="flex flex-col gap-0.5">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSortSelect(opt.value)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider transition-all text-left cursor-pointer",
                        activeSort === opt.value
                          ? "bg-black text-white"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                      )}
                    >
                      {opt.name}
                      {activeSort === opt.value && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Sliding Filter Drawer (Mobile & Tablet overlay, rich styling) */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed bottom-0 right-0 top-0 z-[10000] flex w-[320px] flex-col bg-white p-8 shadow-2xl text-left justify-between border-l border-black/5"
            >
              <div className="flex flex-col gap-8 overflow-y-auto pr-2">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/5">
                  <span className="font-serif text-lg font-extrabold tracking-tight text-black uppercase">
                    Refine Shop
                  </span>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-50 text-black cursor-pointer transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Categories Selector */}
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">
                    Filter by Category
                  </span>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleCategorySelect(null)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-left transition-all cursor-pointer border",
                        !activeCategory
                          ? "bg-black text-white border-black"
                          : "border-black/5 text-zinc-500 hover:border-black/20 hover:text-black"
                      )}
                    >
                      All Products
                      {!activeCategory && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.slug)}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-left transition-all cursor-pointer border",
                          activeCategory === cat.slug
                            ? "bg-black text-white border-black"
                            : "border-black/5 text-zinc-500 hover:border-black/20 hover:text-black"
                        )}
                      >
                        {cat.name}
                        {activeCategory === cat.slug && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <form onSubmit={handleApplyPrice} className="flex flex-col gap-4">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">
                    Filter by Price Range
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <label className="text-[7px] font-extrabold uppercase tracking-wider text-zinc-400">
                        Min (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="h-10 w-full rounded-xl border border-black/10 px-4 text-xs font-bold text-black focus:border-black focus:outline-hidden"
                      />
                    </div>
                    <div className="text-zinc-300 pt-4">—</div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <label className="text-[7px] font-extrabold uppercase tracking-wider text-zinc-400">
                        Max (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="h-10 w-full rounded-xl border border-black/10 px-4 text-xs font-bold text-black focus:border-black focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="mt-2 h-10 w-full rounded-xl bg-black text-[10px] font-extrabold uppercase tracking-widest text-white transition-all hover:bg-zinc-900 cursor-pointer"
                  >
                    Apply Price Filter
                  </button>
                </form>
              </div>

              {/* Drawer Footer Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-black/5">
                <button
                  onClick={handleClearAll}
                  className="h-10 w-full rounded-xl border border-black/15 text-[10px] font-extrabold uppercase tracking-widest text-zinc-600 hover:text-black hover:border-black transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
