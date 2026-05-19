"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, Edit, Trash2, BookOpen, Loader2, ImageIcon, AlertCircle, Copy, Check, Eye } from "lucide-react"
import { cn, slugify } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import MediaSelectorModal from "@/components/admin/MediaSelectorModal"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

type Blog = {
  id: string
  title: string
  slug: string
  content: string
  summary: string | null
  featured_image: string | null
  author: string
  is_published: boolean
  created_at: string
}

export default function BlogsAdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""

  const [blogs, setBlogs] = React.useState<Blog[]>([])
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
  const [editingBlog, setEditingBlog] = React.useState<Partial<Blog> | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = React.useState(false)
  
  // Database vs Fallback state
  const [isFallbackActive, setIsFallbackActive] = React.useState(false)
  const [copiedSql, setCopiedSql] = React.useState(false)

  // Multi-select / Bulk operations state
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = (visibleItems: Blog[]) => {
    const visibleIds = visibleItems.map(item => item.id)
    const allSelected = visibleIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected articles?`)) return
    
    if (isFallbackActive) {
      const localData = localStorage.getItem("aura_fallback_blogs")
      let currentBlogs: Blog[] = localData ? JSON.parse(localData) : []
      currentBlogs = currentBlogs.filter(b => !selectedIds.includes(b.id))
      localStorage.setItem("aura_fallback_blogs", JSON.stringify(currentBlogs))
      setBlogs(currentBlogs)
    } else {
      const { error } = await supabase
        .from("blogs")
        .delete()
        .in("id", selectedIds)
      
      if (!error) {
        fetchBlogs()
      } else {
        alert("Error bulk deleting blogs: " + error.message)
      }
    }
    setSelectedIds([])
  }

  const handleBulkPublishStatus = async (status: boolean) => {
    if (isFallbackActive) {
      const localData = localStorage.getItem("aura_fallback_blogs")
      let currentBlogs: Blog[] = localData ? JSON.parse(localData) : []
      currentBlogs = currentBlogs.map(b => selectedIds.includes(b.id) ? { ...b, is_published: status } : b)
      localStorage.setItem("aura_fallback_blogs", JSON.stringify(currentBlogs))
      setBlogs(currentBlogs)
    } else {
      const { error } = await supabase
        .from("blogs")
        .update({ is_published: status })
        .in("id", selectedIds)
      
      if (!error) {
        fetchBlogs()
      } else {
        alert("Error updating status: " + error.message)
      }
    }
    setSelectedIds([])
  }

  const SQL_MIGRATION = `-- Create blogs table in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    featured_image TEXT,
    author TEXT DEFAULT 'Admin',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Blogs are readable by everyone" ON blogs 
    FOR SELECT USING (is_published = TRUE OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage blogs" ON blogs 
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        // If table doesn't exist, activate the localStorage fallback
        if (error.code === "PGRST116" || error.message.includes("does not exist")) {
          setIsFallbackActive(true)
          const localData = localStorage.getItem("aura_fallback_blogs")
          setBlogs(localData ? JSON.parse(localData) : [])
        } else {
          console.error("Supabase blogs fetch error:", error)
        }
      } else {
        setIsFallbackActive(false)
        setBlogs(data || [])
      }
    } catch (err) {
      console.error("Fetch exception, falling back:", err)
      setIsFallbackActive(true)
      const localData = localStorage.getItem("aura_fallback_blogs")
      setBlogs(localData ? JSON.parse(localData) : [])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchBlogs()
  }, [])

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SQL_MIGRATION)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBlog?.title || !editingBlog?.content) return

    setIsSaving(true)
    const slug = editingBlog.slug || slugify(editingBlog.title)
    const payload = {
      title: editingBlog.title,
      slug: slug,
      content: editingBlog.content,
      summary: editingBlog.summary || null,
      featured_image: editingBlog.featured_image || null,
      author: editingBlog.author || "Admin",
      is_published: editingBlog.is_published !== undefined ? editingBlog.is_published : true,
    }

    if (isFallbackActive) {
      // LocalStorage CRUD logic
      const localData = localStorage.getItem("aura_fallback_blogs")
      let currentBlogs: Blog[] = localData ? JSON.parse(localData) : []

      if (editingBlog.id) {
        currentBlogs = currentBlogs.map(b => 
          b.id === editingBlog.id 
            ? { ...b, ...payload, slug } 
            : b
        )
      } else {
        const newBlog: Blog = {
          id: crypto.randomUUID(),
          ...payload,
          created_at: new Date().toISOString()
        }
        currentBlogs.unshift(newBlog)
      }

      localStorage.setItem("aura_fallback_blogs", JSON.stringify(currentBlogs))
      setBlogs(currentBlogs)
      setIsModalOpen(false)
      setIsSaving(false)
    } else {
      // Supabase CRUD logic
      let error
      if (editingBlog.id) {
        const { error: err } = await supabase
          .from("blogs")
          .update(payload)
          .eq("id", editingBlog.id)
        error = err
      } else {
        const { error: err } = await supabase
          .from("blogs")
          .insert(payload)
        error = err
      }

      setIsSaving(false)
      if (!error) {
        setIsModalOpen(false)
        fetchBlogs()
      } else {
        alert("Error saving blog: " + error.message)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return

    if (isFallbackActive) {
      const localData = localStorage.getItem("aura_fallback_blogs")
      let currentBlogs: Blog[] = localData ? JSON.parse(localData) : []
      currentBlogs = currentBlogs.filter(b => b.id !== id)
      localStorage.setItem("aura_fallback_blogs", JSON.stringify(currentBlogs))
      setBlogs(currentBlogs)
    } else {
      const { error } = await supabase.from("blogs").delete().eq("id", id)
      if (!error) {
        fetchBlogs()
      } else {
        alert("Error deleting blog: " + error.message)
      }
    }
  }

  const togglePublishStatus = async (blog: Blog) => {
    const updatedStatus = !blog.is_published
    
    if (isFallbackActive) {
      const localData = localStorage.getItem("aura_fallback_blogs")
      let currentBlogs: Blog[] = localData ? JSON.parse(localData) : []
      currentBlogs = currentBlogs.map(b => b.id === blog.id ? { ...b, is_published: updatedStatus } : b)
      localStorage.setItem("aura_fallback_blogs", JSON.stringify(currentBlogs))
      setBlogs(currentBlogs)
    } else {
      const { error } = await supabase
        .from("blogs")
        .update({ is_published: updatedStatus })
        .eq("id", blog.id)

      if (!error) {
        fetchBlogs()
      } else {
        alert("Error updating status: " + error.message)
      }
    }
  }

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    (b.summary || "").toLowerCase().includes(search.toLowerCase())
  )

  const openAddModal = () => {
    setEditingBlog({
      title: "",
      slug: "",
      content: "",
      summary: "",
      featured_image: null,
      author: "Admin",
      is_published: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (blog: Blog) => {
    setEditingBlog(blog)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black font-serif">Store Blog Posts</h1>
          <p className="mt-1 text-sm text-gray-500">Publish articles, updates, and news on your storefront.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openAddModal} variant="primary" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Write Article
          </Button>
        </div>
      </div>

      {/* Fallback Banner */}
      {isFallbackActive && (
        <div className="relative rounded-[28px] border border-amber-200/50 bg-amber-50/50 p-6 backdrop-blur-sm overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <div className="flex gap-4 items-start">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Database Table Setup Required</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed max-w-2xl">
                The database table <code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded text-[10px] font-bold text-amber-900">blogs</code> is not yet created. The system is automatically using <code className="font-semibold">local browser storage</code> so you can test immediately! Please copy this SQL script and paste it into your Supabase Dashboard SQL Editor to establish database syncing.
              </p>
            </div>
          </div>
          <button
            onClick={copySqlToClipboard}
            className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-amber-100 border border-amber-200 text-xs font-bold uppercase tracking-wider text-amber-800 transition-all hover:scale-[1.02]"
          >
            {copiedSql ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy SQL Script
              </>
            )}
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search articles by title or summary..."
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
            <span className="text-sm font-bold text-black uppercase tracking-wider">{selectedIds.length} articles selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => handleBulkPublishStatus(true)}
              className="px-4 py-2 bg-white border border-zinc-250 hover:bg-zinc-50 text-xs font-bold uppercase tracking-wider text-black rounded-2xl transition-all"
            >
              Publish Selected
            </button>
            <button 
              onClick={() => handleBulkPublishStatus(false)}
              className="px-4 py-2 bg-white border border-zinc-250 hover:bg-zinc-50 text-xs font-bold uppercase tracking-wider text-black rounded-2xl transition-all"
            >
              Draft Selected
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

      {/* Articles Table */}
      <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <th className="px-8 py-5 w-[5%]">
                <input
                  type="checkbox"
                  checked={filteredBlogs.length > 0 && filteredBlogs.every(b => selectedIds.includes(b.id))}
                  onChange={() => toggleSelectAll(filteredBlogs)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer accent-black"
                />
              </th>
              <th className="px-8 py-5">Article details</th>
              <th className="px-8 py-5">Author</th>
              <th className="px-8 py-5">Published Date</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right pr-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading articles...</p>
                  </div>
                </td>
              </tr>
            ) : filteredBlogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center justify-center py-10">
                    <BookOpen className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No blog posts found</p>
                    <button
                      onClick={openAddModal}
                      className="mt-3 text-xs font-bold text-accent hover:underline uppercase tracking-wider"
                    >
                      Write your first article now
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBlogs.map((blog) => (
                <tr key={blog.id} className={cn("group hover:bg-gray-50/50 transition-colors", selectedIds.includes(blog.id) && "bg-gray-50")}>
                  <td className="px-8 py-6">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(blog.id)}
                      onChange={() => toggleSelect(blog.id)}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer accent-black"
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                        {blog.featured_image ? (
                          <img src={blog.featured_image} alt={blog.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="font-bold text-sm text-black truncate max-w-[280px]">{blog.title}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[280px]">
                          {blog.summary || "No summary provided"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-semibold text-gray-700">{blog.author}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs text-gray-500">
                      {new Date(blog.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button
                      onClick={() => togglePublishStatus(blog)}
                      className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border transition-all",
                        blog.is_published
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                          : "bg-gray-50 text-gray-500 border-gray-150 hover:bg-gray-100"
                      )}
                    >
                      {blog.is_published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right pr-12">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/blog/${blog.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                        title="Preview on Store"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <button 
                        onClick={() => openEditModal(blog)}
                        className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                        title="Edit Article"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(blog.id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Article"
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

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBlog?.id ? "Edit Blog Article" : "Write New Blog Article"}
      >
        <form onSubmit={handleSave} className="flex flex-col max-h-[75vh]">
          {/* Scrollable Form Body Container */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-2 max-h-[55vh]">
            
            {/* Featured Image Selection */}
            <div className="flex flex-col items-center gap-4 p-6 rounded-[28px] bg-gray-50/50 border border-dashed border-gray-200">
              <div 
                onClick={() => setIsMediaSelectorOpen(true)}
                className="relative h-28 w-44 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm group cursor-pointer hover:border-black transition-all"
              >
                {editingBlog?.featured_image ? (
                  <img src={editingBlog.featured_image} alt="Featured Visual" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-200">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold uppercase tracking-widest">
                  Choose Image
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black">Featured Article Cover</p>
                <button
                  type="button"
                  onClick={() => setIsMediaSelectorOpen(true)}
                  className="mt-2 text-[9px] font-bold uppercase tracking-widest text-black hover:opacity-75 transition-opacity block mx-auto underline"
                >
                  Select from Media Library
                </button>
              </div>
            </div>

            {/* Title & Author */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Article Title</label>
                <Input 
                  value={editingBlog?.title || ""}
                  onChange={e => {
                    const title = e.target.value
                    setEditingBlog(p => ({ ...p, title, slug: slugify(title) }))
                  }}
                  placeholder="E.G. Health Benefits of Cold Pressed Oils"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Author Name</label>
                <Input 
                  value={editingBlog?.author || ""}
                  onChange={e => setEditingBlog(p => ({ ...p, author: e.target.value }))}
                  placeholder="Admin / Writer"
                  required
                />
              </div>
            </div>

            {/* URL Slug & Published Status */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">URL path slug</label>
                <Input 
                  value={editingBlog?.slug || ""}
                  onChange={e => setEditingBlog(p => ({ ...p, slug: slugify(e.target.value) }))}
                  placeholder="health-benefits-of-cold-pressed-oils"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-6 pl-1">
                <input
                  id="is_published"
                  type="checkbox"
                  checked={editingBlog?.is_published !== undefined ? editingBlog.is_published : true}
                  onChange={e => setEditingBlog(p => ({ ...p, is_published: e.target.checked }))}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <label htmlFor="is_published" className="text-xs font-bold uppercase tracking-wider text-gray-700 cursor-pointer select-none">
                  Publish immediately
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Brief Summary</label>
              <Input 
                value={editingBlog?.summary || ""}
                onChange={e => setEditingBlog(p => ({ ...p, summary: e.target.value }))}
                placeholder="Provide a short sentence detailing what this article covers..."
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Article Body Content</label>
              <textarea 
                rows={8}
                value={editingBlog?.content || ""}
                onChange={e => setEditingBlog(p => ({ ...p, content: e.target.value }))}
                className="w-full bg-transparent border-b border-gray-150 py-4 text-sm outline-none focus:border-black transition-all resize-y placeholder:text-gray-300 text-black leading-relaxed"
                placeholder="Write the full body of the article here. Supports paragraphs, spaces, and formatting..."
                required
              />
            </div>

          </div>

          {/* Fixed Footer Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4 bg-white shrink-0">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving} className="px-10">
              {isSaving ? "Saving..." : editingBlog?.id ? "Update Post" : "Publish Post"}
            </Button>
          </div>
        </form>
      </Modal>

      <MediaSelectorModal
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        multiple={false}
        onSelect={(urls) => setEditingBlog(p => ({ ...p, featured_image: urls[0] || null }))}
        selectedUrls={editingBlog?.featured_image ? [editingBlog.featured_image] : []}
      />
    </div>
  )
}
