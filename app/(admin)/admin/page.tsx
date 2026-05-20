"use client"

import * as React from "react"
import { OverviewChart } from "@/components/admin/OverviewChart"
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  Eye,
  Trash2,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import { cn, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { getVisitStats, resetVisits } from "@/app/actions/analytics"

export default function AdminDashboard() {
  const supabase = createClient()
  
  // Data loading states
  const [orders, setOrders] = React.useState<any[]>([])
  const [profiles, setProfiles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  
  // Live visitor stats state
  const [visitStats, setVisitStats] = React.useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 0
  })
  const [isResetting, setIsResetting] = React.useState(false)
  
  // Filter settings
  const [timeFilter, setTimeFilter] = React.useState("this-month")
  const [currencyCode, setCurrencyCode] = React.useState("INR")
  const [currencySymbol, setCurrencySymbol] = React.useState("₹")
  const [chartType, setChartType] = React.useState<"line" | "bar">("line")

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase() || "") {
      case "completed":
      case "delivered": return "bg-emerald-50 text-emerald-600 border border-emerald-100"
      case "processing": return "bg-amber-50 text-amber-600 border border-amber-100"
      case "shipped": return "bg-blue-50 text-blue-600 border border-blue-100"
      case "cancelled": return "bg-red-50 text-red-600 border border-red-100"
      case "pending": return "bg-gray-50 text-gray-500 border border-gray-150"
      default: return "bg-gray-50 text-gray-400 border border-gray-150"
    }
  }

  // Load live analytics data
  React.useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      setErrorMsg(null)
      try {
        // 1. Fetch live orders with first item image
        const { data: ordersData, error: ordersErr } = await supabase
          .from("orders")
          .select(`
            id, 
            created_at, 
            total, 
            order_number, 
            fulfillment_status, 
            payment_status,
            order_items(image_url)
          `)
          .order("created_at", { ascending: false })
        if (ordersErr) throw ordersErr

        // 2. Fetch live profiles (retrieve email and role to accurately compute registered customers)
        const { data: profilesData, error: profilesErr } = await supabase
          .from("profiles")
          .select("id, created_at, role, email")
        if (profilesErr) throw profilesErr

        // 3. Fetch Currency settings
        const { data: settingsData } = await supabase
          .from("site_settings")
          .select("currency_code, currency_symbol")
          .maybeSingle()

        // 4. Fetch Visitor stats
        const statsData = await getVisitStats()
        setVisitStats(statsData)

        setOrders(ordersData || [])
        setProfiles(profilesData || [])
        if (settingsData) {
          if (settingsData.currency_code) setCurrencyCode(settingsData.currency_code)
          if (settingsData.currency_symbol) setCurrencySymbol(settingsData.currency_symbol)
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err)
        setErrorMsg(err.message || "Failed to sync real-time analytics data.")
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const handleResetVisits = async () => {
    const confirmReset = window.confirm("Are you sure you want to completely reset the total visit counts? This action will permanently delete all recorded visitor logs.")
    if (!confirmReset) return

    setIsResetting(true)
    try {
      const result = await resetVisits()
      if (result.success) {
        setVisitStats({
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          thisYear: 0
        })
        alert("Visitor stats have been reset successfully.")
      } else {
        alert(`Failed to reset visitor stats: ${result.error}`)
      }
    } catch (err: any) {
      alert(`An error occurred: ${err.message}`)
    } finally {
      setIsResetting(false)
    }
  }

  // Filter datasets based on selected month filter
  const filteredData = React.useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-11

    const filteredOrders = orders.filter(order => {
      const date = new Date(order.created_at)
      if (timeFilter === "all") return true
      if (timeFilter === "this-month") {
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth
      }
      if (timeFilter === "last-month") {
        let targetMonth = currentMonth - 1
        let targetYear = currentYear
        if (targetMonth < 0) {
          targetMonth = 11
          targetYear -= 1
        }
        return date.getFullYear() === targetYear && date.getMonth() === targetMonth
      }
      
      const selectMonth = parseInt(timeFilter)
      return date.getFullYear() === currentYear && date.getMonth() === selectMonth
    })

    const filteredProfiles = profiles.filter(profile => {
      const date = new Date(profile.created_at)
      if (timeFilter === "all") return true
      if (timeFilter === "this-month") {
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth
      }
      if (timeFilter === "last-month") {
        let targetMonth = currentMonth - 1
        let targetYear = currentYear
        if (targetMonth < 0) {
          targetMonth = 11
          targetYear -= 1
        }
        return date.getFullYear() === targetYear && date.getMonth() === targetMonth
      }
      
      const selectMonth = parseInt(timeFilter)
      return date.getFullYear() === currentYear && date.getMonth() === selectMonth
    })

    return { filteredOrders, filteredProfiles }
  }, [orders, profiles, timeFilter])

  // Compile calculations
  const metrics = React.useMemo(() => {
    const { filteredOrders, filteredProfiles } = filteredData
    
    // Total Revenue sums non-cancelled, non-failed orders
    const totalRev = filteredOrders
      .filter(o => o.fulfillment_status !== "cancelled" && o.payment_status !== "failed")
      .reduce((sum, o) => sum + Number(o.total || 0), 0)

    const totalOrdersCount = filteredOrders.length
    
    // Calculate actual registered customer profiles matching the time filter
    const registeredCustomersCount = filteredProfiles.filter((p: any) => p.role === "customer").length
    const averageOrderValue = totalOrdersCount > 0 ? totalRev / totalOrdersCount : 0

    return {
      revenue: totalRev,
      ordersCount: totalOrdersCount,
      customersCount: registeredCustomersCount,
      avgOrder: averageOrderValue
    }
  }, [filteredData])

  // Format line chart data coordinates
  const lineChartData = React.useMemo(() => {
    const { filteredOrders } = filteredData
    const validOrders = filteredOrders.filter(o => o.fulfillment_status !== "cancelled" && o.payment_status !== "failed")

    if (timeFilter === "all") {
      // Group monthly (Jan - Dec)
      const monthly = [
        { name: "Jan", total: 0 },
        { name: "Feb", total: 0 },
        { name: "Mar", total: 0 },
        { name: "Apr", total: 0 },
        { name: "May", total: 0 },
        { name: "Jun", total: 0 },
        { name: "Jul", total: 0 },
        { name: "Aug", total: 0 },
        { name: "Sep", total: 0 },
        { name: "Oct", total: 0 },
        { name: "Nov", total: 0 },
        { name: "Dec", total: 0 },
      ]
      validOrders.forEach(o => {
        const m = new Date(o.created_at).getMonth()
        monthly[m].total = Number((monthly[m].total + Number(o.total || 0)).toFixed(2))
      })
      return monthly
    } else {
      // Group daily (1 to daysInMonth)
      const now = new Date()
      let targetMonth = now.getMonth()
      let targetYear = now.getFullYear()

      if (timeFilter === "last-month") {
        targetMonth -= 1
        if (targetMonth < 0) {
          targetMonth = 11
          targetYear -= 1
        }
      } else if (timeFilter !== "this-month") {
        targetMonth = parseInt(timeFilter)
      }

      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
      const daily = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`,
        total: 0
      }))

      validOrders.forEach(o => {
        const dateObj = new Date(o.created_at)
        const d = dateObj.getDate()
        if (d >= 1 && d <= daysInMonth) {
          daily[d - 1].total = Number((daily[d - 1].total + Number(o.total || 0)).toFixed(2))
        }
      })
      return daily
    }
  }, [filteredData, timeFilter])

  // Get Top 5 recent orders for selected filter
  const recentOrders = React.useMemo(() => {
    return filteredData.filteredOrders.slice(0, 5)
  }, [filteredData])

  const stats = [
    { name: "Total Revenue", value: formatCurrency(metrics.revenue, currencyCode, currencySymbol), trend: "+12.5%", icon: DollarSign, isUp: true },
    { name: "Total Orders", value: String(metrics.ordersCount), trend: "+8.2%", icon: ShoppingBag, isUp: true },
    { name: "Customers", value: String(metrics.customersCount), trend: "+4.1%", icon: Users, isUp: true },
    { name: "Average Order", value: formatCurrency(metrics.avgOrder, currencyCode, currencySymbol), trend: metrics.avgOrder > 0 ? "+2.4%" : "0%", icon: TrendingUp, isUp: metrics.avgOrder > 0 },
    { name: "Total Visits", value: String(visitStats.total), trend: "+15.3%", icon: Eye, isUp: true },
  ]

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Compiling real-time dashboard analytics...</p>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div>
          <h3 className="text-xl font-bold text-black font-serif">Sync Failure</h3>
          <p className="text-xs text-gray-400 mt-2 font-medium max-w-sm leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black font-serif">Store Overview</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back. Live real-time statistics for Telkidukan.</p>
        </div>
        
        {/* Month Selector Filter Dropdown */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="bg-white">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <div className="flex items-center gap-2 border border-gray-200 bg-white rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors shadow-sm">
            <Calendar className="h-4 w-4 text-black" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold uppercase tracking-widest text-black outline-none cursor-pointer pr-2"
            >
              <option value="all">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              {monthNames.map((name, i) => (
                <option key={name} value={String(i)}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.name} className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-black">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.isUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.trend}
              </div>
            </div>
            <div>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.name}</p>
               <p className="mt-1 text-2xl font-bold text-black font-sans">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Live traffic tracking breakdown */}
      <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-lg font-bold text-black font-serif">Live Visit Tracking</h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Real-time traffic counts tracked instantly when a storefront user opens the page.
            </p>
          </div>
          <Button 
            onClick={handleResetVisits} 
            disabled={isResetting}
            variant="outline" 
            size="sm" 
            className="text-rose-600 hover:text-rose-700 border-rose-200 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-50 transition-colors"
          >
            {isResetting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Reset Total Count
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Visits</p>
            <p className="mt-2 text-2xl font-bold text-black font-sans">{visitStats.total}</p>
          </div>
          <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today</p>
            <p className="mt-2 text-2xl font-bold text-black font-sans">{visitStats.today}</p>
          </div>
          <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This Week</p>
            <p className="mt-2 text-2xl font-bold text-black font-sans">{visitStats.thisWeek}</p>
          </div>
          <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This Month</p>
            <p className="mt-2 text-2xl font-bold text-black font-sans">{visitStats.thisMonth}</p>
          </div>
          <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This Year</p>
            <p className="mt-2 text-2xl font-bold text-black font-sans">{visitStats.thisYear}</p>
          </div>
        </div>
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Chart */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-bold text-black font-serif">Revenue Analytics</h3>
              <p className="text-xs text-gray-400 mt-1">
                {timeFilter === "all" ? "Monthly grouped performance" : "Daily revenue performance over time"}
              </p>
            </div>
            <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
               <button 
                 onClick={() => setChartType("line")}
                 className={cn(
                   "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg",
                   chartType === "line" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-black"
                 )}
               >
                 Line
               </button>
               <button 
                 onClick={() => setChartType("bar")}
                 className={cn(
                   "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg",
                   chartType === "bar" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-black"
                 )}
               >
                 Bar
               </button>
            </div>
          </div>
          <div className="h-[350px]">
            <OverviewChart data={lineChartData} type={chartType} />
          </div>
        </div>

        {/* Right Sidebar: Recent Activity */}
        <div className="lg:col-span-4 flex flex-col gap-8">
           <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm flex-1">
              <h3 className="text-lg font-bold text-black font-serif mb-6">Recent Orders</h3>
              <div className="space-y-6">
                {recentOrders.map((order) => {
                  const imageUrl = order.order_items?.[0]?.image_url
                  return (
                    <div key={order.id} className="flex items-center justify-between pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {imageUrl ? (
                            <img src={imageUrl} alt={order.order_number} className="h-full w-full object-cover" />
                          ) : (
                            <ShoppingBag className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black">#{order.order_number || order.id.slice(0, 8).toUpperCase()}</p>
                          <span className={cn(
                            "inline-flex items-center rounded-lg px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest mt-1 border",
                            getStatusColor(order.fulfillment_status)
                          )}>
                            {order.fulfillment_status === 'shipped' ? 'In Transit' : order.fulfillment_status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-black">{formatCurrency(order.total, currencyCode, currencySymbol)}</p>
                    </div>
                  )
                })}

                {recentOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ShoppingBag className="h-8 w-8 text-gray-300 mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No orders for selected period</p>
                  </div>
                )}
              </div>
              <Link href="/admin/orders" className="block w-full mt-8">
                <Button variant="ghost" size="sm" className="w-full text-gray-400 border-t border-gray-50 pt-6 rounded-none font-bold uppercase tracking-widest text-[9px]">
                  View All Transactions
                </Button>
              </Link>
           </div>
        </div>
      </div>
    </div>
  )
}
