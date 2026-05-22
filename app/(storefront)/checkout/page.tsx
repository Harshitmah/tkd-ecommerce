"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, CreditCard, Truck, CheckCircle2, ArrowLeft, ShieldCheck, Tag, Info, Loader2, X } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { formatCurrency, cn } from "@/lib/utils"
import { createRazorpayOrder } from "@/app/actions/razorpay"
import { createClient } from "@/lib/supabase/client"
import { createOrder } from "@/app/actions/orders"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]


declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user, profile, signIn, signUp } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  const [currencyCode, setCurrencyCode] = React.useState("USD")
  const [currencySymbol, setCurrencySymbol] = React.useState("$")
  const [razorpayEnabled, setRazorpayEnabled] = React.useState(true)
  const [codEnabled, setCodEnabled] = React.useState(true)
  const [allowedStatesString, setAllowedStatesString] = React.useState("")

  // Checkout Authentication States
  const [checkoutMode, setCheckoutMode] = React.useState<"signin" | "signup">("signin")
  const [checkoutEmail, setCheckoutEmail] = React.useState("")
  const [checkoutPassword, setCheckoutPassword] = React.useState("")
  const [checkoutFullName, setCheckoutFullName] = React.useState("")
  const [checkoutPhone, setCheckoutPhone] = React.useState("")
  const [checkoutLoading, setCheckoutLoading] = React.useState(false)
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null)

  const handleCheckoutAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      if (checkoutMode === "signin") {
        const { error } = await signIn(checkoutEmail, checkoutPassword)
        if (error) throw error
      } else {
        const { error } = await signUp(checkoutEmail, checkoutPassword, checkoutFullName, checkoutPhone)
        if (error) throw error
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Authentication failed.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  const [standardTaxRate, setStandardTaxRate] = React.useState(18)
  const [taxInclusive, setTaxInclusive] = React.useState(true)
  const [stateTaxOverridesString, setStateTaxOverridesString] = React.useState("")

  React.useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from("site_settings")
        .select("currency_code, currency_symbol, razorpay_enabled, cod_enabled, social_tiktok, tax_rate, tax_inclusive, social_instagram")
        .maybeSingle()
      if (data) {
        if (data.currency_code) setCurrencyCode(data.currency_code)
        if (data.currency_symbol) setCurrencySymbol(data.currency_symbol)
        if (data.social_tiktok !== undefined) setAllowedStatesString(data.social_tiktok || "")
        if (data.tax_rate !== undefined) setStandardTaxRate(data.tax_rate || 0)
        if (data.tax_inclusive !== undefined) setTaxInclusive(!!data.tax_inclusive)
        if (data.social_instagram !== undefined) setStateTaxOverridesString(data.social_instagram || "")
        
        const rpActive = data.razorpay_enabled ?? true
        const codActive = data.cod_enabled ?? true
        setRazorpayEnabled(rpActive)
        setCodEnabled(codActive)
        
        if (!rpActive && codActive) {
          setPaymentMethod("cod")
        } else if (rpActive && !codActive) {
          setPaymentMethod("online")
        }
      }
    }
    fetchSettings()
  }, [])
  
  const [shippingInfo, setShippingInfo] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  })

  React.useEffect(() => {
    if (user) {
      const names = (profile?.full_name || "").trim().split(/\s+/)
      const firstName = names[0] || ""
      const lastName = names.slice(1).join(" ") || ""
      
      setShippingInfo((prev) => ({
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        email: prev.email || profile?.email || user.email || "",
        phone: prev.phone || profile?.phone || "",
        city: prev.city || profile?.city || "",
      }))
    }
  }, [user, profile])

  const [paymentMethod, setPaymentMethod] = React.useState<"online" | "cod">("online")
  const [couponCode, setCouponCode] = React.useState("")
  const [appliedCoupon, setAppliedCoupon] = React.useState<any>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)

  const discountAmount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' ? (subtotal * appliedCoupon.value / 100) : appliedCoupon.value)
    : 0
  
  const activeTaxRate = React.useMemo(() => {
    if (!shippingInfo.state) return standardTaxRate
    try {
      const overrides = stateTaxOverridesString ? JSON.parse(stateTaxOverridesString) : {}
      if (overrides[shippingInfo.state] !== undefined) {
        return Number(overrides[shippingInfo.state])
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    return standardTaxRate
  }, [shippingInfo.state, standardTaxRate, stateTaxOverridesString])

  const baseDiscountedAmount = Math.max(0, subtotal - discountAmount)

  const taxAmount = React.useMemo(() => {
    if (taxInclusive) {
      return baseDiscountedAmount * (activeTaxRate / (100 + activeTaxRate))
    } else {
      return baseDiscountedAmount * (activeTaxRate / 100)
    }
  }, [baseDiscountedAmount, activeTaxRate, taxInclusive])

  const calculatedSubtotal = React.useMemo(() => {
    if (taxInclusive) {
      return baseDiscountedAmount - taxAmount
    } else {
      return subtotal
    }
  }, [subtotal, taxAmount, taxInclusive])

  const calculatedDiscount = React.useMemo(() => {
    return discountAmount
  }, [discountAmount])

  const finalCheckoutTotal = React.useMemo(() => {
    if (taxInclusive) {
      return baseDiscountedAmount
    } else {
      return baseDiscountedAmount + taxAmount
    }
  }, [baseDiscountedAmount, taxAmount, taxInclusive])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let sanitizedValue = value

    if (name === "zip") {
      // Allow only digits and cap at 6 digits for Indian PIN codes
      sanitizedValue = value.replace(/\D/g, "").slice(0, 6)
    } else if (name === "phone") {
      // Allow only digits, spaces, hyphens, and leading plus prefix
      sanitizedValue = value.replace(/[^\d+ -]/g, "")
    }

    setShippingInfo((prev) => ({ ...prev, [name]: sanitizedValue }))
  }

  const allowedStates = React.useMemo(() => {
    if (!allowedStatesString) return []
    return allowedStatesString.split(", ").map(s => s.trim())
  }, [allowedStatesString])

  const isStateDeliverable = React.useMemo(() => {
    if (!shippingInfo.state) return true
    if (allowedStates.length === 0) return false
    return allowedStates.includes(shippingInfo.state)
  }, [shippingInfo.state, allowedStates])

  const handleApplyCoupon = async () => {
    if (!couponCode) return
    setIsApplyingCoupon(true)
    
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single()
    
    setIsApplyingCoupon(false)
    
    if (error || !data) {
      alert("Invalid or expired coupon code.")
      return
    }

    if (data.min_order_amount && subtotal < data.min_order_amount) {
      alert(`This coupon requires a minimum order of ${formatCurrency(data.min_order_amount, currencyCode, currencySymbol)}`)
      return
    }

    setAppliedCoupon(data)
  }

  const saveOrder = async (razorpayId?: string, isFailed: boolean = false) => {
    const res = await createOrder({
      userId: user?.id || null,
      shippingInfo,
      paymentMethod,
      couponCode: appliedCoupon?.code || null,
      items,
      subtotal: calculatedSubtotal,
      discountAmount: calculatedDiscount,
      finalTotal: finalCheckoutTotal,
      razorpayId,
      isFailed,
    })

    if (!res.success) {
      throw new Error(res.error || "Failed to process and save your order.")
    }

    return res.orderId
  }

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!shippingInfo.firstName || !shippingInfo.email || !shippingInfo.address) {
      alert("Please fill in all required shipping information.")
      return
    }

    setIsProcessing(true)

    try {
      if (paymentMethod === "cod") {
        const orderId = await saveOrder()
        setIsSuccess(true) // Mark success to prevent empty cart view
        clearCart()
        router.push(`/checkout/success?order_id=${orderId}`)
        return
      }

      const res = await createRazorpayOrder(finalCheckoutTotal)
      if (!res.success || !res.order) throw new Error("Failed to initialize payment gateway.")

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: res.order.amount,
        currency: res.order.currency,
        name: "Telkidukan Premium",
        description: "Order Checkout",
        order_id: res.order.id,
        handler: async function (response: any) {
          try {
            const orderId = await saveOrder(response.razorpay_payment_id)
            setIsSuccess(true)
            clearCart()
            router.push(`/checkout/success?order_id=${orderId}`)
          } catch (e: any) {
            alert("Payment recorded but failed to save order data. Please contact support.")
          }
        },
        prefill: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          email: shippingInfo.email,
          contact: shippingInfo.phone,
        },
        theme: { color: "#000000" },
        modal: { ondismiss: () => setIsProcessing(false) }
      }

      const rzp = new window.Razorpay(options)

      // Handle failed payments specifically
      rzp.on('payment.failed', async function (response: any) {
        setIsProcessing(false)
        try {
          // Pass isFailed = true to officially record the failed order in DB
          // We intentionally do NOT clear the cart so the user can try again!
          await saveOrder(response.error.metadata?.payment_id, true)
        } catch (err) {
          console.error("Failed to record failed order:", err)
        }
        alert(`Payment Failed: ${response.error.description}`)
      })

      rzp.open()
    } catch (e: any) {
      alert("Checkout failed: " + e.message)
      setIsProcessing(false)
    }
  }

  // Only show empty cart if NOT in success state
  if (items.length === 0 && !isSuccess) {
    return (
      <div className="mx-auto flex h-[70vh] max-w-7xl flex-col items-center justify-center px-6">
        <h1 className="text-4xl font-extrabold tracking-tight">Your cart is empty</h1>
        <p className="mt-4 text-zinc-500 font-medium">Add some items to your cart to proceed to checkout.</p>
        <Link href="/" className="mt-8">
          <Button variant="primary" className="rounded-2xl px-10 h-14">Return to Shop</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-20 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        {/* Left: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-12">
          <header className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-black">Checkout</h1>
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
              <Link href="/cart" className="hover:text-black transition-colors">CART</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-black">SHIPPING & PAYMENT</span>
            </nav>
          </header>

          {isSuccess ? (
            <div className="h-96 flex flex-col items-center justify-center gap-6">
              <Loader2 className="h-12 w-12 animate-spin text-black" />
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">Finalizing Your Vault Access...</p>
            </div>
          ) : !user ? (
            <div className="bg-white border border-zinc-100 shadow-2xl rounded-[40px] p-8 md:p-14 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-accent mb-4">Secure Checkout</span>
                <h2 className="font-serif text-3xl font-bold tracking-tight text-black">
                  {checkoutMode === "signin" ? "Welcome Back" : "Create Profile"}
                </h2>
                <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 leading-relaxed max-w-[280px]">
                  {checkoutMode === "signin" 
                    ? "Authenticate to proceed to checkout." 
                    : "Create a profile to proceed to checkout."}
                </p>
              </div>

              {checkoutError && (
                <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-start gap-4">
                  <X className="h-4 w-4 text-rose-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest">Authentication Failed</h4>
                    <p className="text-[10px] font-medium text-rose-500 mt-1 leading-relaxed">{checkoutError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleCheckoutAuth} className="space-y-6">
                {checkoutMode === "signup" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">FULL NAME</label>
                      <Input
                        placeholder="Enter your full name"
                        value={checkoutFullName}
                        onChange={(e) => setCheckoutFullName(e.target.value)}
                        required
                        variant="pill"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">PHONE NUMBER</label>
                      <Input
                        placeholder="Enter your phone number"
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value.replace(/[^\d+ -]/g, ""))}
                        required
                        variant="pill"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">EMAIL ADDRESS</label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    required
                    variant="pill"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">PASSWORD</label>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={checkoutPassword}
                    onChange={(e) => setCheckoutPassword(e.target.value)}
                    required
                    variant="pill"
                  />
                </div>

                <Button
                  variant="primary"
                  className="w-full rounded-2xl h-14 bg-black text-white font-bold text-xs uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-premium"
                  type="submit"
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {checkoutMode === "signin" ? "Login & Continue" : "Create Profile & Continue"}
                </Button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutMode(checkoutMode === "signin" ? "signup" : "signin")
                    setCheckoutError(null)
                  }}
                  className="group flex items-center justify-center gap-3 w-full text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 hover:text-black transition-all"
                >
                  <div className="h-px w-8 bg-zinc-200 transition-all group-hover:w-12 group-hover:bg-black" />
                  {checkoutMode === "signin" ? "Sign Up" : "Login"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-black/20">1</div>
                   <h2 className="text-xl font-bold tracking-tight">Contact & Shipping</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field label="First name" required>
                    <Input name="firstName" value={shippingInfo.firstName} onChange={handleInputChange} placeholder="E.g. Harsh" variant="pill" required />
                  </Field>
                  <Field label="Last name" required>
                    <Input name="lastName" value={shippingInfo.lastName} onChange={handleInputChange} placeholder="E.g. Vardhan" variant="pill" required />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field label="Email address">
                    <div className="flex h-14 w-full items-center rounded-2xl border-2 border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold text-zinc-500 cursor-not-allowed">
                      {shippingInfo.email || "No email available"}
                    </div>
                  </Field>
                  <Field label="Phone number" required>
                    <Input name="phone" value={shippingInfo.phone} onChange={handleInputChange} placeholder="+91 00000 00000" variant="pill" required />
                  </Field>
                </div>

                <Field label="Address" required>
                  <Input name="address" value={shippingInfo.address} onChange={handleInputChange} placeholder="Apartment, suite, street name..." variant="pill" required />
                </Field>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Field label="City" required>
                    <Input name="city" value={shippingInfo.city} onChange={handleInputChange} placeholder="New Delhi" variant="pill" required />
                  </Field>
                  <Field label="State" required>
                    <div className="relative">
                      <select
                        name="state"
                        value={shippingInfo.state}
                        onChange={handleInputChange}
                        required
                        className={cn(
                          "flex h-14 w-full rounded-2xl border-2 bg-white px-4 text-sm font-semibold outline-none transition-all appearance-none cursor-pointer",
                          shippingInfo.state && !isStateDeliverable 
                            ? "border-red-500 text-red-500 focus:border-red-600" 
                            : "border-zinc-100 text-black focus:border-black"
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 16px center",
                          backgroundSize: "16px"
                        }}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    {shippingInfo.state && !isStateDeliverable && (
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-500 mt-2 ml-1 animate-pulse">
                        We are not delivering in this area.
                      </p>
                    )}
                  </Field>
                  <Field label="PIN code" required>
                    <Input name="zip" value={shippingInfo.zip} onChange={handleInputChange} placeholder="110001" variant="pill" required />
                  </Field>
                </div>
              </form>

              <section className="space-y-8 pt-4">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-black/20">2</div>
                   <h2 className="text-xl font-bold tracking-tight">Payment Method</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {razorpayEnabled && (
                    <motion.button 
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod("online")}
                      className={cn(
                        "flex items-center justify-between p-6 rounded-3xl border-2 transition-all text-left",
                        paymentMethod === "online" ? "border-black bg-zinc-50 shadow-md" : "border-zinc-100 hover:border-black/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all", paymentMethod === "online" ? "border-black" : "border-zinc-200")}>
                          {paymentMethod === "online" && <motion.div layoutId="payment-dot" className="h-2.5 w-2.5 rounded-full bg-black" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black">Online Payment</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Cards, UPI, Netbanking</p>
                        </div>
                      </div>
                      <CreditCard className={cn("h-5 w-5", paymentMethod === "online" ? "text-black" : "text-zinc-200")} />
                    </motion.button>
                  )}

                  {codEnabled && (
                    <motion.button 
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod("cod")}
                      className={cn(
                        "flex items-center justify-between p-6 rounded-3xl border-2 transition-all text-left",
                        paymentMethod === "cod" ? "border-black bg-zinc-50 shadow-md" : "border-zinc-100 hover:border-black/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all", paymentMethod === "cod" ? "border-black" : "border-zinc-200")}>
                          {paymentMethod === "cod" && <motion.div layoutId="payment-dot" className="h-2.5 w-2.5 rounded-full bg-black" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black">Cash On Delivery</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Pay upon receipt</p>
                        </div>
                      </div>
                      <Truck className={cn("h-5 w-5", paymentMethod === "cod" ? "text-black" : "text-zinc-200")} />
                    </motion.button>
                  )}
                </div>

                {!razorpayEnabled && !codEnabled && (
                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl text-center">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">No Payment Methods Available</p>
                    <p className="text-[10px] font-medium text-amber-600 mt-1 uppercase tracking-widest leading-relaxed">
                      Please contact support to complete your purchase.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-[40px] border border-zinc-100 bg-white p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
            <h2 className="text-2xl font-extrabold tracking-tight text-black">Order summary</h2>
            
            <div className="mt-10 space-y-8 border-b border-zinc-100 pb-10">
              {items.map((item) => (
                <div key={item.id} className="flex gap-6">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-50 border border-zinc-100">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-lg">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-1">
                    <h3 className="text-sm font-extrabold text-black leading-tight">{item.title}</h3>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Qty: {item.quantity}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-extrabold text-black">{formatCurrency(item.price * item.quantity, currencyCode, currencySymbol)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">DISCOUNT CODE</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                    <input 
                      type="text" 
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      className="h-14 w-full rounded-2xl border-2 border-zinc-100 bg-white pl-12 pr-4 text-sm font-bold outline-none focus:border-black transition-all"
                    />
                  </div>
                  <Button 
                    onClick={handleApplyCoupon} 
                    disabled={isApplyingCoupon || !couponCode || isSuccess}
                    variant="outline" 
                    className="h-14 rounded-2xl px-6 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                  >
                    {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {appliedCoupon && (
                   <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                     <CheckCircle2 className="h-3 w-3" /> Coupon "{appliedCoupon.code}" Applied
                   </p>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-black font-bold">{formatCurrency(calculatedSubtotal, currencyCode, currencySymbol)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-zinc-400">Discount</span>
                    <span className="text-emerald-500 font-bold">-{formatCurrency(calculatedDiscount, currencyCode, currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-zinc-400">Tax ({activeTaxRate}%)</span>
                  <span className="text-black font-bold">{formatCurrency(taxAmount, currencyCode, currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-zinc-400">Shipping</span>
                  <span className="text-emerald-500 font-bold uppercase tracking-widest text-[11px]">FREE</span>
                </div>
                
                <div className="flex justify-between border-t border-zinc-100 pt-8 text-2xl font-extrabold tracking-tight text-black">
                  <span>Total</span>
                  <span>{formatCurrency(finalCheckoutTotal, currencyCode, currencySymbol)}</span>
                </div>
              </div>

              <div className="pt-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="submit"
                    form="checkout-form"
                    disabled={isProcessing || isSuccess || !user || !shippingInfo.state || !isStateDeliverable}
                    className="h-16 w-full rounded-2xl bg-black text-white font-extrabold text-base tracking-widest hover:bg-zinc-900 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] disabled:opacity-50 uppercase"
                  >
                    {!user ? (
                      "Authorize to Checkout"
                    ) : shippingInfo.state && !isStateDeliverable ? (
                      "Delivery Unavailable"
                    ) : isProcessing || isSuccess ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{isSuccess ? "Redirecting..." : "Processing..."}</span>
                      </div>
                    ) : (
                      paymentMethod === "cod" ? "Confirm Order" : "Pay now"
                    )}
                  </Button>
                </motion.div>
                <div className="mt-6 flex items-center justify-center gap-3">
                   <ShieldCheck className="h-4 w-4 text-zinc-300" />
                   <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">Payments are secure and encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-3">
      <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
