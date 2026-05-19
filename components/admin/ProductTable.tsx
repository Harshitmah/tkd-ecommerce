"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Edit, Eye, Trash2, Search, Filter, ShoppingBag, ArrowUpDown } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useSettings } from "@/hooks/useSettings"

interface ProductTableProps {
  products: any[]
}

export default function ProductTable({ products: initialProducts }: ProductTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""
  
  const [productsList, setProductsList] = React.useState(initialProducts)
  const supabase = createClient()
  const { settings } = useSettings()
  const currency = settings?.currency_code || "INR"
  const symbol = settings?.currency_symbol || "₹"

  // Filters State
  const [search, setSearch] = React.useState(q)
  const [selectedCategory, setSelectedCategory] = React.useState("all")
  const [selectedStatus, setSelectedStatus] = React.useState("all")

  // Multi-select / Bulk operations state
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = (visibleItems: any[]) => {
    const visibleIds = visibleItems.map(item => item.id)
    const allSelected = visibleIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) return
    
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .in("id", selectedIds)
      
      if (error) throw error
      
      setProductsList(prev => prev.filter(p => !selectedIds.includes(p.id)))
      setSelectedIds([])
      router.refresh()
    } catch (err: any) {
      alert("Error deleting products: " + err.message)
    }
  }

  const handleBulkStatus = async (status: "active" | "draft") => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ status })
        .in("id", selectedIds)
      
      if (error) throw error
      
      setProductsList(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status } : p))
      setSelectedIds([])
      router.refresh()
    } catch (err: any) {
      alert("Error updating status: " + err.message)
    }
  }

  // Sync initialProducts if server component updates
  React.useEffect(() => {
    setProductsList(initialProducts)
  }, [initialProducts])

  React.useEffect(() => {
    setSearch(q)
  }, [q])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    const params = new URLSearchParams(window.location.search)
    if (val) {
      params.set("q", val)
    } else {
      params.delete("q")
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) throw error
      
      setProductsList(prev => prev.filter(p => p.id !== id))
      router.refresh()
    } catch (error: any) {
      alert("Error deleting product: " + error.message)
    }
  }

  // Get unique categories list from product catalog
  const uniqueCategories = React.useMemo(() => {
    const list = initialProducts.map(p => p.category?.name).filter(Boolean)
    return Array.from(new Set(list))
  }, [initialProducts])

  // Filter products catalog
  const filteredProducts = React.useMemo(() => {
    return productsList.filter((product) => {
      const searchLower = search.toLowerCase()
      const titleMatches = product.title.toLowerCase().includes(searchLower)
      const skuMatches = (product.sku || "").toLowerCase().includes(searchLower)
      const catMatches = (product.category?.name || "").toLowerCase().includes(searchLower)
      const matchesSearch = titleMatches || skuMatches || catMatches

      const matchesCategory = selectedCategory === "all" || product.category?.name === selectedCategory
      const matchesStatus = selectedStatus === "all" || product.status === selectedStatus

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [productsList, search, selectedCategory, selectedStatus])

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Search & Filters Toolbar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Live Search Input */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, SKU or category..." 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-white focus:border-gray-200 transition-all placeholder:text-gray-400 text-black font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* Category Dropdown */}
            <div className="flex items-center gap-2 border border-gray-100 rounded-xl px-4 py-2 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-0 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-black outline-none cursor-pointer pr-2"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="bg-gray-50 rounded-xl p-1 flex border border-gray-100">
               <button 
                 onClick={() => setSelectedStatus("all")}
                 className={cn(
                   "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                   selectedStatus === "all" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-black"
                 )}
               >
                 All
               </button>
               <button 
                 onClick={() => setSelectedStatus("active")}
                 className={cn(
                   "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                   selectedStatus === "active" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-black"
                 )}
               >
                 Active
               </button>
               <button 
                 onClick={() => setSelectedStatus("draft")}
                 className={cn(
                   "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                   selectedStatus === "draft" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-black"
                 )}
               >
                 Draft
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
            <span className="text-sm font-bold text-black uppercase tracking-wider">{selectedIds.length} products selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => handleBulkStatus("active")}
              className="px-4 py-2 bg-white border border-zinc-250 hover:bg-zinc-50 text-xs font-bold uppercase tracking-wider text-black rounded-2xl transition-all"
            >
              Set Active
            </button>
            <button 
              onClick={() => handleBulkStatus("draft")}
              className="px-4 py-2 bg-white border border-zinc-250 hover:bg-zinc-50 text-xs font-bold uppercase tracking-wider text-black rounded-2xl transition-all"
            >
              Set Draft
            </button>
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold uppercase tracking-wider text-red-600 rounded-2xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Products Table Container */}
      <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <th className="px-8 py-5 w-[5%]">
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p.id))}
                  onChange={() => toggleSelectAll(filteredProducts)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer accent-black"
                />
              </th>
              <th className="px-8 py-5">Product Info</th>
              <th className="px-8 py-5">Category</th>
              <th className="px-8 py-5">Pricing</th>
              <th className="px-8 py-5">Inventory</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right pr-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProducts.map((product) => (
              <tr key={product.id} className={cn("group hover:bg-gray-50/50 transition-colors", selectedIds.includes(product.id) && "bg-gray-50")}>
                <td className="px-8 py-6">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer accent-black"
                  />
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl bg-gray-100 border border-gray-200">
                      {product.images?.[0] && (
                        <img 
                          src={product.images[0].image_url} 
                          alt={product.title} 
                          className="h-full w-full object-cover transition-all duration-500" 
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-sm text-black">{product.title}</p>
                      <p className="text-[10px] font-medium text-gray-400 tracking-wider">NX-{product.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{product.category?.name || "Uncategorized"}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-black">{formatCurrency(product.sale_price || product.price, currency, symbol)}</span>
                    {product.sale_price && (
                      <span className="text-[10px] text-gray-400 line-through">{formatCurrency(product.price, currency, symbol)}</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                     <div className={cn(
                       "h-1.5 w-1.5 rounded-full",
                       product.stock_quantity > 10 ? "bg-green-500" : "bg-amber-500"
                     )} />
                     <span className="text-xs font-bold text-gray-600">
                       {product.stock_quantity} <span className="font-medium text-gray-400">units</span>
                     </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={cn(
                    "inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest",
                    product.status === "active" ? "bg-black text-white" : "bg-gray-100 text-gray-400"
                  )}>
                    {product.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right pr-12">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <button className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all">
                        <Edit className="h-4 w-4" />
                      </button>
                    </Link>
                    <button 
                      onClick={() => window.open(`/products/${product.slug}`, '_blank')}
                      className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/20">
             <div className="h-16 w-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-gray-300" />
             </div>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}
