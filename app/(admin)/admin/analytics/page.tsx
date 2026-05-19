"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { TrendingUp, ShoppingBag, Users, IndianRupee, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

const ACCENT = "#2563EB"
const COLORS = ["#2563EB", "#7C3AED", "#10B981", "#EF4444", "#F59E0B"]
type Range = "7d" | "30d" | "90d"

export default function AnalyticsPage() {
  const supabase = createClient()
  const [range, setRange] = React.useState<Range>("30d")
  const [loading, setLoading] = React.useState(true)
  const [revenue, setRevenue] = React.useState<any[]>([])
  const [topProducts, setTopProducts] = React.useState<any[]>([])
  const [kpi, setKpi] = React.useState({ revenue: 0, orders: 0, customers: 0, avgOrder: 0 })
  const [currencyCode, setCurrencyCode] = React.useState("USD")
  const [currencySymbol, setCurrencySymbol] = React.useState("$")

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
      const since = new Date(Date.now() - days * 86400000).toISOString()

      // Fetch Currency settings
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("currency_code, currency_symbol")
        .maybeSingle()

      if (settingsData) {
        if (settingsData.currency_code) setCurrencyCode(settingsData.currency_code)
        if (settingsData.currency_symbol) setCurrencySymbol(settingsData.currency_symbol)
      }

      const { data: orderData } = await supabase
        .from("orders")
        .select("id, total, created_at")
        .gte("created_at", since)
        .order("created_at")

      let totalRev = 0
      let totalOrders = 0

      if (orderData) {
        const byDay: Record<string, { revenue: number; orders: number }> = {}
        orderData.forEach((o: any) => {
          const day = new Date(o.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
          if (!byDay[day]) byDay[day] = { revenue: 0, orders: 0 }
          byDay[day].revenue += Number(o.total)
          byDay[day].orders += 1
        })
        setRevenue(Object.entries(byDay).map(([date, v]) => ({ date, ...v })))
        totalRev = orderData.reduce((s: number, o: any) => s + Number(o.total), 0)
        totalOrders = orderData.length
      }

      const { data: items } = await supabase.from("order_items").select("title, quantity, line_total").limit(200)
      if (items) {
        const map: Record<string, { name: string; revenue: number; units: number }> = {}
        items.forEach((i: any) => {
          if (!map[i.title]) map[i.title] = { name: i.title.slice(0, 18), revenue: 0, units: 0 }
          map[i.title].revenue += Number(i.line_total)
          map[i.title].units += Number(i.quantity)
        })
        setTopProducts(Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5))
      }

      // Calculate unique customers (combining unique emails from orders checkout and profiles table)
      const { data: ordersWithEmail } = await supabase.from("orders").select("shipping_address")
      const uniqueEmails = new Set<string>()
      
      if (ordersWithEmail) {
        ordersWithEmail.forEach((o: any) => {
          const email = o.shipping_address?.email
          if (email) uniqueEmails.add(email.toLowerCase().trim())
        })
      }
      
      const { data: registeredCustomers } = await supabase
        .from("profiles")
        .select("email")
        .eq("role", "customer")
        
      if (registeredCustomers) {
        registeredCustomers.forEach((c: any) => {
          if (c.email) uniqueEmails.add(c.email.toLowerCase().trim())
        })
      }

      setKpi({
        revenue: totalRev,
        orders: totalOrders,
        customers: uniqueEmails.size,
        avgOrder: totalOrders ? totalRev / totalOrders : 0
      })
      setLoading(false)
    }
    load()
  }, [range])

  const kpiCards = [
    { label: "Total Revenue", value: formatCurrency(kpi.revenue, currencyCode, currencySymbol), icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    { label: "Total Orders", value: String(kpi.orders), icon: ShoppingBag, color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
    { label: "Customers", value: String(kpi.customers), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    { label: "Avg Order Value", value: formatCurrency(kpi.avgOrder, currencyCode, currencySymbol), icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
  ]

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Loading business analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black font-serif">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Live operational data and performance insights for Telkidukan.</p>
        </div>
        <div className="flex gap-1 rounded-2xl bg-gray-50 border border-gray-100 p-1 shrink-0 self-start sm:self-auto">
          {(["7d", "30d", "90d"] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                range === r ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-black"
              )}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((stat) => (
          <div key={stat.label} className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
            </div>
            <div>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
               <p className="mt-1 text-2xl font-bold text-black font-sans">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Area Chart */}
      <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
        <div className="mb-6 flex flex-col gap-1">
          <h3 className="font-bold text-lg text-black font-serif">Revenue Trajectory</h3>
          <p className="text-xs text-gray-400 font-medium">Daily billing performance for the selected time range</p>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <Tooltip 
                contentStyle={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}
                labelStyle={{ fontWeight: "bold", color: "#000000" }} 
                formatter={(v: any) => [formatCurrency(v, currencyCode, currencySymbol), "Revenue"]} 
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke={ACCENT} 
                strokeWidth={2.5} 
                fill="url(#revGrad)" 
                dot={{ r: 4, fill: "#fff", stroke: ACCENT, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: ACCENT, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-1">
            <h3 className="font-bold text-lg text-black font-serif">Top Products by Revenue</h3>
            <p className="text-xs text-gray-400 font-medium">Top performing SKUs by absolute sales volume</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-xs font-bold uppercase tracking-widest text-gray-300">No data compiled yet</div>
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#6B7280", fontWeight: "bold" }} width={90} />
                  <Tooltip 
                    contentStyle={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E5E7EB" }}
                    formatter={(v: any) => [formatCurrency(v, currencyCode, currencySymbol), "Revenue"]} 
                  />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={16}>
                    {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-1">
            <h3 className="font-bold text-lg text-black font-serif">Top Products by Units</h3>
            <p className="text-xs text-gray-400 font-medium">Volume count distribution across top purchases</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-xs font-bold uppercase tracking-widest text-gray-300">No data compiled yet</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center h-[240px] gap-6">
              <div className="w-full sm:w-1/2 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topProducts} dataKey="units" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E5E7EB" }}
                      formatter={(v: any) => [v, "Units Sold"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 shrink-0 max-w-[150px]">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-black truncate">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity / Stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-1">
            <h3 className="font-bold text-lg text-black font-serif">Recent Operations Activity</h3>
            <p className="text-xs text-gray-400 font-medium">Real-time status tracking for recent purchases</p>
          </div>
          <RecentOrdersList currencyCode={currencyCode} currencySymbol={currencySymbol} />
        </div>
        
        <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-1">
            <h3 className="font-bold text-lg text-rose-500 font-serif">Low Stock Warnings</h3>
            <p className="text-xs text-gray-400 font-medium">Immediate restock recommended</p>
          </div>
          <LowStockList />
        </div>
      </div>
    </div>
  )
}

function RecentOrdersList({ currencyCode, currencySymbol }: { currencyCode: string; currencySymbol: string }) {
  const supabase = createClient()
  const [orders, setOrders] = React.useState<any[]>([])

  React.useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("orders")
        .select(`
          id, 
          order_number, 
          total, 
          created_at, 
          fulfillment_status,
          order_items(image_url)
        `)
        .order("created_at", { ascending: false })
        .limit(5)
      if (data) setOrders(data)
    }
    load()
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

  return (
    <div className="space-y-4">
      {orders.map(o => {
        const imageUrl = o.order_items?.[0]?.image_url
        return (
          <div key={o.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-black transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {imageUrl ? (
                  <img src={imageUrl} alt={o.order_number} className="h-full w-full object-cover" />
                ) : (
                  <ShoppingBag className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-black">#{o.order_number || o.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-black">{formatCurrency(o.total, currencyCode, currencySymbol)}</p>
              <span className={cn(
                "inline-flex items-center rounded-lg px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest mt-1 border",
                getStatusColor(o.fulfillment_status)
              )}>
                {o.fulfillment_status === 'shipped' ? 'In Transit' : o.fulfillment_status}
              </span>
            </div>
          </div>
        )
      })}
      {orders.length === 0 && <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 text-center py-8">No recent orders registered</p>}
    </div>
  )
}

function LowStockList() {
  const supabase = createClient()
  const [products, setProducts] = React.useState<any[]>([])

  React.useEffect(() => {
    async function load() {
      const { data } = await supabase.from("products").select("id, title, stock_quantity").lt("stock_quantity", 10).order("stock_quantity").limit(5)
      if (data) setProducts(data)
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      {products.map(p => (
        <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 border border-rose-100 hover:border-rose-300 transition-colors duration-300">
          <p className="font-bold text-sm text-black truncate max-w-[150px]">{p.title}</p>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1">{p.stock_quantity} left</span>
        </div>
      ))}
      {products.length === 0 && <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 text-center py-8">All stock levels healthy</p>}
    </div>
  )
}
