"use client"

import * as React from "react"
import { getAllCombos, createCombo, updateCombo, deleteCombo } from "@/app/actions/combos"
import { Plus, Trash2, Edit, Loader2, CheckCircle2, Ticket } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { format } from "date-fns"

export default function CombosPage() {
  const [combos, setCombos] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreating, setIsCreating] = React.useState(false)
  const [form, setForm] = React.useState({ name: "", buy_quantity: 2, get_quantity: 2, is_active: true })

  React.useEffect(() => {
    fetchCombos()
  }, [])

  async function fetchCombos() {
    setLoading(true)
    const data = await getAllCombos()
    setCombos(data)
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    const res = await createCombo(form)
    if (res.success) {
      setForm({ name: "", buy_quantity: 2, get_quantity: 2, is_active: true })
      fetchCombos()
    } else {
      alert("Error creating combo: " + res.error)
    }
    setIsCreating(false)
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    await updateCombo(id, { is_active: !currentStatus })
    fetchCombos()
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this combo?")) {
      await deleteCombo(id)
      fetchCombos()
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black font-serif">Combo Offers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage 'Buy X Get Y' dynamic cart offers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-bold text-lg border-b pb-4">Create New Combo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Offer Name</label>
                <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Buy 2 Get 2 Free" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Buy Qty</label>
                  <Input required type="number" min="1" value={form.buy_quantity} onChange={e => setForm(p => ({ ...p, buy_quantity: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Get Qty</label>
                  <Input required type="number" min="1" value={form.get_quantity} onChange={e => setForm(p => ({ ...p, get_quantity: Number(e.target.value) }))} />
                </div>
              </div>
              
              <Button type="submit" disabled={isCreating} className="w-full mt-4">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Offer
              </Button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : combos.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-3xl border border-gray-100">
              <Ticket className="h-10 w-10 text-gray-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-gray-500">No combos created yet</h3>
            </div>
          ) : (
            combos.map(combo => (
              <div key={combo.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${combo.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Ticket className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{combo.name}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Buy {combo.buy_quantity} Get {combo.get_quantity} Free</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleActive(combo.id, combo.is_active)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${combo.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {combo.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => handleDelete(combo.id)} className="h-10 w-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
