"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { verifyOrder } from "@/app/actions/orders"
import { Button } from "@/components/ui/Button"
import { CheckCircle2, Loader2, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react"

export default function VerifyOrderPage() {
  return (
    <React.Suspense fallback={<div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-zinc-400" /></div>}>
      <VerifyOrderContent />
    </React.Suspense>
  )
}

function VerifyOrderContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")

  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = React.useState("")

  React.useEffect(() => {
    async function doVerify() {
      if (!orderId) {
        setStatus("error")
        setErrorMessage("Invalid verification link. Order ID is missing.")
        return
      }

      try {
        const res = await verifyOrder(orderId)
        if (res.success) {
          setStatus("success")
        } else {
          setStatus("error")
          setErrorMessage(res.error || "Failed to verify order.")
        }
      } catch (err: any) {
        setStatus("error")
        setErrorMessage(err.message || "An unexpected error occurred.")
      }
    }

    doVerify()
  }, [orderId])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-20 animate-in fade-in duration-1000">
      <div className="w-full bg-white border border-zinc-100 shadow-2xl rounded-[40px] p-10 md:p-16 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-zinc-50 flex items-center justify-center mb-8 border border-zinc-100">
              <Loader2 className="h-10 w-10 text-black animate-spin" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-black">
              Verifying Order
            </h1>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-zinc-400 leading-relaxed">
              Please wait while we confirm your details.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100 text-emerald-500">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-black">
              Order Confirmed!
            </h1>
            <p className="mt-4 text-sm font-medium text-zinc-500 leading-relaxed max-w-[280px]">
              Thank you for verifying your order. We are now preparing your items for dispatch.
            </p>
            <div className="mt-10 w-full space-y-4">
              <Link href="/account">
                <Button className="w-full h-14 rounded-2xl bg-black text-white hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest">
                  View My Orders
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-2 hover:bg-zinc-50 transition-all font-bold text-xs uppercase tracking-widest text-zinc-600">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="h-24 w-24 rounded-full bg-rose-50 flex items-center justify-center mb-8 border border-rose-100 text-rose-500">
              <AlertCircle className="h-12 w-12" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-black">
              Verification Failed
            </h1>
            <p className="mt-4 text-sm font-medium text-zinc-500 leading-relaxed max-w-[280px]">
              {errorMessage}
            </p>
            <div className="mt-10 w-full space-y-4">
               <Link href="/contact">
                <Button className="w-full h-14 rounded-2xl bg-black text-white hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest">
                  Contact Support
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-2 hover:bg-zinc-50 transition-all font-bold text-xs uppercase tracking-widest text-zinc-600">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
