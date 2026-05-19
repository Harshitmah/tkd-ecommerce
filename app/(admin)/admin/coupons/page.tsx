"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, Ticket, MoreVertical, Edit, Trash2, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { useSettings } from "@/hooks/useSettings"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

type Coupon = {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount: number
  usage_limit: number | null
  per_customer_limit: number
  times_used: number
  valid_from: string | null
  valid_to: string | null
  is_active: boolean
  created_at: string
}

export default function CouponsPage() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""

  const { settings } = useSettings()
  const currency = settings?.currency_code || "INR"
  const symbol = settings?.currency_symbol || "₹"

  const [coupons, setCoupons] = React.useState<Coupon[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState(q)

  React.useEffect(() => {
    setSearch(q)
  }, [q])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set("q", val)
    } else {
      params.delete("q")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingCoupon, setEditingCoupon] = React.useState<Partial<Coupon> | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)


  const fetchCoupons = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (!error) setCoupons(data || [])
    setLoading(false)
  }

  React.useEffect(() => {
    fetchCoupons()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCoupon?.code || !editingCoupon?.value) return

    setIsSaving(true)
    const payload = {
      code: editingCoupon.code.toUpperCase(),
      type: editingCoupon.type || 'percentage',
      value: Number(editingCoupon.value),
      min_order_amount: Number(editingCoupon.min_order_amount || 0),
      usage_limit: editingCoupon.usage_limit ? Number(editingCoupon.usage_limit) : null,
      per_customer_limit: Number(editingCoupon.per_customer_limit || 1),
      valid_from: editingCoupon.valid_from || null,
      valid_to: editingCoupon.valid_to || null,
      is_active: editingCoupon.is_active ?? true,
    }

    let error
    if (editingCoupon.id) {
      const { error: err } = await supabase.from("coupons").update(payload).eq("id", editingCoupon.id)
      error = err
    } else {
      const { error: err } = await supabase.from("coupons").insert(payload)
      error = err
    }

    setIsSaving(false)
    if (!error) {
      setIsModalOpen(false)
      fetchCoupons()
    } else {
      alert("Error saving coupon: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return
    const { error } = await supabase.from("coupons").delete().eq("id", id)
    if (!error) fetchCoupons()
  }

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const openAddModal = () => {
    setEditingCoupon({
      code: "",
      type: 'percentage',
      value: 0,
      min_order_amount: 0,
      per_customer_limit: 1,
      is_active: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage discounts and promotional codes.</p>
        </div>
        <Button onClick={openAddModal} className="w-full sm:w-auto rounded-2xl h-12 px-6">
          <Plus className="mr-2 h-5 w-5" />
          Create Coupon
        </Button>
      </div>

      <div className="flex items-center gap-4 rounded-3xl border border-white/5 bg-white/5 px-6 py-4">
        <Search className="h-5 w-5 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search by code..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500 text-black font-semibold"
        />
      </div>

      <div className="overflow-hidden rounded-[40px] border border-white/5 bg-white/5 backdrop-blur-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <th className="px-8 py-6">Coupon Code</th>
              <th className="px-8 py-6">Value</th>
              <th className="px-8 py-6">Usage</th>
              <th className="px-8 py-6">Validity</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-zinc-500">Loading coupons...</td>
              </tr>
            ) : filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-zinc-500">No coupons found.</td>
              </tr>
            ) : (
              filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <Ticket className="h-5 w-5" />
                      </div>
                      <span className="font-bold tracking-wider">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-medium">
                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `${formatCurrency(coupon.value, currency, symbol)} OFF`}
                    </span>
                    <p className="text-[10px] text-zinc-500 uppercase mt-1">Min. {formatCurrency(coupon.min_order_amount, currency, symbol)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{coupon.times_used}</span>
                      <span className="text-zinc-500">/ {coupon.usage_limit || '∞'} used</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">
                          {coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString() : 'Always'}
                          {" - "}
                          {coupon.valid_to ? new Date(coupon.valid_to).toLocaleDateString() : 'Always'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {coupon.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-3 py-1 text-xs font-bold text-zinc-500">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(coupon)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon?.id ? "Edit Coupon" : "Create New Coupon"}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Coupon Code</label>
              <Input 
                value={editingCoupon?.code}
                onChange={e => setEditingCoupon(p => ({ ...p, code: e.target.value }))}
                placeholder="E.G. WELCOME20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Type</label>
                <select 
                  value={editingCoupon?.type}
                  onChange={e => setEditingCoupon(p => ({ ...p, type: e.target.value as any }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none focus:border-accent transition-all"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ({symbol})</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Value</label>
                <Input 
                  type="number"
                  value={editingCoupon?.value}
                  onChange={e => setEditingCoupon(p => ({ ...p, value: Number(e.target.value) }))}
                  placeholder="20"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Min Order Amount</label>
                <Input 
                  type="number"
                  value={editingCoupon?.min_order_amount}
                  onChange={e => setEditingCoupon(p => ({ ...p, min_order_amount: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Usage Limit (Total)</label>
                <Input 
                  type="number"
                  value={editingCoupon?.usage_limit || ""}
                  onChange={e => setEditingCoupon(p => ({ ...p, usage_limit: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Valid From</label>
                <Input 
                  type="date"
                  value={editingCoupon?.valid_from ? editingCoupon.valid_from.split('T')[0] : ""}
                  onChange={e => setEditingCoupon(p => ({ ...p, valid_from: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Valid To</label>
                <Input 
                  type="date"
                  value={editingCoupon?.valid_to ? editingCoupon.valid_to.split('T')[0] : ""}
                  onChange={e => setEditingCoupon(p => ({ ...p, valid_to: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <input 
                type="checkbox"
                id="is_active"
                checked={editingCoupon?.is_active}
                onChange={e => setEditingCoupon(p => ({ ...p, is_active: e.target.checked }))}
                className="h-5 w-5 rounded-lg accent-accent"
              />
              <label htmlFor="is_active" className="text-sm font-medium">Active and redeemable</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingCoupon?.id ? "Update Coupon" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
