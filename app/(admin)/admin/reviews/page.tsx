"use client"

import * as React from "react"
import { Plus, Search, Edit, Trash2, Star, Loader2, Award, Clock, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { 
  getStorefrontReviews, 
  createStorefrontReview, 
  updateStorefrontReview, 
  deleteStorefrontReview,
  getAllProductReviews
} from "@/app/actions/reviews"

type Review = {
  id: string
  rating: number
  title: string // Reviewer name
  body: string
  is_verified: boolean
  created_at: string
  product_id?: string | null
  product?: {
    title: string
    slug: string
  } | null
}

export default function ReviewsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""

  const [reviews, setReviews] = React.useState<Review[]>([])
  const [productReviews, setProductReviews] = React.useState<Review[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState(q)

  React.useEffect(() => {
    setSearch(q)
  }, [q])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set("q", val)
    } else {
      params.delete("q")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingReview, setEditingReview] = React.useState<Partial<Review> | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"storefront" | "product">("storefront")

  // Multi-select / Bulk operations state
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = (visibleItems: Review[]) => {
    const visibleIds = visibleItems.map(item => item.id)
    const allSelected = visibleIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handleBulkDelete = async () => {
    const label = activeTab === "storefront" ? "testimonials" : "product reviews"
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected ${label}?`)) return
    
    try {
      for (const id of selectedIds) {
        await deleteStorefrontReview(id)
      }
      await fetchReviews()
      setSelectedIds([])
    } catch (err: any) {
      alert(`Error deleting ${label}: ` + err.message)
    }
  }

  const handleBulkVerifyStatus = async (status: boolean) => {
    try {
      const supabase = createClient()
      for (const id of selectedIds) {
        if (activeTab === "storefront") {
          const item = reviews.find(r => r.id === id)
          if (item) {
            await updateStorefrontReview(id, {
              reviewerName: item.title,
              rating: item.rating,
              body: item.body,
              isVerified: status
            })
          }
        } else {
          await supabase.from("reviews").update({ is_verified: status }).eq("id", id)
        }
      }
      await fetchReviews()
      setSelectedIds([])
    } catch (err: any) {
      alert("Error updating status: " + err.message)
    }
  }

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const storefrontData = await getStorefrontReviews()
      setReviews((storefrontData as any) || [])

      const productData = await getAllProductReviews()
      setProductReviews((productData as any) || [])
    } catch (err) {
      console.error("Failed to load reviews:", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchReviews()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReview?.title || !editingReview.body || !editingReview.rating) {
      alert("Please fill out all required fields.")
      return
    }

    setIsSaving(true)
    try {
      if (activeTab === "storefront") {
        const payload = {
          reviewerName: editingReview.title,
          rating: editingReview.rating,
          body: editingReview.body,
          isVerified: !!editingReview.is_verified,
        }

        let res
        if (editingReview.id) {
          res = await updateStorefrontReview(editingReview.id, payload)
        } else {
          res = await createStorefrontReview(payload)
        }

        if (res.success) {
          setIsModalOpen(false)
          await fetchReviews()
        } else {
          alert("Error saving testimonial: " + res.error)
        }
      } else {
        // Product review save/update
        const supabase = createClient()
        const payload = {
          title: editingReview.title,
          rating: editingReview.rating,
          body: editingReview.body,
          is_verified: !!editingReview.is_verified,
        }

        let error
        if (editingReview.id) {
          const { error: err } = await supabase
            .from("reviews")
            .update(payload)
            .eq("id", editingReview.id)
          error = err
        }

        if (!error) {
          setIsModalOpen(false)
          await fetchReviews()
        } else {
          alert("Error saving review: " + error.message)
        }
      }
    } catch (err: any) {
      alert("Error saving review: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const label = activeTab === "storefront" ? "storefront testimonial" : "product review"
    if (!confirm(`Are you sure you want to delete this ${label}?`)) return
    try {
      const res = await deleteStorefrontReview(id)
      if (res.success) {
        await fetchReviews()
      } else {
        alert(`Error deleting ${label}: ` + res.error)
      }
    } catch (err: any) {
      alert(`Error deleting ${label}: ` + err.message)
    }
  }

  const filteredStorefront = reviews.filter(r => 
    r.title?.toLowerCase().includes(search.toLowerCase()) || 
    r.body?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredProduct = productReviews.filter(r => 
    r.title?.toLowerCase().includes(search.toLowerCase()) || 
    r.body?.toLowerCase().includes(search.toLowerCase()) ||
    r.product?.title?.toLowerCase().includes(search.toLowerCase())
  )

  const visibleReviews = activeTab === "storefront" ? filteredStorefront : filteredProduct

  const openAddModal = () => {
    setEditingReview({
      title: "",
      rating: 5,
      body: "",
      is_verified: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (review: Review) => {
    setEditingReview(review)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black font-serif">Customer Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">Manage client reviews and storefront testimonials.</p>
        </div>
        {activeTab === "storefront" && (
          <div className="flex items-center gap-3">
            <Button onClick={openAddModal} variant="primary" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Testimonial
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => {
            setActiveTab("storefront")
            setSelectedIds([])
            handleSearchChange("")
          }}
          className={cn(
            "pb-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 px-1",
            activeTab === "storefront"
              ? "border-black text-black"
              : "border-transparent text-gray-400 hover:text-black"
          )}
        >
          Storefront Testimonials
        </button>
        <button
          onClick={() => {
            setActiveTab("product")
            setSelectedIds([])
            handleSearchChange("")
          }}
          className={cn(
            "pb-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 px-1",
            activeTab === "product"
              ? "border-black text-black"
              : "border-transparent text-gray-400 hover:text-black"
          )}
        >
          Product Reviews
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder={activeTab === "storefront" ? "Search testimonials by author or content..." : "Search by product, reviewer or content..."}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-white focus:border-gray-200 transition-all placeholder:text-gray-400 text-black font-semibold"
          />
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
            <span className="text-sm font-bold text-black uppercase tracking-wider">{selectedIds.length} items selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => handleBulkVerifyStatus(true)}
              className="px-4 py-2 bg-white border border-zinc-250 hover:bg-zinc-50 text-xs font-bold uppercase tracking-wider text-black rounded-2xl transition-all"
            >
              Verify Selected
            </button>
            <button 
              onClick={() => handleBulkVerifyStatus(false)}
              className="px-4 py-2 bg-white border border-zinc-250 hover:bg-zinc-50 text-xs font-bold uppercase tracking-wider text-black rounded-2xl transition-all"
            >
              Unverify Selected
            </button>
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold uppercase tracking-wider text-red-600 rounded-2xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <th className="px-8 py-5 w-[5%]">
                <input
                  type="checkbox"
                  checked={visibleReviews.length > 0 && visibleReviews.every(r => selectedIds.includes(r.id))}
                  onChange={() => toggleSelectAll(visibleReviews)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer accent-black"
                />
              </th>
              {activeTab === "product" && <th className="px-8 py-5 w-[20%]">Product</th>}
              <th className="px-8 py-5 w-[20%]">Reviewer</th>
              <th className="px-8 py-5 w-[15%]">Rating</th>
              <th className="px-8 py-5 w-[35%]">Review Detail</th>
              <th className="px-8 py-5 w-[10%]">Verification</th>
              <th className="px-8 py-5 text-right pr-12 w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={activeTab === "product" ? 7 : 6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading data...</p>
                  </div>
                </td>
              </tr>
            ) : visibleReviews.length === 0 ? (
              <tr>
                <td colSpan={activeTab === "product" ? 7 : 6} className="px-8 py-20 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No reviews found</p>
                </td>
              </tr>
            ) : (
              visibleReviews.map((review) => (
                <tr key={review.id} className={cn("group hover:bg-gray-50/50 transition-colors", selectedIds.includes(review.id) && "bg-gray-50")}>
                  <td className="px-8 py-6">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(review.id)}
                      onChange={() => toggleSelect(review.id)}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer accent-black"
                    />
                  </td>
                  {activeTab === "product" && (
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-sm text-black">{review.product?.title || "Unknown Product"}</p>
                        {review.product?.slug && (
                          <Link 
                            href={`/products/${review.product.slug}`}
                            target="_blank"
                            className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-1"
                          >
                            View Product ↗
                          </Link>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-sm text-black">{review.title || "Anonymous"}</p>
                      <span className="flex items-center gap-1 text-[9px] text-gray-400 uppercase tracking-widest font-semibold">
                        <Clock className="h-3 w-3" />
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "h-3.5 w-3.5",
                            i < review.rating ? "fill-black text-black" : "text-gray-200"
                          )} 
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-zinc-600 font-medium leading-relaxed line-clamp-3">
                      "{review.body}"
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    {review.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-extrabold uppercase tracking-widest border border-emerald-100">
                        <Award className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-50 text-zinc-500 text-[9px] font-extrabold uppercase tracking-widest border border-zinc-100">
                        Community
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right pr-12">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => openEditModal(review)}
                        className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(review.id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingReview?.id ? "Modify Review" : "Define New Testimonial"}
      >
        <form onSubmit={handleSave} className="space-y-8 py-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Reviewer Name</label>
              <Input 
                value={editingReview?.title || ""}
                onChange={e => setEditingReview(p => ({ ...p, title: e.target.value }))}
                placeholder="E.G. Ananya Sharma"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Rating Stars</label>
              <select 
                value={editingReview?.rating || 5}
                onChange={e => setEditingReview(p => ({ ...p, rating: parseInt(e.target.value) }))}
                className="w-full rounded-none border-b border-gray-100 bg-transparent py-4 text-sm outline-none focus:border-black transition-all appearance-none text-black font-semibold"
                required
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                <option value={3}>⭐⭐⭐ (3 Stars)</option>
                <option value={2}>⭐⭐ (2 Stars)</option>
                <option value={1}>⭐ (1 Star)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Verification Status</label>
            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <input
                type="checkbox"
                id="is_verified"
                checked={!!editingReview?.is_verified}
                onChange={e => setEditingReview(p => ({ ...p, is_verified: e.target.checked }))}
                className="h-4.5 w-4.5 rounded-lg border-gray-200 text-black focus:ring-black accent-black cursor-pointer"
              />
              <label htmlFor="is_verified" className="text-xs font-semibold text-black cursor-pointer select-none">
                Mark as "Verified Collector" (Recommended for official reviews)
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Review Body</label>
            <textarea 
              rows={4}
              value={editingReview?.body || ""}
              onChange={e => setEditingReview(p => ({ ...p, body: e.target.value }))}
              className="w-full bg-transparent border-b border-gray-100 py-4 text-sm outline-none focus:border-black transition-all resize-none placeholder:text-gray-300 text-black font-semibold"
              placeholder="The purity of Telkidukan oils is unmatched..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving} className="px-10">
              {isSaving ? "Saving..." : editingReview?.id ? "Update Review" : "Create Testimonial"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

