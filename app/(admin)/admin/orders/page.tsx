"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle2, 
  Clock,
  XCircle,
  Download,
  Calendar,
  Settings,
  AlertCircle
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export default function AdminOrdersPage() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""

  const [orders, setOrders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null)
  const [orderItems, setOrderItems] = React.useState<any[]>([])
  const [statusUpdating, setStatusUpdating] = React.useState(false)
  const [modalTab, setModalTab] = React.useState<"profile" | "order">("profile")
  const [currencyCode, setCurrencyCode] = React.useState("USD")
  const [currencySymbol, setCurrencySymbol] = React.useState("$")

  // Search, Tab, and Pagination States
  const [search, setSearch] = React.useState(q)
  const [activeStatusTab, setActiveStatusTab] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedDate, setSelectedDate] = React.useState("")

  React.useEffect(() => {
    setSearch(q)
  }, [q])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setCurrentPage(1)
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set("q", val)
    } else {
      params.delete("q")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }


  // Fetch orders and currency settings on mount
  React.useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          created_at,
          total,
          fulfillment_status,
          shipping_address,
          notes,
          profiles(full_name,email)
        `)
        .order("created_at", { ascending: false })
      if (!error) setOrders(data ?? [])
    }

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("currency_code, currency_symbol")
        .maybeSingle()
      if (!error && data) {
        if (data.currency_code) setCurrencyCode(data.currency_code)
        if (data.currency_symbol) setCurrencySymbol(data.currency_symbol)
      }
    }

    fetchOrders()
    fetchSettings()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase() || "") {
      case "completed":
      case "delivered": return "bg-emerald-50 text-emerald-600 border border-emerald-100"
      case "processing": return "bg-amber-50 text-amber-600 border border-amber-100"
      case "shipped": return "bg-blue-50 text-blue-600 border border-blue-100"
      case "cancelled": return "bg-red-50 text-red-600 border border-red-100"
      case "pending": return "bg-amber-50 text-amber-600 border border-amber-100"
      default: return "bg-gray-50 text-gray-400 border border-gray-150"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase() || "") {
      case "completed":
      case "delivered": return CheckCircle2
      case "processing": return Clock
      case "shipped": return Truck
      case "cancelled": return XCircle
      default: return Clock
    }
  }

  const openOrderModal = async (order: any) => {
    setSelectedOrder(order)
    
    // Fetch full order details
    const { data: fullOrder, error: orderErr } = await supabase
      .from("orders")
      .select(`
        *,
        profiles(full_name, email, phone, city)
      `)
      .eq("id", order.id)
      .single()

    if (!orderErr && fullOrder) {
      setSelectedOrder(fullOrder)
    }

    // Fetch order items
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        id,
        product_id,
        variant_id,
        title,
        variant_info,
        quantity,
        unit_price,
        line_total,
        image_url
      `)
      .eq("order_id", order.id)
    if (!error) setOrderItems(data ?? [])
  }

  const closeModal = () => {
    setSelectedOrder(null)
    setOrderItems([])
    setModalTab("profile")
  }

  const updateStatus = async (newStatus: string) => {
    if (!selectedOrder) return
    setStatusUpdating(true)
    const { error } = await supabase
      .from("orders")
      .update({ fulfillment_status: newStatus })
      .eq("id", selectedOrder.id)
    if (!error) {
      // Insert status update event in timeline
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        let note = `Order status updated to ${newStatus}.`
        if (newStatus === 'pending') note = 'Order placed successfully.'
        else if (newStatus === 'processing') note = 'Your order is being packed and prepared for shipment.'
        else if (newStatus === 'shipped') note = 'Your order has been shipped and is in transit.'
        else if (newStatus === 'delivered' || newStatus === 'completed') note = 'Your order has been successfully delivered!'
        else if (newStatus === 'cancelled') note = 'Your order was cancelled.'

        await supabase.from("order_timeline").insert({
          order_id: selectedOrder.id,
          status: newStatus,
          note: note,
          created_by: user?.id || null
        })
      } catch (timelineErr) {
        console.error("Timeline insertion error:", timelineErr)
      }

      // refresh list
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, fulfillment_status: newStatus } : o))
      setSelectedOrder({ ...selectedOrder, fulfillment_status: newStatus })
    }
    setStatusUpdating(false)
  }

  // Real-time client-side filter
  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      // 1. Search Query Match
      const query = search.toLowerCase()
      const orderNumber = (order.order_number || "").toLowerCase()
      const orderId = (order.id || "").toLowerCase()
      const fullName = (order.profiles?.full_name || order.shipping_address?.firstName || "").toLowerCase()
      const email = (order.profiles?.email || order.shipping_address?.email || "").toLowerCase()
      const matchesSearch = orderNumber.includes(query) || orderId.includes(query) || fullName.includes(query) || email.includes(query)

      // 2. Tab Filter Match
      let matchesTab = true
      if (activeStatusTab === "processing") {
        matchesTab = order.fulfillment_status === "processing" || order.fulfillment_status === "pending" || order.fulfillment_status === "shipped"
      } else if (activeStatusTab === "completed") {
        matchesTab = order.fulfillment_status === "completed" || order.fulfillment_status === "delivered"
      }

      // 3. Date Filter Match
      let matchesDate = true
      if (selectedDate) {
        const orderDateStr = new Date(order.created_at).toISOString().split('T')[0] // 'YYYY-MM-DD'
        matchesDate = orderDateStr === selectedDate
      }

      return matchesSearch && matchesTab && matchesDate
    })
  }, [orders, search, activeStatusTab, selectedDate])

  // Pagination Slice
  const totalPages = Math.ceil(filteredOrders.length / 20)
  const currentOrders = React.useMemo(() => {
    const start = (currentPage - 1) * 20
    return filteredOrders.slice(start, start + 20)
  }, [filteredOrders, currentPage])

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black font-serif">Order Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track, fulfill and manage your Telkidukan customer orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="bg-white">
            <Download className="mr-2 h-4 w-4" /> Export List
          </Button>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setCurrentPage(1)
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <Button variant={selectedDate ? "primary" : "outline"} size="sm" className="bg-white relative">
              <Calendar className="mr-2 h-4 w-4" />
              {selectedDate ? (
                <span>Date: {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              ) : (
                "Select Date"
              )}
            </Button>
            {selectedDate && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedDate("")
                  setCurrentPage(1)
                }}
                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-md transition-colors z-20"
                title="Clear date filter"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending Fulfillment", value: orders.filter(o => o.fulfillment_status === 'pending').length || "0", color: "text-amber-500", bg: "bg-amber-50", icon: Clock },
          { label: "In Transit", value: orders.filter(o => o.fulfillment_status === 'shipped').length || "0", color: "text-blue-500", bg: "bg-blue-50", icon: Truck },
          { label: "Delivered", value: orders.filter(o => o.fulfillment_status === 'completed' || o.fulfillment_status === 'delivered').length || "0", color: "text-green-500", bg: "bg-green-50", icon: CheckCircle2 },
          { label: "Cancelled", value: orders.filter(o => o.fulfillment_status === 'cancelled').length || "0", color: "text-red-500", bg: "bg-red-50", icon: XCircle },
        ].map(stat => (
          <div key={stat.label} className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-gray-100", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label.split(' ')[0]}</span>
            </div>
            <p className="text-2xl font-bold text-black">{stat.value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or customer..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-white focus:border-gray-200 transition-all placeholder:text-gray-400 text-black font-semibold"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors" disabled>
              <Filter className="h-4 w-4" /> Filter
            </button>
            <div className="h-8 w-px bg-gray-100 mx-2" />
            <div className="bg-gray-50 rounded-xl p-1 flex border border-gray-100">
              <button 
                onClick={() => { setActiveStatusTab("all"); setCurrentPage(1); }}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                  activeStatusTab === "all" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-black"
                )}
              >
                All Orders
              </button>
              <button 
                onClick={() => { setActiveStatusTab("processing"); setCurrentPage(1); }}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                  activeStatusTab === "processing" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-black"
                )}
              >
                Processing
              </button>
              <button 
                onClick={() => { setActiveStatusTab("completed"); setCurrentPage(1); }}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                  activeStatusTab === "completed" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-black"
                )}
              >
                Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <th className="px-8 py-5">Order Reference</th>
              <th className="px-8 py-5">Customer Info</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Value</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right pr-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentOrders.map(order => {
              const StatusIcon = getStatusIcon(order.fulfillment_status)
              return (
                <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-bold text-black bg-gray-100 px-2 py-1 rounded">#{order.order_number || order.id.slice(0, 8).toUpperCase()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm text-black">{order.profiles?.full_name || order.shipping_address?.firstName || "Guest User"}</span>
                      <span className="text-[10px] font-medium text-gray-400 tracking-wider">{order.profiles?.email || order.shipping_address?.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-6 font-bold text-sm text-black">{formatCurrency(order.total, currencyCode, currencySymbol)}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest", getStatusColor(order.fulfillment_status))}>
                        <StatusIcon className="h-3 w-3" />
                        {
                          order.fulfillment_status === 'shipped' ? 'In Transit' :
                          order.fulfillment_status === 'completed' || order.fulfillment_status === 'delivered' ? 'Delivered' :
                          order.fulfillment_status
                        }
                      </span>
                      {order.notes?.includes("Cancellation Requested") && (
                        <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                          Cancel Requested
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right pr-12">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all" onClick={() => openOrderModal(order)}>
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="bg-gray-50/50 border-t border-gray-100 px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
              Showing <span className="text-black font-bold">{(currentPage - 1) * 20 + 1}</span> to{" "}
              <span className="text-black font-bold">
                {Math.min(currentPage * 20, filteredOrders.length)}
              </span>{" "}
              of <span className="text-black font-bold">{filteredOrders.length}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-9 w-9 rounded-xl text-xs font-bold transition-all",
                    currentPage === page
                      ? "bg-black text-white shadow-md shadow-black/10"
                      : "text-gray-500 hover:bg-gray-100 hover:text-black"
                  )}
                >
                  {page}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/20">
            <ShoppingBag className="h-16 w-16 text-gray-200 mb-6" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No matching orders found</p>
          </div>
        )}
      </div>

      {/* Premium Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 p-8 relative border border-gray-100 animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <button className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors" onClick={closeModal}>
              ✕
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold text-black">Order #{selectedOrder.order_number || selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                Placed on {new Date(selectedOrder.created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-gray-100 mb-6">
              <button
                className={cn(
                  "flex-1 pb-3 text-[11px] font-bold uppercase tracking-widest text-center border-b-2 transition-all",
                  modalTab === "profile" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                )}
                onClick={() => setModalTab("profile")}
              >
                Customer Profile
              </button>
              <button
                className={cn(
                  "flex-1 pb-3 text-[11px] font-bold uppercase tracking-widest text-center border-b-2 transition-all",
                  modalTab === "order" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                )}
                onClick={() => setModalTab("order")}
              >
                Order Details
              </button>
            </div>

            {/* Tab 1: Customer Profile */}
            {modalTab === "profile" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Full Name</p>
                      <p className="font-bold text-black text-sm mt-0.5">
                        {selectedOrder.shipping_address?.firstName 
                          ? `${selectedOrder.shipping_address.firstName} ${selectedOrder.shipping_address.lastName || ""}`
                          : (selectedOrder.profiles?.full_name || "Guest User")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Email Address</p>
                      <p className="font-bold text-black text-sm mt-0.5">{selectedOrder.email || selectedOrder.profiles?.email || selectedOrder.shipping_address?.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Phone Number</p>
                      <p className="font-bold text-black text-sm mt-0.5">{selectedOrder.shipping_address?.phone || selectedOrder.profiles?.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Membership Tier</p>
                      <p className="font-bold text-emerald-600 text-sm mt-0.5 flex items-center gap-1">
                        {selectedOrder.user_id ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Registered Member
                          </>
                        ) : "Guest Customer"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Fulfillment Shipping Address</p>
                  <div className="text-xs font-semibold text-gray-700 leading-relaxed uppercase tracking-wider">
                    {selectedOrder.shipping_address?.address || selectedOrder.shipping_address?.address_line1 || "-"}<br />
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.zip || selectedOrder.shipping_address?.postal_code || ""}<br />
                    {selectedOrder.shipping_address?.country || "India"}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Order Detail */}
            {modalTab === "order" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {selectedOrder.notes?.includes("Cancellation Requested") && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3 text-rose-800 animate-pulse">
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">Cancellation Requested by Customer</p>
                      <p className="text-xs font-semibold mt-1">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}
                {/* Items list */}
                <div className="max-h-40 overflow-y-auto pr-2 space-y-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Items Summary</p>
                  {orderItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50/30 rounded-xl border border-gray-100">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-black truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatCurrency(item.unit_price, currencyCode, currencySymbol)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-sm text-black shrink-0">
                        {formatCurrency(item.line_total || (item.unit_price * item.quantity), currencyCode, currencySymbol)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Subtotal, Coupon, Total card */}
                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-black font-bold">{formatCurrency(selectedOrder.subtotal || selectedOrder.total, currencyCode, currencySymbol)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-gray-500">
                      <span>Discount ({selectedOrder.coupon_code || "Applied"})</span>
                      <span className="text-emerald-600 font-bold">-{formatCurrency(selectedOrder.discount_amount, currencyCode, currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-semibold text-gray-500">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-bold uppercase tracking-widest text-[9px]">Free</span>
                  </div>
                  <div className="h-px bg-gray-150 my-2" />
                  <div className="flex justify-between text-sm font-extrabold text-black">
                    <span>Grand Total</span>
                    <span className="text-lg text-black font-extrabold">{formatCurrency(selectedOrder.total, currencyCode, currencySymbol)}</span>
                  </div>
                </div>

                {/* Transaction details & Method */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400">Payment Status</p>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest mt-1.5",
                      selectedOrder.payment_status?.toLowerCase() === 'paid' 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    )}>
                      {selectedOrder.payment_status?.toLowerCase() === 'paid' ? "Paid Online" : "Pending / COD"}
                    </span>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400">Payment Method</p>
                    <p className="text-xs font-bold text-black mt-1.5">
                      {selectedOrder.notes || (selectedOrder.razorpay_payment_id ? "Online Payment" : "Cash on Delivery")}
                    </p>
                    {selectedOrder.razorpay_payment_id && (
                      <p className="text-[8px] text-gray-400 mt-1 font-mono truncate">TX: {selectedOrder.razorpay_payment_id}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer with Current Status Select */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Current Status:</span>
                <div className="relative">
                  <select
                    className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold text-black outline-none focus:border-black transition-all cursor-pointer shadow-sm hover:bg-gray-100/50"
                    value={selectedOrder.fulfillment_status === 'completed' ? 'delivered' : selectedOrder.fulfillment_status}
                    onChange={e => updateStatus(e.target.value)}
                    disabled={statusUpdating}
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                {selectedOrder.notes?.includes("Cancellation Requested") && selectedOrder.fulfillment_status !== 'cancelled' && (
                  <Button 
                    variant="destructive" 
                    onClick={() => updateStatus("cancelled")} 
                    disabled={statusUpdating}
                    className="rounded-xl px-6 h-11 text-xs font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-all border-none"
                  >
                    {statusUpdating ? "Processing..." : "Approve Cancellation"}
                  </Button>
                )}
                <Button variant="primary" onClick={closeModal} className="rounded-xl px-8 h-11 text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-zinc-900 transition-all">
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
