"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Star, MessageSquare, Award, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/hooks/useAuth"
import { createProductReview } from "@/app/actions/reviews"

interface Profile {
  full_name: string
  avatar_url: string | null
}

interface Review {
  id: string
  rating: number
  title: string
  body: string
  is_verified: boolean
  created_at: string
  profile: Profile | null
}

interface ProductReviewsProps {
  productId: string
  productSlug: string
  initialReviews: Review[]
}

export function ProductReviews({ productId, productSlug, initialReviews }: ProductReviewsProps) {
  const router = useRouter()
  const { user, profile } = useAuth()
  
  // Local state for reviews to allow instant updating
  const [reviews, setReviews] = React.useState<Review[]>(initialReviews)
  const [rating, setRating] = React.useState(5)
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showForm, setShowForm] = React.useState(false)

  // Sync with initialReviews if they change on the server
  React.useEffect(() => {
    setReviews(initialReviews)
  }, [initialReviews])

  // Compute dynamic stats
  const reviewsCount = reviews.length
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
  const averageRating = reviewsCount > 0 ? (totalRating / reviewsCount).toFixed(1) : "0.0"

  // Count per star level
  const starCounts = [0, 0, 0, 0, 0] // 1, 2, 3, 4, 5 stars
  reviews.forEach((r) => {
    const starIdx = Math.max(1, Math.min(5, r.rating)) - 1
    starCounts[starIdx]++
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!title.trim() || !body.trim()) {
      alert("Please fill out both review title and description.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createProductReview(productId, user.id, {
        rating,
        title,
        body,
      })

      if (res.success && res.data) {
        // Clear form
        setTitle("")
        setBody("")
        setRating(5)
        setShowForm(false)
        
        // Refresh server component data
        router.refresh()
      } else {
        alert("Error saving review: " + res.error)
      }
    } catch (err: any) {
      alert("Error saving review: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mt-24 border-t border-zinc-100 pt-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Dynamic Reviews Statistics Card (Left 4 cols) */}
        <div className="lg:col-span-4 bg-zinc-50/50 border border-zinc-100 rounded-[32px] p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Evaluations</span>
            <h3 className="text-3xl font-extrabold text-black font-serif">Customer Reviews</h3>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-5xl font-extrabold text-black tracking-tighter">
              {averageRating}
            </div>
            <div className="space-y-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.round(parseFloat(averageRating))
                        ? "fill-black text-black"
                        : "text-zinc-200"
                    )}
                  />
                ))}
              </div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                Based on {reviewsCount} review{reviewsCount !== 1 && "s"}
              </p>
            </div>
          </div>

          {/* Star Rating Breakdown Bars */}
          <div className="space-y-3 pt-4 border-t border-zinc-100">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = starCounts[stars - 1]
              const percentage = reviewsCount > 0 ? (count / reviewsCount) * 100 : 0
              return (
                <div key={stars} className="flex items-center gap-4 text-xs font-bold text-black/80">
                  <span className="w-3 text-right">{stars}</span>
                  <Star className="h-3 w-3 fill-black text-black shrink-0" />
                  <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-zinc-400 text-[10px]">{count}</span>
                </div>
              )
            })}
          </div>

          {/* Review Action Trigger */}
          <div className="pt-4">
            {!showForm && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl border-black text-black hover:bg-black hover:text-white transition-all font-bold text-xs uppercase tracking-widest cursor-pointer"
                onClick={() => setShowForm(true)}
              >
                Write a Review
              </Button>
            )}
          </div>
        </div>

        {/* Reviews List & Write a Review Form (Right 8 cols) */}
        <div className="lg:col-span-8 space-y-12">
          {/* Write a Review Section (Form or Login Prompt) */}
          {showForm && (
            <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-6 shadow-premium animate-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-serif font-extrabold text-black uppercase tracking-tight">
                    Share Your Feedback
                  </h4>
                  <p className="text-xs text-zinc-400 font-semibold mt-1">
                    Your organic wellness experience helps others choose the finest cold-pressed oils.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-xs font-bold text-zinc-400 hover:text-black uppercase tracking-widest cursor-pointer border border-zinc-100 rounded-lg px-2.5 py-1"
                >
                  Cancel
                </button>
              </div>

              {user ? (
                // Form for Logged In Customer
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Interactive Star Picker */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">
                      Overall Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(star)}
                          className="p-1 transition-all transform hover:scale-125 cursor-pointer"
                        >
                          <Star
                            className={cn(
                              "h-7 w-7 transition-colors",
                              star <= (hoverRating ?? rating)
                                ? "fill-black text-black"
                                : "text-zinc-200"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">
                      Review Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="E.G. Outstanding product purity!"
                      className="w-full bg-transparent border-b border-zinc-200 py-3 text-sm outline-none focus:border-black transition-all placeholder:text-zinc-300 text-black font-semibold"
                      required
                    />
                  </div>

                  {/* Review Description */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">
                      Testimonial Details
                    </label>
                    <textarea
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Tell us about the texture, aroma, absorption, or shipping speed..."
                      className="w-full bg-transparent border-b border-zinc-200 py-3 text-sm outline-none focus:border-black transition-all resize-none placeholder:text-zinc-300 text-black font-semibold"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 px-10 rounded-2xl bg-black text-white hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                // Login Redirect Card
                <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-zinc-100 bg-zinc-50/50 text-center space-y-4">
                  <AlertCircle className="h-8 w-8 text-zinc-400" />
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-black uppercase tracking-wider">
                      Authentication Required
                    </h5>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      Only authenticated customers are allowed to submit product reviews to prevent spam and preserve trust.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/login?redirect=/products/${productSlug}`)}
                    className="h-10 px-8 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95"
                  >
                    Log In to Your Account
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* List of Existing Reviews */}
          <div className="space-y-8">
            <h4 className="text-lg font-bold text-black uppercase tracking-wider">
              Testimonials ({reviewsCount})
            </h4>

            {reviewsCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-200 rounded-[32px] text-center space-y-4">
                <MessageSquare className="h-10 w-10 text-zinc-300" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-black uppercase tracking-wider">
                    First to evaluate
                  </p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest max-w-[240px]">
                    Be the first reviewer to evaluate this cold-pressed organic oil!
                  </p>
                </div>
                <Button
                  onClick={() => setShowForm(true)}
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl px-6 border-black text-black hover:bg-black hover:text-white transition-all font-bold text-[10px]"
                >
                  Write First Review
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {reviews.map((review) => {
                  const reviewerName = review.profile?.full_name || "Community Member"
                  const initials = reviewerName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
                  return (
                    <div key={review.id} className="py-8 first:pt-0 last:pb-0 space-y-4">
                      {/* Review Header Meta */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Avatar Circle */}
                          <div className="h-10 w-10 rounded-full bg-zinc-150 flex items-center justify-center border border-zinc-200 shadow-sm overflow-hidden shrink-0">
                            {review.profile?.avatar_url ? (
                              <img
                                src={review.profile.avatar_url}
                                alt={reviewerName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-zinc-500">{initials}</span>
                            )}
                          </div>

                          <div>
                            <h5 className="text-xs font-bold text-black uppercase tracking-wider leading-none">
                              {reviewerName}
                            </h5>
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              <Award className="h-3 w-3 shrink-0" />
                              Verified Buyer
                            </span>
                          </div>
                        </div>

                        {/* Date and Rating */}
                        <div className="text-right space-y-1">
                          <div className="flex justify-end gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-3 w-3",
                                  i < review.rating ? "fill-black text-black" : "text-zinc-200"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mt-1">
                            {new Date(review.created_at).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Review Title & Body */}
                      <div className="pl-14 space-y-2">
                        <h6 className="text-sm font-bold text-black leading-tight uppercase tracking-wide">
                          {review.title}
                        </h6>
                        <p className="text-xs leading-relaxed text-zinc-500 font-medium whitespace-pre-line">
                          {review.body}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
