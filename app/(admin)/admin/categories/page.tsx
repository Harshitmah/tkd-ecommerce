"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, Edit, Trash2, ChevronRight, Image as ImageIcon, Loader2, Upload, Download, MoreVertical } from "lucide-react"
import { cn, slugify } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { uploadCategoryImage } from "@/app/actions/storage"
import MediaSelectorModal from "@/components/admin/MediaSelectorModal"
import { useRouter, usePathname, useSearchParams } from "next/navigation"


type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  created_at: string
}

export default function CategoriesPage() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""

  const [categories, setCategories] = React.useState<Category[]>([])
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
  const [editingCategory, setEditingCategory] = React.useState<Partial<Category> | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = React.useState(false)

  // Multi-select / Bulk operations state
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = (visibleItems: Category[]) => {
    const visibleIds = visibleItems.map(item => item.id)
    const allSelected = visibleIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected categories? Products in these categories will become uncategorized.`)) return
    
    const { error } = await supabase
      .from("categories")
      .delete()
      .in("id", selectedIds)
    
    if (!error) {
      fetchCategories()
    } else {
      alert("Error deleting categories: " + error.message)
    }
    setSelectedIds([])
  }

  const fetchCategories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })
    
    if (!error) setCategories(data || [])
    setLoading(false)
  }

  React.useEffect(() => {
    fetchCategories()
  }, [])

  const handleUploadImage = async (file: File) => {
    setUploading(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          const result = reader.result as string
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = (err) => reject(err)
      })

      const res = await uploadCategoryImage(base64, file.name, file.type)
      
      if (!res.success || !res.url) {
        throw new Error(res.error || "Failed to retrieve uploaded image URL.")
      }

      setEditingCategory(p => ({ ...p, image_url: res.url }))
    } catch (error: any) {
      alert("Upload failed: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory?.name) return

    setIsSaving(true)
    const slug = editingCategory.slug || slugify(editingCategory.name)
    const payload = {
      name: editingCategory.name,
      slug: slug,
      description: editingCategory.description || null,
      parent_id: editingCategory.parent_id || null,
      image_url: editingCategory.image_url || null,
    }

    let error
    if (editingCategory.id) {
      const { error: err } = await supabase.from("categories").update(payload).eq("id", editingCategory.id)
      error = err
    } else {
      const { error: err } = await supabase.from("categories").insert(payload)
      error = err
    }

    setIsSaving(false)
    if (!error) {
      setIsModalOpen(false)
      fetchCategories()
    } else {
      alert("Error saving category: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? Products in this category will become uncategorized.")) return
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (!error) fetchCategories()
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const openAddModal = () => {
    setEditingCategory({
      name: "",
      slug: "",
      description: "",
      parent_id: null,
      image_url: null
    })
    setIsModalOpen(true)
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black font-serif">Product Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Organize and classify your Telkidukan product lines.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" className="bg-white">
             <Download className="mr-2 h-4 w-4" />
             Export
           </Button>
           <Button onClick={openAddModal} variant="primary" size="sm">
             <Plus className="mr-2 h-4 w-4" />
             Add Category
           </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search categories..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-white focus:border-gray-200 transition-all placeholder:text-gray-400 text-black font-semibold"
          />
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
            <span className="text-sm font-bold text-black uppercase tracking-wider">{selectedIds.length} categories selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <th className="px-8 py-5 w-[5%]">
                <input
                  type="checkbox"
                  checked={filteredCategories.length > 0 && filteredCategories.every(c => selectedIds.includes(c.id))}
                  onChange={() => toggleSelectAll(filteredCategories)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer accent-black"
                />
              </th>
              <th className="px-8 py-5">Category Title</th>
              <th className="px-8 py-5">URL Path</th>
              <th className="px-8 py-5">Hierarchy</th>
              <th className="px-8 py-5 text-right pr-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                   <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading data...</p>
                   </div>
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No categories found</p>
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.id} className={cn("group hover:bg-gray-50/50 transition-colors", selectedIds.includes(category.id) && "bg-gray-50")}>
                  <td className="px-8 py-6">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(category.id)}
                      onChange={() => toggleSelect(category.id)}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer accent-black"
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-gray-100 border border-gray-200">
                        {category.image_url ? (
                          <img src={category.image_url} alt={category.name} className="h-full w-full object-cover transition-all duration-500" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-sm text-black">{category.name}</p>
                        {category.description && (
                          <p className="text-[10px] text-gray-400 truncate max-w-[250px]">{category.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      /{category.slug}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {category.parent_id ? (
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-500">
                        <ChevronRight className="h-3 w-3 text-gray-300" />
                        {categories.find(c => c.id === category.parent_id)?.name || 'Parent'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Top Level</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right pr-12">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => openEditModal(category)}
                        className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
        title={editingCategory?.id ? "Modify Category" : "Define New Category"}
      >
        <form onSubmit={handleSave} className="space-y-8 py-4">
          {/* Image Selection Area */}
          <div className="flex flex-col items-center gap-4 p-8 rounded-[32px] bg-gray-50/50 border border-dashed border-gray-200">
            <div 
              onClick={() => setIsMediaSelectorOpen(true)}
              className="relative h-24 w-24 overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-sm group cursor-pointer hover:border-black transition-all"
            >
              {editingCategory?.image_url ? (
                <img src={editingCategory.image_url} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-200">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold uppercase tracking-widest">
                Choose
              </div>
            </div>
            <div className="text-center">
               <p className="text-[10px] font-bold uppercase tracking-widest text-black">Cover Visual</p>
               <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">Recommended: 1024x1024px</p>
               <button
                 type="button"
                 onClick={() => setIsMediaSelectorOpen(true)}
                 className="mt-3 text-[9px] font-bold uppercase tracking-widest text-black hover:opacity-75 transition-opacity block mx-auto underline"
               >
                 Choose from Media Library
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Title</label>
              <Input 
                value={editingCategory?.name}
                onChange={e => {
                  const name = e.target.value
                  setEditingCategory(p => ({ ...p, name, slug: slugify(name) }))
                }}
                placeholder="E.G. Organic Oils"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">URL slug</label>
              <Input 
                value={editingCategory?.slug}
                onChange={e => setEditingCategory(p => ({ ...p, slug: e.target.value }))}
                placeholder="organic-oils"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Parent Hierarchy</label>
            <select 
              value={editingCategory?.parent_id || ""}
              onChange={e => setEditingCategory(p => ({ ...p, parent_id: e.target.value || null }))}
              className="w-full rounded-none border-b border-gray-100 bg-transparent py-4 text-sm outline-none focus:border-black transition-all appearance-none"
            >
              <option value="">None (Top Level Root)</option>
              {categories.filter(c => c.id !== editingCategory?.id).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Brief Description</label>
            <textarea 
              rows={3}
              value={editingCategory?.description || ""}
              onChange={e => setEditingCategory(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-transparent border-b border-gray-100 py-4 text-sm outline-none focus:border-black transition-all resize-none placeholder:text-gray-300"
              placeholder="Provide a short description for this category group..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving || uploading} className="px-10">
              {isSaving ? "Finalizing..." : editingCategory?.id ? "Update Details" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      <MediaSelectorModal
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        multiple={false}
        onSelect={(urls) => setEditingCategory(p => ({ ...p, image_url: urls[0] || null }))}
        selectedUrls={editingCategory?.image_url ? [editingCategory.image_url] : []}
      />
    </div>
  )
}
