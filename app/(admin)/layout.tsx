"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Settings, 
  LogOut, 
  Bell,
  Search,
  Ticket,
  ImagePlus,
  TrendingUp,
  LayoutGrid,
  Star,
  Globe,
  X,
  AlertCircle,
  BookOpen,
  GitBranch
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signOut, user } = useAuth()
  const [mounted, setMounted] = React.useState(false)

  // Search & Notification States
  const q = searchParams.get("q") || ""
  const [globalSearch, setGlobalSearch] = React.useState(q)
  const [alerts, setAlerts] = React.useState<any[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [showNotifications, setShowNotifications] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    setGlobalSearch(q)
  }, [q])

  const handleGlobalSearchChange = (val: string) => {
    setGlobalSearch(val)
    
    let targetPath = "/admin/products"
    const trimmed = val.trim()
    
    // Smart Query Type Detection
    const isOrderQuery = trimmed.startsWith("#") || (/^\d+$/.test(trimmed) && trimmed.length >= 4) || trimmed.toLowerCase().includes("od-")
    const isCustomerQuery = trimmed.includes("@")
    
    if (isOrderQuery) {
      targetPath = "/admin/orders"
    } else if (isCustomerQuery) {
      targetPath = "/admin/customers"
    } else {
      const searchFriendlyPaths = [
        "/admin/products",
        "/admin/orders",
        "/admin/customers",
        "/admin/categories",
        "/admin/coupons",
        "/admin/blogs",
        "/admin/reviews"
      ]
      
      // Check if the current pathname starts with any of the search-friendly prefixes
      const matchedPath = searchFriendlyPaths.find(path => pathname.startsWith(path))
      if (matchedPath) {
        targetPath = matchedPath
      }
    }

    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set("q", val)
    } else {
      params.delete("q")
    }
    router.replace(`${targetPath}?${params.toString()}`, { scroll: false })
  }

  const fetchNotifications = async () => {
    const supabase = createClient()
    const notificationsList: any[] = []

    try {
      // Fetch site settings for dynamic currency
      const { data: settings } = await supabase
        .from("site_settings")
        .select("currency_code, currency_symbol")
        .single()

      const currencyCode = settings?.currency_code || 'INR'
      const currencySymbol = settings?.currency_symbol || '₹'

      // 1. Fetch recent orders (all pending or processing or cancelled orders)
      const { data: recentOrders, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, created_at, total, fulfillment_status, shipping_address, notes")
        .order("created_at", { ascending: false })
        .limit(15)

      if (!ordersError && recentOrders) {
        recentOrders.forEach(o => {
          const time = new Date(o.created_at)
          const name = o.shipping_address?.firstName 
            ? `${o.shipping_address.firstName} ${o.shipping_address.lastName || ""}`
            : "Customer"
            
          if (o.notes?.includes("Cancellation Requested")) {
            notificationsList.push({
              id: `order_cancel_requested_${o.id}`,
              type: 'order_cancelled',
              title: 'Cancellation Requested',
              message: `Cancellation requested for Order #${o.order_number || o.id.slice(0, 8).toUpperCase()} by ${name}.`,
              time,
              link: `/admin/orders`
            })
          } else if (o.fulfillment_status === 'pending') {
            notificationsList.push({
              id: `order_placed_${o.id}`,
              type: 'order_placed',
              title: 'New Order Placed',
              message: `Order #${o.order_number || o.id.slice(0, 8).toUpperCase()} was placed by ${name} for ${formatCurrency(o.total, currencyCode, currencySymbol)}.`,
              time,
              link: `/admin/orders`
            })
          } else if (o.fulfillment_status === 'cancelled') {
            notificationsList.push({
              id: `order_cancelled_${o.id}`,
              type: 'order_cancelled',
              title: 'Order Cancelled by User',
              message: `Order #${o.order_number || o.id.slice(0, 8).toUpperCase()} has been cancelled by ${name}.`,
              time,
              link: `/admin/orders`
            })
          }
        })
      }

      // 2. Fetch low stock items
      const { data: lowStockProducts, error: stockError } = await supabase
        .from("products")
        .select("id, title, stock_quantity")
        .lte("stock_quantity", 5)
        .limit(5)

      if (!stockError && lowStockProducts) {
        lowStockProducts.forEach(p => {
          notificationsList.push({
            id: `low_stock_${p.id}`,
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `Product "${p.title}" has only ${p.stock_quantity} units remaining in inventory.`,
            time: new Date(), // current warning
            link: `/admin/products`
          })
        })
      }

      // 3. Fetch recent customer profile signups
      const { data: recentCustomers, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false })
        .limit(10)

      if (!profilesError && recentCustomers) {
        recentCustomers.forEach(c => {
          const time = new Date(c.created_at)
          const name = c.full_name || c.email?.split('@')[0] || "New Customer"
          notificationsList.push({
            id: `customer_signup_${c.id}`,
            type: 'customer_signup',
            title: 'New Customer Registered',
            message: `Customer "${name}" (${c.email || "no-email"}) created a new profile.`,
            time,
            link: `/admin/customers`
          })
        })
      }

      // Filter out notifications that the user has cleared/dismissed
      const clearedIdsStr = localStorage.getItem("admin_notifications_cleared_ids")
      const clearedIds = clearedIdsStr ? JSON.parse(clearedIdsStr) : []
      const activeNotifications = notificationsList.filter(n => !clearedIds.includes(n.id))

      // Sort chronologically descending
      activeNotifications.sort((a, b) => b.time.getTime() - a.time.getTime())
      setAlerts(activeNotifications)

      // Calculate unread count based on localStorage timestamp
      const lastReadTimeStr = localStorage.getItem("admin_notifications_last_read")
      if (lastReadTimeStr) {
        const lastRead = new Date(lastReadTimeStr)
        const unread = activeNotifications.filter(n => n.time > lastRead).length
        setUnreadCount(unread)
      } else {
        setUnreadCount(activeNotifications.length)
      }
    } catch (err) {
      console.error("Error fetching notifications:", err)
    }
  }

  // Fetch notifications on mount and set up periodic updates every 15 seconds
  React.useEffect(() => {
    if (!user) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [user])

  const markAllAsRead = () => {
    localStorage.setItem("admin_notifications_last_read", new Date().toISOString())
    setUnreadCount(0)
  }

  const clearAllNotifications = () => {
    markAllAsRead()
    const currentIds = alerts.map(a => a.id)
    const existingClearedStr = localStorage.getItem("admin_notifications_cleared_ids")
    const existingCleared = existingClearedStr ? JSON.parse(existingClearedStr) : []
    const updatedCleared = Array.from(new Set([...existingCleared, ...currentIds]))
    localStorage.setItem("admin_notifications_cleared_ids", JSON.stringify(updatedCleared))
    setAlerts([])
  }

  // ── Session Timeout Logic (1 Hour) ────────────────────
  React.useEffect(() => {
    if (pathname === "/admin/login" || !user) return

    const TIMEOUT_MS = 60 * 60 * 1000 // 1 hour
    const STORAGE_KEY = "admin_last_active"

    // Update the last active timestamp in localStorage
    const updateActivity = () => {
      const now = Date.now()
      const lastSaved = localStorage.getItem(STORAGE_KEY)
      // Throttle writes to localStorage to every 10 seconds
      if (!lastSaved || now - parseInt(lastSaved) > 10000) {
        localStorage.setItem(STORAGE_KEY, now.toString())
      }
    }

    // Check if the session has expired
    const checkSession = async () => {
      const lastSaved = localStorage.getItem(STORAGE_KEY)
      if (lastSaved) {
        const inactiveDuration = Date.now() - parseInt(lastSaved)
        if (inactiveDuration > TIMEOUT_MS) {
          // Session expired! Sign out and redirect
          localStorage.removeItem(STORAGE_KEY)
          await signOut()
          window.location.href = "/admin/login?error=timeout"
        }
      } else {
        // Initialize if not set
        localStorage.setItem(STORAGE_KEY, Date.now().toString())
      }
    }

    // Initialize activity on mount
    updateActivity()

    // Add activity event listeners
    const events = ["mousedown", "keydown", "scroll", "touchstart"]
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // Listen for tab switching / window focus
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        checkSession()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityOrFocus)
    window.addEventListener("focus", handleVisibilityOrFocus)

    // Periodic check every 10 seconds
    const interval = setInterval(checkSession, 10000)

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus)
      window.removeEventListener("focus", handleVisibilityOrFocus)
      clearInterval(interval)
    }
  }, [pathname, user, signOut])

  if (!mounted) return null

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products",  href: "/admin/products",  icon: Package },
    { name: "Categories", href: "/admin/categories", icon: LayoutGrid },
    { name: "Orders",    href: "/admin/orders",    icon: ShoppingBag },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Coupons",   href: "/admin/coupons",   icon: Ticket },
    { name: "Media",     href: "/admin/media",     icon: ImagePlus },
    { name: "Reviews",   href: "/admin/reviews",   icon: Star },
    { name: "Workflows", href: "/admin/workflows", icon: GitBranch },
    { name: "SEO",       href: "/admin/seo",       icon: Globe },
    { name: "Blogs",     href: "/admin/blogs",     icon: BookOpen },
    { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
    { name: "Settings",  href: "/admin/settings",  icon: Settings },
  ]

  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-[#F4F5F7]">
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F4F5F7] text-[#111827] font-sans">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-40">
        {/* Logo */}
        <div className="flex h-20 items-center px-6 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center">
               <span className="text-white font-bold text-lg italic">T</span>
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-black">Telkidukan</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto mt-2">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  active 
                    ? "bg-gray-100 text-black font-semibold shadow-sm" 
                    : "text-gray-500 hover:text-black hover:bg-gray-50"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-colors", active ? "text-black" : "text-gray-400 group-hover:text-black")} />
                <span className="text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sign-out */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={async () => {
              await signOut()
              window.location.href = "/admin/login"
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1 ml-64 min-w-0">
        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-gray-200 sticky top-0 z-30">
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2 text-sm">
             <span className="text-gray-400">Admin</span>
             <span className="text-gray-300">/</span>
             <span className="font-semibold capitalize">{pathname.split('/').pop() || 'Dashboard'}</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden lg:flex items-center gap-3 w-64 bg-gray-100 border border-transparent rounded-full px-4 py-2 transition-all focus-within:bg-white focus-within:border-gray-200">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={globalSearch}
                onChange={(e) => handleGlobalSearchChange(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder:text-gray-500 text-black font-semibold"
              />
            </div>

            {/* Bell Icon & Dropdown Popover */}
            <div className="relative">
              <button 
                onClick={() => {
                  if (showNotifications) {
                    markAllAsRead()
                  }
                  setShowNotifications(!showNotifications)
                }}
                className={cn(
                  "relative p-2.5 transition-all bg-gray-100 hover:bg-gray-200 rounded-full",
                  showNotifications ? "text-black bg-gray-200" : "text-gray-400 hover:text-black"
                )}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[9px] font-extrabold text-white leading-none shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    onClick={() => {
                      markAllAsRead()
                      setShowNotifications(false)
                    }}
                    className="fixed inset-0 z-40" 
                  />
                  {/* Glassmorphic Dropdown Popover */}
                  <div className="absolute right-0 mt-3 w-96 rounded-[28px] border border-gray-150 bg-white/95 backdrop-blur-md shadow-2xl p-6 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-black to-zinc-700" />
                    
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-sm font-bold text-black">Notifications</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
                          {unreadCount} unread messages
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          clearAllNotifications()
                          setShowNotifications(false)
                        }}
                        className="text-[9px] font-extrabold text-zinc-400 hover:text-black uppercase tracking-widest border border-gray-100 hover:border-black rounded-lg px-2.5 py-1.5 transition-all"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="mt-4 max-h-[320px] overflow-y-auto pr-1 space-y-3">
                      {alerts.length > 0 ? (
                        alerts.map((alert) => (
                          <Link
                            key={alert.id}
                            href={alert.link}
                            onClick={() => {
                              markAllAsRead()
                              setShowNotifications(false)
                            }}
                            className="flex gap-3.5 p-3.5 hover:bg-zinc-50 rounded-2xl border border-transparent hover:border-zinc-100 transition-all duration-200"
                          >
                             <div className={cn(
                               "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                               alert.type === 'order_placed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               alert.type === 'order_cancelled' ? "bg-rose-50 text-rose-500 border-rose-100" :
                               alert.type === 'customer_signup' ? "bg-blue-50 text-blue-600 border-blue-100" :
                               "bg-amber-50 text-amber-500 border-amber-100"
                             )}>
                               {alert.type === 'order_placed' ? <ShoppingBag className="h-5 w-5" /> :
                                alert.type === 'order_cancelled' ? <X className="h-5 w-5" /> :
                                alert.type === 'customer_signup' ? <Users className="h-5 w-5" /> :
                                <AlertCircle className="h-5 w-5" />}
                             </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-extrabold text-black uppercase tracking-wider">{alert.title}</p>
                              <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">{alert.message}</p>
                              <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-widest mt-1.5 block">
                                {new Date(alert.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {new Date(alert.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="py-12 text-center flex flex-col items-center justify-center">
                          <div className="h-12 w-12 bg-gray-50 border border-gray-100 text-gray-300 rounded-2xl flex items-center justify-center mb-3">
                            <Bell className="h-5 w-5" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">All caught up!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200 mx-2" />

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                 <p className="text-xs font-bold text-black uppercase tracking-widest">Administrator</p>
                 <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{user?.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center border-2 border-gray-100">
                <span className="text-white text-sm font-bold">
                  {user?.email?.[0].toUpperCase() ?? "A"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Loading admin panel...</p>
      </div>
    }>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </React.Suspense>
  )
}
