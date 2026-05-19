"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { ShoppingBag, Search, Menu, User, X, ChevronDown, Heart } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { useWishlist } from "@/hooks/useWishlist"
import { useSettings } from "@/hooks/useSettings"
import { createClient } from "@/lib/supabase/client"
import { SearchModal } from "./SearchModal"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const { itemCount, setIsCartOpen } = useCart()
  const { wishlistCount } = useWishlist()
  const { settings } = useSettings()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobileShopOpen, setIsMobileShopOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  
  const [categories, setCategories] = React.useState<any[]>([])
  const [products, setProducts] = React.useState<any[]>([])
  
  // Unified Dropdown State: 'shop' | category_uuid | null
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null)
  const [megaMenuTimer, setMegaMenuTimer] = React.useState<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    setMounted(true)
    async function loadHeaderData() {
      try {
        const client = createClient()
        // 1. Fetch categories
        const { data: catData } = await client
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true })
        if (catData) setCategories(catData)

        // 2. Fetch products
        const { data: prodData } = await client
          .from("products")
          .select(`
            id,
            title,
            slug,
            category_id,
            price,
            images:product_images(image_url)
          `)
          .eq("status", "active")
        if (prodData) setProducts(prodData)
      } catch (err) {
        console.error("Error loading header navigation data:", err)
      }
    }
    loadHeaderData()
  }, [])

  // Auto-close mobile navigation menu when resizing back to desktop width
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleMouseEnter = (menuId: string) => {
    if (megaMenuTimer) clearTimeout(megaMenuTimer)
    setActiveDropdown(menuId)
  }

  const handleMouseLeave = () => {
    const timer = setTimeout(() => {
      setActiveDropdown(null)
    }, 200) // Smooth buffer transition
    setMegaMenuTimer(timer)
  }

  const { scrollY } = useScroll()
  const headerBg = useTransform(
    scrollY,
    [0, 50],
    ["rgba(255, 255, 255, 0.98)", "rgba(255, 255, 255, 0.98)"]
  )
  const headerHeight = useTransform(scrollY, [0, 50], ["80px", "64px"])
  const headerBorder = useTransform(
    scrollY,
    [0, 50],
    ["rgba(0, 0, 0, 0.05)", "rgba(0, 0, 0, 0.05)"]
  )

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/products" },
    { name: "Blog", href: "/blog" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ]

  const showAnnouncement = settings?.announcement_bar_active && settings?.announcement_bar_text

  if (!mounted) return <div className="h-20" />

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 flex flex-col w-full">
        {showAnnouncement && (
          <div 
            style={{ backgroundColor: settings.announcement_bar_color || "#1A1A1A" }} 
            className="w-full h-9 flex items-center justify-center text-center px-4"
          >
            {settings.announcement_bar_link ? (
              <Link href={settings.announcement_bar_link} className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white hover:underline flex items-center gap-1.5 justify-center">
                {settings.announcement_bar_text}
              </Link>
            ) : (
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">
                {settings.announcement_bar_text}
              </span>
            )}
          </div>
        )}
        
        <motion.header
          style={{ 
            height: headerHeight, 
            backgroundColor: headerBg,
            borderBottomColor: headerBorder 
          }}
          className="w-full flex items-center px-4 md:px-16 border-b transition-all duration-300 backdrop-blur-md relative"
        >
          {/* Organically flowing navigation container (fixed link squeezes) */}
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between relative">
            
            {/* Left Nav: Scales dynamically using flex-1 with smaller padding gaps */}
            <div className="flex items-center flex-1 justify-start shrink-0 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-start lg:hidden text-black cursor-pointer hover:scale-105 active:scale-95 transition-all"
                aria-label="Open mobile menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <nav className="hidden items-center gap-6 lg:flex flex-wrap-none">
                {/* 1. Home Link */}
                <Link
                  href="/"
                  className="relative py-2 flex flex-col items-center group/link cursor-pointer whitespace-nowrap"
                >
                  <span
                    className={cn(
                      "text-[9px] font-extrabold uppercase tracking-[0.16em] transition-colors duration-300",
                      pathname === "/" ? "text-black" : "text-zinc-400 group-hover/link:text-black"
                    )}
                  >
                    Home
                  </span>
                  {pathname === "/" && (
                    <motion.div 
                      layoutId="activeNavIndicator" 
                      className="absolute bottom-0 h-[4px] w-[4px] rounded-full bg-black" 
                    />
                  )}
                </Link>

                {/* 2. Shop Link (Triggers Mega Menu) */}
                <div 
                  onMouseEnter={() => handleMouseEnter("shop")}
                  onMouseLeave={handleMouseLeave}
                  className="relative py-2 flex flex-col items-center group/link cursor-pointer whitespace-nowrap"
                >
                  <Link href="/products" className="flex items-center gap-0.5">
                    <span
                      className={cn(
                        "text-[9px] font-extrabold uppercase tracking-[0.16em] transition-colors duration-300",
                        pathname.startsWith("/products") && !pathname.includes("category=") ? "text-black" : "text-zinc-400 group-hover/link:text-black"
                      )}
                    >
                      Shop
                    </span>
                    <ChevronDown className="h-3 w-3 text-zinc-400 group-hover/link:text-black transition-colors" />
                  </Link>
                  {pathname.startsWith("/products") && !pathname.includes("category=") && (
                    <motion.div 
                      layoutId="activeNavIndicator" 
                      className="absolute bottom-0 h-[4px] w-[4px] rounded-full bg-black" 
                    />
                  )}
                </div>

                {/* 3. Category Tabs (Dynamic mega menus per category, fixed wrapping with tracking changes) */}
                {settings?.show_categories_in_navbar && categories.map((cat) => {
                  const href = `/products?category=${cat.slug}`
                  const isActive = pathname.includes(`category=${cat.slug}`)
                  return (
                    <div
                      key={cat.id}
                      onMouseEnter={() => handleMouseEnter(cat.id)}
                      onMouseLeave={handleMouseLeave}
                      className="relative py-2 flex flex-col items-center group/link cursor-pointer whitespace-nowrap"
                    >
                      <Link href={href} className="flex items-center gap-0.5">
                        <span
                          className={cn(
                            "text-[9px] font-extrabold uppercase tracking-[0.16em] transition-colors duration-300",
                            isActive ? "text-black" : "text-zinc-400 group-hover/link:text-black"
                          )}
                        >
                          {cat.name}
                        </span>
                        <ChevronDown className="h-3 w-3 text-zinc-300 group-hover/link:text-black transition-colors" />
                      </Link>
                      {isActive && (
                        <motion.div 
                          layoutId="activeNavIndicator" 
                          className="absolute bottom-0 h-[4px] w-[4px] rounded-full bg-black" 
                        />
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>

            {/* Center: Logo (Stays centered, no longer squished) */}
            <div className="flex items-center justify-center px-6 md:px-10 shrink-0">
              <Link href="/" className="flex items-center group">
                 {settings?.logo_url ? (
                   <img 
                     src={settings.logo_url} 
                     alt={settings.site_name || "Logo"} 
                     className="h-7 md:h-9 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                   />
                 ) : (
                   <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-black uppercase leading-none">
                        {settings?.site_name || "Telkidukan"}
                      </span>
                      <div className="h-5 md:h-6 w-[2px] bg-black rotate-[15deg] group-hover:rotate-[30deg] transition-transform duration-500" />
                   </div>
                 )}
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-1 md:gap-3 lg:gap-4 flex-1 shrink-0 min-w-0">
              <nav className="hidden items-center gap-8 mr-6 lg:flex">
                {navLinks.slice(2).map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="relative py-2 flex flex-col items-center group/link cursor-pointer whitespace-nowrap"
                  >
                    <span
                      className={cn(
                        "text-[9px] font-extrabold uppercase tracking-[0.16em] transition-colors duration-300",
                        pathname === link.href ? "text-black" : "text-zinc-400 group-hover/link:text-black"
                      )}
                    >
                      {link.name}
                    </span>
                    {pathname === link.href && (
                      <motion.div 
                        layoutId="activeNavIndicator" 
                        className="absolute bottom-0 h-[4px] w-[4px] rounded-full bg-black" 
                      />
                    )}
                  </Link>
                ))}
              </nav>

              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center transition-all hover:scale-105 active:scale-95 text-black cursor-pointer"
                aria-label="Search products"
              >
                <Search className="h-4.5 w-4.5 stroke-[1.5]" />
              </button>
              
              <Link
                href="/wishlist"
                className="group relative flex h-10 w-10 items-center justify-center text-black cursor-pointer transition-all hover:scale-105 active:scale-95"
                aria-label="Wishlist"
              >
                <Heart className="h-4.5 w-4.5 stroke-[1.5]" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[7px] font-bold text-white leading-none">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/account"
                className="hidden md:flex h-10 w-10 items-center justify-center transition-all hover:scale-105 active:scale-95 text-black"
                aria-label="Your account"
              >
                <User className="h-4.5 w-4.5 stroke-[1.5]" />
              </Link>

              <button 
                onClick={() => setIsCartOpen(true)}
                className="group relative flex h-10 w-10 items-center justify-center text-black cursor-pointer transition-all hover:scale-105 active:scale-95"
                aria-label="Shopping bag"
              >
                <ShoppingBag className="h-4.5 w-4.5 stroke-[1.5]" />
                {itemCount > 0 && (
                  <span className="absolute top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[7px] font-bold text-white leading-none">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Desktop Mega Menu Dropdown Panels */}
          <AnimatePresence>
            {activeDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                onMouseEnter={() => handleMouseEnter(activeDropdown)}
                onMouseLeave={handleMouseLeave}
                className="absolute left-0 right-0 top-full z-40 w-full bg-white/98 border-b border-black/5 shadow-premium backdrop-blur-md px-16 py-12"
              >
                {activeDropdown === "shop" ? (
                  /* Standard Global "Shop" Mega Menu */
                  <div className="mx-auto max-w-[1600px] grid grid-cols-12 gap-12 text-left">
                     {/* Column 1: Shop by Category */}
                     <div className="col-span-4 space-y-6">
                        <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">Shop by Category</span>
                        <div className="grid gap-4">
                           {categories.map((cat) => (
                              <Link 
                                 key={cat.id} 
                                 href={`/products?category=${cat.slug}`}
                                 onClick={() => setActiveDropdown(null)}
                                 className="group/item flex items-center gap-4 p-2 rounded-xl hover:bg-black/[0.02] transition-all"
                              >
                                 {cat.image_url && (
                                    <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-zinc-100">
                                       <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover transition-transform group-hover/item:scale-105" />
                                    </div>
                                 )}
                                 <div>
                                    <h4 className="font-serif text-sm font-bold text-black uppercase tracking-wider group-hover/item:text-blue-600 transition-colors">{cat.name}</h4>
                                    <p className="text-[10px] text-zinc-400 font-medium line-clamp-1 mt-0.5">{cat.description || "Discover premium quality cold-pressed oils"}</p>
                                  </div>
                              </Link>
                           ))}
                        </div>
                     </div>

                     {/* Column 2: Curated Collections */}
                     <div className="col-span-4 space-y-6 border-l border-black/5 pl-12">
                        <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">Curated Collections</span>
                        <div className="flex flex-col gap-6">
                           {[
                              { name: "New Arrivals", desc: "Experience our freshest small-batch cold-press extractions", href: "/products?sort=newest" },
                              { name: "Best Sellers", desc: "Our most trusted, high-altitude wood-pressed essentials", href: "/products" },
                              { name: "Single Origin Premium", desc: "Sourced direct from coastal farms and high mountain valleys", href: "/about" },
                           ].map((item) => (
                              <Link 
                                 key={item.name} 
                                 href={item.href}
                                 onClick={() => setActiveDropdown(null)}
                                 className="group/col-item block"
                              >
                                 <h4 className="font-serif text-sm font-bold text-black uppercase tracking-wider group-hover/col-item:text-blue-600 transition-colors">{item.name}</h4>
                                 <p className="text-[10px] text-zinc-400 font-medium mt-1 leading-relaxed">{item.desc}</p>
                              </Link>
                           ))}
                        </div>
                     </div>

                     {/* Column 3: Premium Brand Card */}
                     <div className="col-span-4 relative overflow-hidden rounded-[20px] bg-black text-white p-8 flex flex-col justify-between min-h-[260px]">
                        <div className="absolute inset-0 opacity-40">
                           <img 
                              src="https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800" 
                              alt="Botanical Pure Essence" 
                              className="h-full w-full object-cover grayscale" 
                           />
                        </div>
                        <div className="relative z-10 text-left">
                           <span className="text-[8px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">Botanical Guarantee</span>
                           <h3 className="mt-3 font-serif text-lg font-extrabold leading-tight uppercase tracking-tight">Zero Thermal Searing</h3>
                           <p className="mt-2 text-[10px] text-zinc-400 font-medium leading-relaxed max-w-[220px]">Every drop is stone-extracted below 38°C to retain all vital nutrient values.</p>
                        </div>
                        <div className="relative z-10 pt-4 text-left">
                           <Link href="/about" onClick={() => setActiveDropdown(null)}>
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white border-b border-white pb-0.5 hover:text-zinc-300 transition-colors">
                                 Extraction Story &rarr;
                              </span>
                           </Link>
                        </div>
                     </div>
                  </div>
                ) : (
                  /* Dynamic Category-Specific Product Mega Menu (fixed category hover show products) */
                  (() => {
                    const activeCat = categories.find(c => c.id === activeDropdown)
                    const catProducts = products.filter(p => p.category_id === activeDropdown).slice(0, 12)
                    return (
                      <div className="mx-auto max-w-[1600px] grid grid-cols-12 gap-12 text-left">
                        {/* Title & Stats */}
                        <div className="col-span-3 space-y-4">
                          <span className="text-[8px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">Collection Showcase</span>
                          <h3 className="font-serif text-xl font-bold text-black uppercase tracking-wider mt-2">{activeCat?.name}</h3>
                          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-2 pr-6">
                            {activeCat?.description || "Explore small-batch wood pressed organic oils, extracted at room temperature to preserve natural therapeutic components."}
                          </p>
                          <div className="pt-2">
                            <Link 
                              href={`/products?category=${activeCat?.slug}`}
                              onClick={() => setActiveDropdown(null)}
                              className="text-[9px] font-bold uppercase tracking-widest text-black border-b border-black pb-0.5 hover:text-zinc-600 transition-colors"
                            >
                              Explore Complete Range &rarr;
                            </Link>
                          </div>
                        </div>

                        {/* Products Display (list of product names only) */}
                        <div className="col-span-9 border-l border-black/5 pl-10">
                          <span className="text-[8px] font-extrabold uppercase tracking-[0.3em] text-zinc-400 block mb-6">Products in this Category</span>
                          {catProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-4">
                              {catProducts.map((p) => {
                                return (
                                  <Link 
                                    key={p.id}
                                    href={`/products/${p.slug}`}
                                    onClick={() => setActiveDropdown(null)}
                                    className="group/product-item flex items-center py-1.5 transition-all"
                                  >
                                    <h4 className="font-serif text-sm font-bold text-black uppercase tracking-wider group-hover/product-item:text-blue-600 transition-colors leading-tight">
                                      {p.title}
                                    </h4>
                                  </Link>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-col items-start p-4 bg-zinc-50/50 rounded-2xl border border-dashed border-black/10 min-h-[120px] justify-center">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-black">Harvest in Process</span>
                              <p className="text-[9px] text-zinc-400 font-medium mt-1 leading-relaxed max-w-[200px]">We are cold-pressing the next small batch of fresh harvests. Available shortly!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop (High z-index to overlay float widgets) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs"
            />
            {/* Drawer (High z-index, Clean White Luxury Styling) */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed bottom-0 left-0 top-0 z-[10000] flex w-[300px] flex-col bg-white/98 backdrop-blur-md p-8 shadow-2xl text-left justify-between border-r border-black/5 text-zinc-900"
            >
              <div className="flex flex-col gap-10">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-6 border-b border-black/5 animate-in fade-in duration-300">
                  {settings?.logo_url ? (
                    <img 
                      src={settings.logo_url} 
                      alt={settings.site_name || "Logo"} 
                      className="h-8 w-auto object-contain"
                    />
                  ) : settings?.logo_inverted_url ? (
                    <img 
                      src={settings.logo_inverted_url} 
                      alt={settings.site_name || "Logo"} 
                      className="h-8 w-auto object-contain brightness-0"
                    />
                  ) : (
                    <span className="font-serif text-2xl font-extrabold tracking-tight text-black uppercase">
                      {settings?.site_name || "Telkidukan"}
                    </span>
                  )}
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5 text-zinc-500 hover:text-black cursor-pointer transition-all active:scale-90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Drawer Links with Collapsible Mobile categories tree */}
                <nav className="flex flex-col gap-5">
                  {/* Home Link */}
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative py-1 flex items-center group/mobile-link cursor-pointer whitespace-nowrap"
                  >
                    <span className={cn(
                      "text-sm font-extrabold uppercase tracking-[0.25em] transition-colors duration-300",
                      pathname === "/" ? "text-black" : "text-zinc-400 group-hover/mobile-link:text-black"
                    )}>
                      Home
                    </span>
                    {pathname === "/" && (
                      <motion.span 
                        layoutId="activeMobileNavDot" 
                        className="ml-3 h-[5px] w-[5px] rounded-full bg-black block" 
                      />
                    )}
                  </Link>

                  {/* Shop Collapsible Link with category sub-menu */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between py-1">
                      <Link
                        href="/products"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="relative flex items-center group/mobile-link cursor-pointer whitespace-nowrap"
                      >
                        <span className={cn(
                          "text-sm font-extrabold uppercase tracking-[0.25em] transition-colors duration-300",
                          pathname.startsWith("/products") ? "text-black" : "text-zinc-400 group-hover/mobile-link:text-black"
                        )}>
                          Shop
                        </span>
                        {pathname.startsWith("/products") && (
                          <motion.span 
                            layoutId="activeMobileNavDot" 
                            className="ml-3 h-[5px] w-[5px] rounded-full bg-black block" 
                          />
                        )}
                      </Link>
                      <button 
                        onClick={() => setIsMobileShopOpen(!isMobileShopOpen)}
                        className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-black active:scale-90 transition-all cursor-pointer"
                      >
                        <motion.span animate={{ rotate: isMobileShopOpen ? 180 : 0 }}>
                           <ChevronDown className="h-4 w-4" />
                        </motion.span>
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isMobileShopOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden pl-4 flex flex-col gap-3.5 border-l border-black/5 mt-2"
                        >
                          <Link
                            href="/products"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black transition-colors py-1 block text-left"
                          >
                            Shop All Collection
                          </Link>
                          {categories.map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/products?category=${cat.slug}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black transition-colors py-1 block text-left whitespace-nowrap"
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Rest of links: About, Contact */}
                  <Link
                    href="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative py-1 flex items-center group/mobile-link cursor-pointer whitespace-nowrap"
                  >
                    <span className={cn(
                      "text-sm font-extrabold uppercase tracking-[0.25em] transition-colors duration-300",
                      pathname === "/about" ? "text-black" : "text-zinc-400 group-hover/mobile-link:text-black"
                    )}>
                      About
                    </span>
                    {pathname === "/about" && (
                      <motion.span 
                        layoutId="activeMobileNavDot" 
                        className="ml-3 h-[5px] w-[5px] rounded-full bg-black block" 
                      />
                    )}
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative py-1 flex items-center group/mobile-link cursor-pointer whitespace-nowrap"
                  >
                    <span className={cn(
                      "text-sm font-extrabold uppercase tracking-[0.25em] transition-colors duration-300",
                      pathname === "/contact" ? "text-black" : "text-zinc-400 group-hover/mobile-link:text-black"
                    )}>
                      Contact
                    </span>
                    {pathname === "/contact" && (
                      <motion.span 
                        layoutId="activeMobileNavDot" 
                        className="ml-3 h-[5px] w-[5px] rounded-full bg-black block" 
                      />
                    )}
                  </Link>

                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative py-1 flex items-center group/mobile-link cursor-pointer whitespace-nowrap"
                  >
                    <span className={cn(
                      "text-sm font-extrabold uppercase tracking-[0.25em] transition-colors duration-300",
                      pathname === "/account" ? "text-black" : "text-zinc-400 group-hover/mobile-link:text-black"
                    )}>
                      Account Portal
                    </span>
                    {pathname === "/account" && (
                      <motion.span 
                        layoutId="activeMobileNavDot" 
                        className="ml-3 h-[5px] w-[5px] rounded-full bg-black block" 
                      />
                    )}
                  </Link>
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="pt-6 border-t border-black/5">
                <span className="text-[7px] font-extrabold uppercase tracking-[0.3em] text-zinc-400 block mb-2">
                  Customer Concierge
                </span>
                <a 
                  href={`mailto:${settings?.contact_email}`} 
                  className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors duration-200"
                >
                  {settings?.contact_email || "info@gmail.com"}
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
