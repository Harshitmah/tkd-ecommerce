"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, ArrowRight } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { useSettings } from "@/hooks/useSettings"
import { useRouter } from "next/navigation"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const supabase = createClient()

// Helper functions for AI-like fuzzy search and spelling mismatch handling
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length
  const n = s2.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }
  return dp[m][n]
}

function characterOverlapRatio(s1: string, s2: string): number {
  const set1 = new Set(s1)
  const set2 = new Set(s2)
  let intersection = 0
  for (const char of set1) {
    if (set2.has(char)) {
      intersection++
    }
  }
  const union = new Set([...set1, ...set2]).size
  return union > 0 ? intersection / union : 0
}

function fuzzyScore(source: string, target: string): number {
  source = source.toLowerCase().trim()
  target = target.toLowerCase().trim()

  if (target.includes(source)) {
    return 100 - (target.indexOf(source) * 0.1)
  }

  const lev = levenshteinDistance(source, target)
  if (lev <= 2 && target.length > 3) {
    return 70 - lev * 10
  }

  const overlap = characterOverlapRatio(source, target)
  if (overlap > 0.8 && Math.abs(source.length - target.length) <= 3) {
    return 60 * overlap
  }

  return 0
}

function scoreProduct(product: any, query: string): number {
  const title = (product.title || "").toLowerCase()
  const description = (product.description || "").toLowerCase()
  const categoryName = (product.category?.name || "").toLowerCase()
  const cleanQuery = query.toLowerCase().trim()

  // 1. Exact or substring match in Title gets highest score
  if (title.includes(cleanQuery)) {
    return 1000 - title.indexOf(cleanQuery)
  }

  // 2. Fuzzy match inside Title words
  let maxTitleFuzzy = 0
  const titleWords = title.split(/\s+/)
  const queryWords = cleanQuery.split(/\s+/)

  for (const qw of queryWords) {
    for (const tw of titleWords) {
      const score = fuzzyScore(qw, tw)
      if (score > maxTitleFuzzy) {
        maxTitleFuzzy = score
      }
    }
  }

  if (maxTitleFuzzy > 30) {
    return maxTitleFuzzy * 5
  }

  // 3. Match inside Description text (supports searching descriptions / details)
  if (description.includes(cleanQuery)) {
    return 200
  }

  // 4. Intersection word match inside description
  let descWordMatch = false
  for (const qw of queryWords) {
    if (description.includes(qw)) {
      descWordMatch = true
    }
  }
  if (descWordMatch) {
    return 150
  }

  // 5. Category matches
  if (categoryName.includes(cleanQuery)) {
    return 100
  }

  return 0
}

  const { settings } = useSettings()

  React.useEffect(() => {
    if (!isOpen) {
      setQuery("")
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const { data: products, error } = await supabase
          .from("products")
          .select("*, category:categories(name), images:product_images(image_url)")
          .eq("status", "active")

        if (error) throw error

        if (products) {
          const scored = products
            .map(p => ({
              product: p,
              score: scoreProduct(p, query)
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.product)
            .slice(0, 5)

          setResults(scored)
        }
      } catch (err) {
        console.error("Search error:", err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, isOpen])

  // Close on Escape key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-white"
        >
          {/* Header */}
          <div className="flex h-20 items-center justify-between border-b border-black/5 px-6 md:px-16">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                if (query.trim()) {
                  onClose()
                  router.push(`/products?q=${encodeURIComponent(query.trim())}`)
                }
              }}
              className="flex flex-1 items-center gap-4"
            >
              <Search className="h-6 w-6 text-zinc-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search products, collections, styles..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-xl font-medium outline-none placeholder:text-zinc-300 md:text-2xl"
              />
            </form>
            <button
              onClick={onClose}
              className="ml-4 flex h-12 w-12 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-6 py-12 md:px-16">
            <div className="mx-auto max-w-4xl">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Results ({results.length})
                  </h3>
                  <div className="grid gap-8">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="group flex items-center gap-6"
                      >
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-secondary-bg md:h-24 md:w-24">
                          <img
                            src={product.images?.[0]?.image_url || "/placeholder.jpg"}
                            alt={product.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                            {product.category?.name}
                          </span>
                          <h4 className="mt-1 text-lg font-bold md:text-xl">{product.title}</h4>
                          <p className="mt-1 text-sm font-medium">
                            {formatCurrency(
                              product.sale_price || product.price,
                              settings?.currency_code || "INR",
                              settings?.currency_symbol || "₹"
                            )}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 -translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : query.length >= 2 ? (
                <div className="py-20 text-center">
                  <p className="text-xl text-zinc-400">No results found for &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                <div className="space-y-10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Popular Searches
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {["Premium Watch", "Minimalist Tote", "Silk Scarf", "Linen Shirt"].map((item) => (
                      <button
                        key={item}
                        onClick={() => setQuery(item)}
                        className="rounded-full border border-black/10 px-6 py-2 text-sm font-medium hover:border-accent hover:text-accent transition-all"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
