"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Image as ImageIcon, Search, Plus, X, Check, Trash2, Loader2 } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { uploadMediaAsset, fetchMediaRecords, deleteMediaRecord } from "@/app/actions/storage"

interface MediaItem {
  id: string
  url: string
  filename: string
  size: number
  mime_type: string
  created_at: string
}

interface MediaSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  multiple?: boolean
  onSelect: (urls: string[]) => void
  selectedUrls?: string[]
}

/**
 * Reusable WordPress-style Media Selector Modal.
 * Includes auto-compression to under 5MB using client-side canvas.
 */
export default function MediaSelectorModal({
  isOpen,
  onClose,
  multiple = false,
  onSelect,
  selectedUrls = []
}: MediaSelectorModalProps) {
  const [activeTab, setActiveTab] = React.useState<"upload" | "library">("library")
  const [media, setMedia] = React.useState<MediaItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [dragActive, setDragActive] = React.useState(false)
  const [tempSelected, setTempSelected] = React.useState<string[]>(selectedUrls)

  // Reset temp selection on modal open/close
  React.useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedUrls)
      fetchMedia()
    }
  }, [isOpen, selectedUrls])

  const fetchMedia = async () => {
    setLoading(true)
    const res = await fetchMediaRecords()
    if (res.success && res.data) {
      setMedia(res.data)
    }
    setLoading(false)
  }

  // --- Browser-Side Canvas Image Compression Utility ---
  const compressImageFile = async (
    file: File,
    maxSizeMB: number = 5
  ): Promise<{ blob: Blob | File; name: string; type: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const originalSize = file.size
          const maxSizeBytes = maxSizeMB * 1024 * 1024

          // 1. If it's already under 5MB, keep it as-is without quality compression
          if (originalSize <= maxSizeBytes) {
            resolve({
              blob: file,
              name: file.name,
              type: file.type,
              size: file.size
            })
            return
          }

          console.log(`Image is ${originalSize / (1024 * 1024)}MB. Starting auto-compression to under ${maxSizeMB}MB...`)

          // 2. Downscale dimensions if extremely high res (2048px max to retain stunning details but optimize load)
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height
          const MAX_DIM = 2048

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width)
              width = MAX_DIM
            } else {
              width = Math.round((width * MAX_DIM) / height)
              height = MAX_DIM
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Could not construct 2D canvas context"))
            return
          }
          ctx.drawImage(img, 0, 0, width, height)

          // 3. Native Blob compression loop (highly efficient and direct)
          let quality = 0.85
          
          const tryCompress = (q: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Canvas toBlob serialization failed"))
                  return
                }

                if (blob.size <= maxSizeBytes || q <= 0.05) {
                  console.log(`Compressed successfully! New size is ${blob.size / (1024 * 1024)}MB.`)
                  resolve({
                    blob: blob,
                    name: file.name.replace(/\.[^/.]+$/, "") + ".jpg", // convert to JPEG extension
                    type: "image/jpeg",
                    size: blob.size
                  })
                } else {
                  tryCompress(q - 0.08)
                }
              },
              "image/jpeg",
              q
            )
          }

          tryCompress(quality)
        }
        img.onerror = (err) => reject(err)
      }
      reader.onerror = (err) => reject(err)
    })
  }

  // --- Upload Handlers ---
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith("image/")) {
        alert("Please upload image files only.")
        continue
      }

      try {
        // Compress image client-side if it exceeds 5MB
        const { blob, name, type } = await compressImageFile(file, 5)

        // Construct FormData to stream files natively, bypassing Flight string-chunking limits
        const formData = new FormData()
        formData.append("file", blob, name)
        formData.append("filename", name)
        formData.append("mimeType", type)

        const res = await uploadMediaAsset(formData)
        if (!res.success || !res.mediaItem) {
          throw new Error(res.error || "Server upload failed.")
        }

        const uploadedUrl = res.mediaItem.url

        // Auto select the newly uploaded image
        setTempSelected((prev) => {
          if (multiple) {
            return [...prev, uploadedUrl]
          } else {
            return [uploadedUrl]
          }
        })
      } catch (err: any) {
        console.error("Upload error:", err)
        alert(`Failed to upload ${file.name}: ${err.message}`)
      }
    }

    setUploading(false)
    await fetchMedia()
    setActiveTab("library") // Transition to library tab to show the selected image
  }

  // --- Drag and Drop Handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFiles(e.dataTransfer.files)
    }
  }

  // --- Selection Logic ---
  const handleItemClick = (url: string) => {
    setTempSelected((prev) => {
      const isSelected = prev.includes(url)
      if (multiple) {
        if (isSelected) {
          return prev.filter((item) => item !== url)
        } else {
          return [...prev, url]
        }
      } else {
        if (isSelected) {
          return []
        } else {
          return [url]
        }
      }
    })
  }

  const handleConfirm = () => {
    onSelect(tempSelected)
    onClose()
  }

  // --- Delete Handler ---
  const handleDeleteItem = async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to permanently delete "${item.filename}" from the database and storage?`)) return

    const res = await deleteMediaRecord(item.id)
    if (res.success) {
      // Remove from media state list
      setMedia((prev) => prev.filter((m) => m.id !== item.id))
      // Remove from temporary selection if it was selected
      setTempSelected((prev) => prev.filter((url) => url !== item.url))
    } else {
      alert("Delete failed: " + res.error)
    }
  }

  // --- Filtered Items ---
  const filteredMedia = media.filter((item) =>
    item.filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Media Uploader & Library"
      className="max-w-4xl h-[85vh] flex flex-col p-6 rounded-[32px] overflow-hidden"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 pb-4 mb-6 gap-6">
          <button
            onClick={() => setActiveTab("library")}
            className={cn(
              "text-xs font-bold uppercase tracking-widest pb-2 border-b-2 transition-all outline-none",
              activeTab === "library"
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-black"
            )}
          >
            Media Library
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={cn(
              "text-xs font-bold uppercase tracking-widest pb-2 border-b-2 transition-all outline-none",
              activeTab === "upload"
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-black"
            )}
          >
            Upload Files
          </button>
        </div>

        {/* Search Header for Library */}
        {activeTab === "library" && (
          <div className="relative w-full max-w-sm mb-6 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter library by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-xs outline-none focus:bg-white focus:border-gray-200 transition-all placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
          {activeTab === "upload" ? (
            /* Upload Zone Tab */
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "h-full min-h-[300px] flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed transition-all p-12",
                dragActive
                  ? "border-black bg-gray-50"
                  : "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
              )}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-black" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black mt-2">Compressing & Saving Visuals...</p>
                </div>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-black shadow-sm border border-gray-100">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-sm font-bold text-black">Drag and drop images here</h3>
                  <p className="mt-1 text-[10px] text-gray-400 tracking-wider uppercase">
                    Max size auto-compressed to 5MB. Support: JPG, PNG, WEBP
                  </p>
                  <label className="mt-6 cursor-pointer">
                    <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-6 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity">
                      Select Files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadFiles(e.target.files)}
                    />
                  </label>
                </>
              )}
            </div>
          ) : (
            /* Media Library Tab */
            <div className="h-full">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing Media...</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                  <ImageIcon className="h-12 w-12 text-gray-200 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No media found in your library</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pb-20">
                  {filteredMedia.map((item) => {
                    const isSelected = tempSelected.includes(item.url)
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item.url)}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-[24px] border cursor-pointer group shadow-sm bg-gray-50 transition-all select-none",
                          isSelected
                            ? "border-black ring-2 ring-black"
                            : "border-gray-100 hover:border-gray-300"
                        )}
                      >
                        {/* Thumbnail */}
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="h-full w-full object-cover transition-all duration-500"
                        />

                        {/* Overlay selection ring & checkmark */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg border border-white">
                              <Check className="h-4.5 w-4.5 stroke-[3]" />
                            </div>
                          </div>
                        )}

                        {/* Delete button (hover overlay) */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(e, item)}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          title="Delete from Database & Storage"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Filename hover tooltip */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/75 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                          <p className="truncate text-[8px] font-bold uppercase tracking-widest text-white text-center">
                            {item.filename}
                          </p>
                          <p className="text-[7px] text-gray-300 text-center mt-0.5 font-mono">
                            {(item.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-6 shrink-0 bg-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {tempSelected.length} {tempSelected.length === 1 ? "image" : "images"} selected
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handleConfirm}
              disabled={tempSelected.length === 0}
              className="px-8"
            >
              Choose {multiple ? "Images" : "Image"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
