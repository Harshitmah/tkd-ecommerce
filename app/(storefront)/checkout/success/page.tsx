"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, ShoppingBag, ArrowRight, Package, Calendar, MapPin, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { cancelOrder, fetchOrderById } from "@/app/actions/orders"

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const [order, setOrder] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const supabase = createClient()
  const [currencyCode, setCurrencyCode] = React.useState("USD")
  const [currencySymbol, setCurrencySymbol] = React.useState("$")

  // Cancel order state
  const [cancelling, setCancelling] = React.useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false)
  const [cancelReason, setCancelReason] = React.useState("Change of mind")

  React.useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from("site_settings")
        .select("currency_code, currency_symbol")
        .maybeSingle()
      if (data) {
        if (data.currency_code) setCurrencyCode(data.currency_code)
        if (data.currency_symbol) setCurrencySymbol(data.currency_symbol)
      }
    }
    fetchSettings()
  }, [])

  React.useEffect(() => {
    if (orderId) {
      async function fetchOrder() {
        const res = await fetchOrderById(orderId || "")
        if (res.success && res.data) {
          setOrder(res.data)
        }
        setLoading(false)
      }
      fetchOrder()
    }
  }, [orderId])

  const handleCancelOrder = async () => {
    if (!orderId) return
    setCancelling(true)
    try {
      const res = await cancelOrder(orderId, cancelReason)
      if (res.success) {
        // Fetch order again to update UI using server action
        const fetchRes = await fetchOrderById(orderId)
        if (fetchRes.success && fetchRes.data) {
          setOrder(fetchRes.data)
        }
        setShowCancelConfirm(false)
      } else {
        alert(res.error || "Failed to cancel order.")
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-zinc-100 border-t-black animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Verifying Order...</p>
      </div>
    )
  }

  const isCancelled = order?.fulfillment_status === 'cancelled'

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 lg:py-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8"
      >
        {isCancelled ? (
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-rose-50 text-rose-500 shadow-xl shadow-rose-500/10">
            <X className="h-12 w-12" />
          </div>
        ) : (
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="h-12 w-12" />
          </div>
        )}
        
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-black md:text-5xl">
            {isCancelled ? "Order Cancelled" : "Order Confirmed"}
          </h1>
          <p className="text-lg text-zinc-500 font-medium max-w-md mx-auto">
            {isCancelled ? (
              <>
                Your order <span className="text-black font-bold">#{order?.order_number || "..."}</span> has been cancelled. If you have any questions, please reach out to our team.
              </>
            ) : (
              <>
                Thank you for your purchase. Your order <span className="text-black font-bold">#{order?.order_number || "..."}</span> has been received and is being processed.
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-8">
           <div className="p-8 rounded-[32px] bg-zinc-50 border border-zinc-100 space-y-4">
             <div className="flex items-center gap-3 text-zinc-400">
               <Package className="h-4 w-4" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Order Details</span>
             </div>
             <div className="space-y-2">
               <p className="text-sm font-bold text-black">Total Amount: {formatCurrency(order?.total || 0, currencyCode, currencySymbol)}</p>
               <p className="text-xs text-zinc-500 font-medium">Status: <span className="capitalize">{order?.fulfillment_status}</span></p>
             </div>
           </div>

           <div className="p-8 rounded-[32px] bg-zinc-50 border border-zinc-100 space-y-4">
             <div className="flex items-center gap-3 text-zinc-400">
               <Calendar className="h-4 w-4" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Date</span>
             </div>
             <div className="space-y-2">
               <p className="text-sm font-bold text-black">{new Date(order?.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
               <p className="text-xs text-zinc-500 font-medium">
                 {isCancelled ? "Cancelled" : "Delivery: Est. 3-5 Business Days"}
               </p>
             </div>
           </div>
        </div>

        <div className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full rounded-2xl h-16 px-10 font-bold tracking-widest uppercase text-xs">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/account" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full rounded-2xl h-16 px-10 font-bold tracking-widest uppercase text-xs">
              View Account
            </Button>
          </Link>
          {order?.fulfillment_status === "pending" && !order?.notes?.includes("Cancellation Requested") && (
            <Button 
              variant="outline" 
              onClick={() => setShowCancelConfirm(true)}
              className="w-full sm:w-auto rounded-2xl h-16 px-10 font-bold tracking-widest uppercase text-xs border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 transition-colors"
            >
              Cancel Order
            </Button>
          )}
          {order?.notes?.includes("Cancellation Requested") && order?.fulfillment_status !== "cancelled" && (
            <span className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl h-16 px-10 font-bold tracking-widest uppercase text-xs bg-rose-50 text-rose-600 border border-rose-100">
              Cancellation Pending Approval
            </span>
          )}
        </div>
      </motion.div>

      {/* Cancel Order Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelConfirm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-[32px] border border-zinc-100 bg-white/95 shadow-2xl p-8 z-10 overflow-hidden text-center"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 to-rose-600" />
              
              <button 
                onClick={() => setShowCancelConfirm(false)}
                className="absolute top-6 right-6 h-10 w-10 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black hover:border-black transition-all bg-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-6 mt-4">
                <AlertCircle className="h-8 w-8" />
              </div>

              <h3 className="text-xl font-bold text-black">Cancel Order</h3>
              <p className="text-xs text-zinc-500 mt-2 font-medium leading-relaxed max-w-[280px] mx-auto uppercase tracking-wider">
                Are you sure you want to cancel this order? This action is permanent and cannot be undone.
              </p>

              <div className="mt-6 text-left space-y-2">
                <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                >
                  <option value="Change of mind">Change of mind</option>
                  <option value="Incorrect shipping address">Incorrect shipping address</option>
                  <option value="Ordered duplicate items">Ordered duplicate items</option>
                  <option value="Found better price elsewhere">Found better price elsewhere</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Button 
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full rounded-2xl h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest transition-all"
                >
                  {cancelling ? "Processing..." : "Yes, Cancel Order"}
                </Button>
                <Button 
                  onClick={() => setShowCancelConfirm(false)}
                  variant="outline"
                  className="w-full rounded-2xl h-14 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all"
                >
                  Keep Order
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Loading order summary...</p>
      </div>
    }>
      <SuccessPageContent />
    </React.Suspense>
  )
}

