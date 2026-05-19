"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, Trash2, Copy, Image as ImageIcon, Search, Plus, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { ensureStorageBuckets, uploadMediaAsset, deleteMediaRecord, fetchMediaRecords } from "@/app/actions/storage"

type MediaItem = {
  id: string
  url: string
  filename: string
  size: number
  mime_type: string
  created_at: string
}

export default function MediaLibraryPage() {
  const supabase = createClient()
  const [media, setMedia] = React.useState<MediaItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [dragActive, setDragActive] = React.useState(false)
  const [storageError, setStorageError] = React.useState<string | null>(null)

  const fetchMedia = async () => {
    setLoading(true)
    const res = await fetchMediaRecords()
    if (res.success) setMedia(res.data || [])
    setLoading(false)
  }

  React.useEffect(() => {
    async function init() {
      const res = await ensureStorageBuckets()
      if (!res.success) {
        setStorageError(res.error || "Failed to initialize storage buckets.")
      } else {
        setStorageError(null)
      }
      fetchMedia()
    }
    init()
  }, [])

  const runAutoFix = async () => {
    setUploading(true)
    const res = await ensureStorageBuckets()
    if (!res.success) {
      alert("Could not initialize bucket: " + res.error)
      setStorageError(res.error || "Failed to initialize storage buckets.")
    } else {
      setStorageError(null)
      alert("Bucket initialized successfully!")
    }
    setUploading(false)
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setStorageError(null)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("filename", file.name)
        formData.append("mimeType", file.type)

        const res = await uploadMediaAsset(formData)
        if (!res.success) {
          alert("Upload failed: " + res.error)
          break
        }
      } catch (err: any) {
        console.error("Upload error:", err)
        alert("Upload failed: " + err.message)
        break
      }
    }

    setUploading(false)
    fetchMedia()
  }

  const handleDelete = async (item: MediaItem) => {
    if (!confirm("Are you sure you want to delete this image?")) return
    
    const res = await deleteMediaRecord(item.id)
    if (!res.success) {
      alert("Delete failed: " + res.error)
    } else {
      fetchMedia()
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    alert("URL copied to clipboard!")
  }

  const filteredMedia = media.filter(m => 
    m.filename.toLowerCase().includes(search.toLowerCase())
  )

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage all your store assets in one place.</p>
        </div>
        <div className="relative">
          <input 
            type="file" 
            id="media-upload" 
            multiple 
            accept="image/*"
            className="hidden" 
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button 
            onClick={() => document.getElementById('media-upload')?.click()} 
            className="w-full sm:w-auto rounded-2xl h-12 px-6"
            disabled={uploading}
          >
            <Upload className="mr-2 h-5 w-5" />
            {uploading ? "Uploading..." : "Upload Images"}
          </Button>
        </div>
      </div>

      {storageError && (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-500 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{storageError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={runAutoFix} className="border-red-500/20 hover:bg-red-500/10">
            Fix Automatically
          </Button>
        </div>
      )}

      <div className="flex items-center gap-4 rounded-3xl border border-white/5 bg-white/5 px-6 py-4">
        <Search className="h-5 w-5 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search by filename..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
        />
      </div>

      <div 
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed p-12 transition-all",
          dragActive ? "border-accent bg-accent/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 text-zinc-400">
          <ImageIcon className="h-8 w-8" />
        </div>
        <h3 className="mt-6 text-lg font-bold">Drag and drop images here</h3>
        <p className="mt-1 text-sm text-zinc-500 text-center max-w-xs">
          Support for JPG, PNG, WEBP. Max file size 5MB.
        </p>
        <button 
          onClick={() => document.getElementById('media-upload')?.click()}
          className="mt-6 text-sm font-bold text-accent hover:underline"
        >
          Or browse files from your computer
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-3xl bg-white/5 animate-pulse" />
          ))
        ) : filteredMedia.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-500">
            No media items found.
          </div>
        ) : (
          filteredMedia.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-3xl border border-white/5 bg-white/5">
              <img 
                src={item.url} 
                alt={item.filename} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <button 
                  onClick={() => copyToClipboard(item.url)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black hover:bg-accent hover:text-white transition-all"
                  title="Copy URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black hover:bg-red-500 hover:text-white transition-all"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white">
                  {item.filename}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {(item.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
