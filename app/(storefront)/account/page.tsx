"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { 
  ShoppingBag, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  Package, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Info,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  Globe,
  X,
  Truck
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AuthModal } from "@/components/ui/AuthModal"
import { cn, formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { cancelOrder, fetchUserOrders } from "@/app/actions/orders"

type Tab = "profile" | "orders"

export default function AccountPage() {
  const { user, profile, signOut, signIn, signUp } = useAuth()
  const supabase = createClient()
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<Tab>("profile")
  
  // Auth Form State
  const [authMode, setAuthMode] = React.useState<"signin" | "signup">("signin")
  const [authEmail, setAuthEmail] = React.useState("")
  const [authPassword, setAuthPassword] = React.useState("")
  const [authFullName, setAuthFullName] = React.useState("")
  const [authPhone, setAuthPhone] = React.useState("")
  const [authLoading, setAuthLoading] = React.useState(false)
  const [authError, setAuthError] = React.useState<string | null>(null)

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    try {
      if (authMode === "signin") {
        const { error } = await signIn(authEmail, authPassword)
        if (error) throw error
      } else {
        const { error } = await signUp(authEmail, authPassword, authFullName, authPhone)
        if (error) throw error
      }
    } catch (err: any) {
      setAuthError(err.message || "An error occurred")
    } finally {
      setAuthLoading(false)
    }
  }
  
  const [loading, setLoading] = React.useState(false)
  const [orders, setOrders] = React.useState<any[]>([])
  const [fetchingOrders, setFetchingOrders] = React.useState(false)
  const [fetchError, setFetchError] = React.useState<string | null>(null)

  // Order Tracking States & Methods
  const [trackingOrder, setTrackingOrder] = React.useState<any | null>(null)
  const [trackingTimeline, setTrackingTimeline] = React.useState<any[]>([])
  const [loadingTimeline, setLoadingTimeline] = React.useState(false)

  // Cancellation States
  const [orderToCancel, setOrderToCancel] = React.useState<any | null>(null)
  const [cancellingOrder, setCancellingOrder] = React.useState(false)
  const [cancelReason, setCancelReason] = React.useState("Change of mind")

  const handleCancelOrder = async () => {
    if (!orderToCancel) return
    setCancellingOrder(true)
    try {
      const res = await cancelOrder(orderToCancel.id, cancelReason)
      if (res.success) {
        await fetchOrders()
        setOrderToCancel(null)
      } else {
        alert(res.error || "Failed to cancel order.")
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setCancellingOrder(false)
    }
  }


  const generateFallbackTimeline = (order: any) => {
    const baseTime = new Date(order.created_at)
    const list = []
    
    // Placed
    list.push({
      status: "pending",
      note: "Order placed successfully.",
      created_at: baseTime.toISOString()
    })
    
    const status = order.fulfillment_status?.toLowerCase()
    
    if (status === 'processing' || status === 'shipped' || status === 'delivered' || status === 'completed') {
      list.push({
        status: "processing",
        note: "Your order is being packed and prepared for shipment.",
        created_at: new Date(baseTime.getTime() + 60 * 60 * 1000).toISOString() // +1 hour
      })
    }
    
    if (status === 'shipped' || status === 'delivered' || status === 'completed') {
      list.push({
        status: "shipped",
        note: "Your order has been shipped and is in transit.",
        created_at: new Date(baseTime.getTime() + 4 * 60 * 60 * 1000).toISOString() // +4 hours
      })
    }
    
    if (status === 'delivered' || status === 'completed') {
      list.push({
        status: "delivered",
        note: "Your order has been successfully delivered!",
        created_at: new Date(order.updated_at || Date.now()).toISOString()
      })
    }
    
    if (status === 'cancelled') {
      list.push({
        status: "cancelled",
        note: "Your order was cancelled.",
        created_at: new Date(order.updated_at || Date.now()).toISOString()
      })
    }
    
    return list
  }

  const handleTrackOrder = async (order: any) => {
    setTrackingOrder(order)
    setLoadingTimeline(true)
    setTrackingTimeline([])
    
    try {
      const { data, error } = await supabase
        .from("order_timeline")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true })
        
      if (!error && data && data.length > 0) {
        setTrackingTimeline(data)
      } else {
        const localTimeline = generateFallbackTimeline(order)
        setTrackingTimeline(localTimeline)
      }
    } catch (err) {
      console.error("Timeline load error:", err)
      const localTimeline = generateFallbackTimeline(order)
      setTrackingTimeline(localTimeline)
    } finally {
      setLoadingTimeline(false)
    }
  }

  // Profile Form State
  const [fullName, setFullName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [city, setCity] = React.useState("")
  const [currencyCode, setCurrencyCode] = React.useState("USD")
  const [currencySymbol, setCurrencySymbol] = React.useState("$")

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
    if (profile) {
      setFullName(profile.full_name || "")
      setPhone(profile.phone || "")
      setCity(profile.city || "")
    }
  }, [profile])

  React.useEffect(() => {
    if (user && activeTab === "orders") {
      fetchOrders()
    }
  }, [user, activeTab])

  const fetchOrders = async () => {
    if (!user) return
    setFetchingOrders(true)
    setFetchError(null)
    try {
      const res = await fetchUserOrders(user.id)
      if (!res.success) throw new Error(res.error)
      setOrders(res.data || [])
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      setFetchError(err.message)
    } finally {
      setFetchingOrders(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    setLoading(true)
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        city,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    setLoading(false)
    if (error) {
      alert("Error: " + error.message)
    } else {
      alert("Profile updated successfully!")
      window.location.reload()
    }
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-20 animate-in fade-in duration-1000">
        <div className="w-full bg-white border border-zinc-100 shadow-2xl rounded-[40px] p-10 md:p-16">
          <div className="flex flex-col items-center text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.6em] text-accent mb-6">Portal Access</span>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-black">
              {authMode === "signin" ? "Welcome Back" : "Create Profile"}
            </h1>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-zinc-400 leading-relaxed max-w-[280px]">
              {authMode === "signin" 
                ? "Please login to continue." 
                : "Create a new account."}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              {authMode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-8"
                >
                  <div>
                    <Input
                      label="Full Name"
                      placeholder="e.g. John Doe"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      required
                      className="text-lg py-6"
                    />
                  </div>
                  <div className="pb-2">
                    <Input
                      label="Phone Number"
                      placeholder="e.g. +91 99999 99999"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      required
                      className="text-lg py-6"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              className="text-lg py-6"
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
              className="text-lg py-6"
            />

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 p-6 rounded-2xl border-2 border-red-100 flex items-start gap-4"
              >
                 <X className="h-5 w-5 text-red-600 shrink-0 mt-1" />
                 <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.2em] leading-relaxed">
                  Authentication Failed: {authError}
                 </p>
              </motion.div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="h-16 w-full rounded-2xl shadow-premium text-xs font-bold uppercase tracking-[0.3em]"
              type="submit"
              loading={authLoading}
            >
              {authMode === "signin" ? "Login" : "Sign Up"}
              <ArrowRight className="ml-4 h-5 w-5" />
            </Button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
              className="group flex items-center justify-center gap-3 w-full text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 hover:text-black transition-all"
            >
              <div className="h-px w-8 bg-zinc-200 transition-all group-hover:w-12 group-hover:bg-black" />
              {authMode === "signin" 
                ? "Sign Up" 
                : "Login"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-24 animate-in fade-in duration-700">
      <header className="mb-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-black">My Account</h1>
        <p className="mt-2 text-zinc-500 font-medium">Manage your profile and security settings.</p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-white border border-zinc-100 rounded-3xl p-2 shadow-sm">
            <p className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.2em]">ACCOUNT MENU</p>
            <nav className="space-y-1">
              <SidebarItem 
                icon={UserIcon} 
                label="Profile" 
                active={activeTab === "profile"} 
                onClick={() => setActiveTab("profile")} 
              />
              <SidebarItem 
                icon={Package} 
                label="Order History" 
                active={activeTab === "orders"} 
                onClick={() => setActiveTab("orders")} 
              />
              <button 
                onClick={() => signOut()}
                className="flex w-full items-center gap-4 px-6 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all text-sm font-bold"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </nav>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-8 space-y-4">
             <h3 className="text-sm font-bold text-black">Need help?</h3>
             <p className="text-xs text-zinc-500 leading-relaxed font-medium">
               Our support team is available 24/7 to help you with your orders and account.
             </p>
             <Link href="/contact" className="inline-flex items-center text-xs font-bold text-black hover:underline gap-1">
               Contact Support <ChevronRight className="h-3 w-3" />
             </Link>
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9">
          {activeTab === "profile" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-bold tracking-tight text-black">Profile Details</h2>
              
              <div className="rounded-[40px] border border-zinc-100 bg-white overflow-hidden shadow-sm">
                 <div className="p-10 bg-zinc-50/50 border-b border-zinc-100 flex items-center gap-8">
                    <div className="h-24 w-24 rounded-3xl bg-black flex items-center justify-center text-white shadow-xl shadow-black/20">
                       <UserIcon className="h-10 w-10" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-extrabold text-black">{fullName || profile?.email?.split('@')[0] || "Member"}</h3>
                       <div className="flex items-center gap-2 mt-1 text-emerald-500">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-widest">Verified Account</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <ProfileField icon={Mail} label="EMAIL ADDRESS" value={profile?.email || user?.email || ""} />
                    <ProfileField 
                      icon={Calendar} 
                      label="MEMBER SINCE" 
                      value={new Date(profile?.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 
                    />
                    <div className="space-y-2">
                       <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">FULL NAME</label>
                       <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">PHONE NUMBER</label>
                       <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Not provided" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest ml-1">COUNTRY / REGION</label>
                       <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Worldwide" />
                    </div>
                 </div>

                 <div className="p-10 bg-zinc-50/30 border-t border-zinc-100 flex justify-end">
                    <Button 
                      onClick={handleUpdateProfile} 
                      disabled={loading}
                      className="rounded-2xl px-10 h-14 bg-black text-white font-bold text-xs uppercase tracking-widest hover:bg-zinc-900 transition-all"
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
                      Update Profile
                    </Button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-black">Order History</h2>
                <span className="px-4 py-1.5 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {orders.length} Orders
                </span>
              </div>

              {fetchingOrders ? (
                <div className="h-96 flex flex-col items-center justify-center gap-6">
                  <div className="h-10 w-10 border-4 border-zinc-100 border-t-black rounded-full animate-spin" />
                  <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Synchronizing order vault...</p>
                </div>
              ) : fetchError ? (
                <div className="h-96 flex flex-col items-center justify-center gap-6 text-center">
                  <AlertCircle className="h-12 w-12 text-rose-500" />
                  <div>
                    <h3 className="text-lg font-bold text-black">Synchronization Failed</h3>
                    <p className="text-xs text-zinc-400 mt-2 font-medium uppercase tracking-widest">{fetchError}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchOrders} className="mt-4 rounded-xl">Try Again</Button>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-8">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-[32px] border border-zinc-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-8 bg-zinc-50/50 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
                          <div>
                            <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">ORDER ID</p>
                            <p className="text-sm font-bold text-black">#{order.order_number || order.id.slice(0, 8).toUpperCase()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">PLACED ON</p>
                            <p className="text-sm font-bold text-black">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">TOTAL</p>
                            <p className="text-sm font-bold text-black">{formatCurrency(order.total, currencyCode, currencySymbol)}</p>
                          </div>
                        </div>
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border",
                          order.fulfillment_status === 'delivered' || order.fulfillment_status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          order.fulfillment_status === 'shipped' ? "bg-blue-50 text-blue-600 border-blue-100" :
                          order.fulfillment_status === 'cancelled' ? "bg-rose-50 text-rose-600 border-rose-100" :
                          "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {order.fulfillment_status === 'delivered' || order.fulfillment_status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {
                            order.fulfillment_status === 'shipped' ? 'In Transit' :
                            order.fulfillment_status === 'completed' || order.fulfillment_status === 'delivered' ? 'Delivered' :
                            order.fulfillment_status === 'cancelled' ? 'Cancelled' :
                            order.fulfillment_status
                          }
                        </div>
                      </div>

                      <div className="p-8 space-y-6">
                         {order.order_items?.map((item: any) => (
                           <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-0 border border-zinc-100/80 md:border-0 rounded-3xl md:rounded-none">
                             <div className="flex items-center gap-6 flex-1 min-w-0">
                               <div className="h-20 w-20 rounded-2xl bg-zinc-50 border border-zinc-100 overflow-hidden flex-shrink-0">
                                 <img src={item.image_url || 'https://via.placeholder.com/150'} alt={item.title} className="h-full w-full object-cover" />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <h4 className="text-sm font-bold text-black truncate">{item.title}</h4>
                                 <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                   Qty: {item.quantity} · {formatCurrency(item.unit_price, currencyCode, currencySymbol)} each
                                 </p>
                               </div>
                             </div>
                             
                             {/* Desktop Actions */}
                             <div className="hidden md:flex items-center gap-3 shrink-0">
                                {order.fulfillment_status === "pending" && !order.notes?.includes("Cancellation Requested") && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setOrderToCancel(order)}
                                    className="rounded-xl h-10 px-6 text-[10px] font-bold uppercase tracking-widest border-2 border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 transition-all duration-300"
                                  >
                                    Cancel Order
                                  </Button>
                                )}
                                {order.notes?.includes("Cancellation Requested") && order.fulfillment_status !== "cancelled" && (
                                  <span className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[9px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                                    Cancellation Pending Approval
                                  </span>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleTrackOrder(order)}
                                  className="rounded-xl h-10 px-6 text-[10px] font-bold uppercase tracking-widest border-2 hover:bg-black hover:text-white transition-all duration-300"
                                >
                                  Track Order
                                </Button>
                                <Link href={`/checkout/success?order_id=${order.id}`}>
                                  <Button className="rounded-xl h-10 px-6 text-[10px] font-bold uppercase tracking-widest bg-black text-white hover:bg-zinc-950 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow">
                                    Manage Order
                                  </Button>
                                </Link>
                             </div>

                             {/* Mobile Actions */}
                             <div className="flex md:hidden items-center gap-3 w-full pt-1 border-t border-zinc-100/50">
                                {order.fulfillment_status === "pending" && !order.notes?.includes("Cancellation Requested") && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setOrderToCancel(order)}
                                    className="flex-1 rounded-xl h-10 text-[9px] font-bold uppercase tracking-widest border-2 border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 transition-all duration-300"
                                  >
                                    Cancel
                                  </Button>
                                )}
                                {order.notes?.includes("Cancellation Requested") && order.fulfillment_status !== "cancelled" && (
                                  <span className="flex-1 inline-flex items-center justify-center rounded-xl px-2 py-2 text-[8px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 text-center">
                                    Cancellation Pending
                                  </span>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleTrackOrder(order)}
                                  className="flex-1 rounded-xl h-10 text-[9px] font-bold uppercase tracking-widest border-2 hover:bg-black hover:text-white transition-all duration-300"
                                >
                                  {order.fulfillment_status === "pending" ? "Track" : "Track Order"}
                                </Button>
                                <Link href={`/checkout/success?order_id=${order.id}`} className="flex-1">
                                  <Button className="w-full rounded-xl h-10 text-[9px] font-bold uppercase tracking-widest bg-black text-white hover:bg-zinc-950 active:scale-95 transition-all duration-300">
                                    {order.fulfillment_status === "pending" ? "Manage" : "Manage Order"}
                                  </Button>
                                </Link>
                             </div>
                           </div>
                         ))}
                         {(!order.order_items || order.order_items.length === 0) && (
                           <div className="flex items-center gap-4 text-zinc-300">
                             <div className="h-12 w-12 rounded-xl bg-zinc-50 flex items-center justify-center">
                                <Info className="h-6 w-6" />
                             </div>
                             <p className="text-xs font-bold uppercase tracking-widest">Item information unavailable for this order.</p>
                           </div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[40px] border-2 border-dashed border-zinc-100 bg-white p-24 text-center">
                  <div className="h-24 w-24 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-200 mx-auto mb-8">
                     <ShoppingBag className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-black">No orders found</h3>
                  <p className="mt-4 text-sm text-zinc-500 font-medium max-w-xs mx-auto leading-relaxed">
                    Looks like you haven't made a purchase yet. Start exploring our collection!
                  </p>
                  <Link href="/">
                    <Button variant="primary" className="mt-12 rounded-2xl h-16 px-12 text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10">
                      Start Shopping <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Tracking Timeline Modal */}
      <AnimatePresence>
        {trackingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTrackingOrder(null)}
              className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg rounded-[32px] border border-zinc-100 bg-white/95 shadow-2xl p-6 sm:p-8 overflow-hidden z-10"
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600" />

              {/* Close Button */}
              <button
                onClick={() => setTrackingOrder(null)}
                className="absolute top-6 right-6 h-10 w-10 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black hover:border-black transition-all bg-white shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="mb-8 pr-12">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Order Tracker</p>
                <h3 className="text-xl font-bold text-black mt-1">
                  #{trackingOrder.order_number || trackingOrder.id.slice(0, 8).toUpperCase()}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Placed on {new Date(trackingOrder.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Status Header Pill */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 mb-8">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                  trackingOrder.fulfillment_status === 'delivered' || trackingOrder.fulfillment_status === 'completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                  trackingOrder.fulfillment_status === 'shipped' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                  trackingOrder.fulfillment_status === 'cancelled' ? "bg-rose-50 text-rose-600 border-rose-100" :
                  "bg-amber-50 text-amber-600 border-amber-100"
                )}>
                  {trackingOrder.fulfillment_status === 'shipped' ? <Truck className="h-5 w-5 animate-pulse" /> : 
                   trackingOrder.fulfillment_status === 'delivered' || trackingOrder.fulfillment_status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : 
                   trackingOrder.fulfillment_status === 'cancelled' ? <X className="h-5 w-5" /> : 
                   <Clock className="h-5 w-5 animate-pulse" />}
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">Current Status</p>
                  <p className="text-sm font-bold text-black uppercase tracking-wider mt-0.5">
                    {trackingOrder.fulfillment_status === 'shipped' ? 'In Transit' :
                     trackingOrder.fulfillment_status === 'completed' || trackingOrder.fulfillment_status === 'delivered' ? 'Delivered' :
                     trackingOrder.fulfillment_status === 'cancelled' ? 'Cancelled' :
                     trackingOrder.fulfillment_status || 'Pending'}
                  </p>
                </div>
              </div>

              {/* Timeline list */}
              {loadingTimeline ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-black" />
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Connecting to tracking server...</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 relative">
                  {trackingTimeline.map((event, index) => {
                    const isLast = index === trackingTimeline.length - 1
                    const statusVal = event.status?.toLowerCase()
                    
                    let EventIcon = Clock
                    let colorClasses = "bg-amber-50 text-amber-500 border border-amber-100"
                    
                    if (statusVal === 'pending') {
                      EventIcon = CheckCircle2
                      colorClasses = "bg-green-50 text-green-600 border border-green-100"
                    } else if (statusVal === 'processing') {
                      EventIcon = Package
                      colorClasses = "bg-violet-50 text-violet-600 border border-violet-100"
                    } else if (statusVal === 'shipped') {
                      EventIcon = Truck
                      colorClasses = "bg-blue-50 text-blue-600 border border-blue-100"
                    } else if (statusVal === 'delivered' || statusVal === 'completed') {
                      EventIcon = CheckCircle2
                      colorClasses = "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    } else if (statusVal === 'cancelled') {
                      EventIcon = X
                      colorClasses = "bg-red-50 text-red-600 border border-red-100"
                    }

                    return (
                      <div key={event.id || index} className="flex gap-4 relative">
                        {/* Connecting Line */}
                        {!isLast && (
                          <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-zinc-100 border-l border-dashed border-zinc-200" />
                        )}
                        
                        {/* Icon Node */}
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm relative z-10", colorClasses)}>
                          <EventIcon className="h-4 w-4" />
                        </div>
                        
                        {/* Details */}
                        <div className="pt-1 pb-4">
                          <h4 className="text-sm font-bold text-black capitalize">
                            {event.status === 'shipped' ? 'In Transit' :
                             event.status === 'completed' || event.status === 'delivered' ? 'Delivered' :
                             event.status === 'cancelled' ? 'Cancelled' :
                             event.status}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">{event.note}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-1">
                            {new Date(event.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })} at {new Date(event.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Shipping Address Summary */}
              {trackingOrder.shipping_address && (
                <div className="mt-8 pt-6 border-t border-zinc-100">
                  <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2">Delivery Address</p>
                  <p className="text-xs font-bold text-black">
                    {trackingOrder.shipping_address.firstName} {trackingOrder.shipping_address.lastName}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {trackingOrder.shipping_address.address}, {trackingOrder.shipping_address.city}, {trackingOrder.shipping_address.state} - {trackingOrder.shipping_address.zip}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Order Confirmation Modal */}
      <AnimatePresence>
        {orderToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderToCancel(null)}
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
                onClick={() => setOrderToCancel(null)}
                className="absolute top-6 right-6 h-10 w-10 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black hover:border-black transition-all bg-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-6 mt-4">
                <AlertCircle className="h-8 w-8" />
              </div>

              <h3 className="text-xl font-bold text-black">Cancel Order</h3>
              <p className="text-xs text-zinc-500 mt-2 font-medium leading-relaxed max-w-[280px] mx-auto uppercase tracking-wider">
                Are you sure you want to cancel order #{orderToCancel.order_number || orderToCancel.id.slice(0, 8).toUpperCase()}? This action is permanent and cannot be undone.
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
                  disabled={cancellingOrder}
                  className="w-full rounded-2xl h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest transition-all"
                >
                  {cancellingOrder ? "Processing..." : "Yes, Cancel Order"}
                </Button>
                <Button 
                  onClick={() => setOrderToCancel(null)}
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

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 px-6 py-4 rounded-2xl transition-all text-sm font-bold",
        active ? "bg-black text-white shadow-lg shadow-black/10" : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-white" : "text-zinc-300")} />
      {label}
    </button>
  )
}

function ProfileField({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-6 p-6 rounded-3xl border border-zinc-100 bg-white">
      <div className="h-12 w-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-black">{value || "Not provided"}</p>
      </div>
    </div>
  )
}
