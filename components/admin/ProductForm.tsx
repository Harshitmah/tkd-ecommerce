"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Plus, Save, Trash2, Eye, Layout, DollarSign, Package, Check, ListChecks, Settings2, Loader2, Minus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import MediaSelectorModal from "@/components/admin/MediaSelectorModal"
import { saveProductData } from "@/app/actions/product"

interface Variant {
  id?: string
  sku: string
  price: string
  sale_price?: string
  image_url?: string
  stock_quantity: string
  label: string 
}

interface Specification {
  key: string
  value: string
}

interface ProductFormProps {
  initialData?: any
  categories: any[]
}

export default function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = React.useState(false)
  const [toast, setToast] = React.useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  })

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(p => ({ ...p, show: false }))
    }, 4000)
  }

  const [images, setImages] = React.useState<string[]>(
    initialData?.images?.map((img: any) => img.image_url) || []
  )

  // Parse structured data from description if it exists
  const parseDescription = (desc: string) => {
    try {
      if (desc.includes("<!--PRODUCT_DATA:")) {
        const parts = desc.split("<!--PRODUCT_DATA:")
        const rawJson = parts[1].split("-->")[0]
        const data = JSON.parse(rawJson)
        return {
          text: parts[0].trim(),
          highlights: data.highlights || [],
          specifications: data.specifications || []
        }
      }
    } catch (e) {
      console.error("Error parsing product data", e)
    }
    return { text: desc, highlights: [], specifications: [] }
  }

  const initialParsed = parseDescription(initialData?.description || "")

  const [formData, setFormData] = React.useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    description: initialParsed.text,
    price: initialData?.price || "",
    sale_price: initialData?.sale_price || "",
    stock_quantity: initialData?.stock_quantity?.toString() || "0",
    category_id: initialData?.category_id || "",
    status: initialData?.status || "draft",
    related_categories: initialData?.related_categories || [],
    highlights: (initialData?.highlights as string[]) || initialParsed.highlights,
    specifications: (initialData?.specifications as Specification[]) || initialParsed.specifications
  })

  const [variants, setVariants] = React.useState<Variant[]>(
    initialData?.variants?.map((v: any) => ({
      id: v.id,
      sku: v.sku || "",
      price: v.price?.toString() || "",
      sale_price: v.option_values?.[0]?.sale_price?.toString() || "",
      image_url: v.option_values?.[0]?.image_url || "",
      stock_quantity: v.stock_quantity?.toString() || "0",
      label: v.option_values?.[0]?.value || ""
    })) || []
  )
  const [selectedVariantIndexForImage, setSelectedVariantIndexForImage] = React.useState<number | null>(null)
  const [isVariantMediaOpen, setIsVariantMediaOpen] = React.useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    if (name === "title" && !initialData) {
      setFormData(prev => ({ 
        ...prev, 
        slug: value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') 
      }))
    }
  }

  const handleVariantChange = (index: number, field: keyof Variant, value: string) => {
    const next = [...variants]
    next[index] = { ...next[index], [field]: value }
    setVariants(next)
  }

  const addVariant = () => {
    setVariants([...variants, { sku: "", price: "", sale_price: "", image_url: "", stock_quantity: "0", label: "" }])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  // Highlights management
  const addHighlight = () => {
    setFormData(prev => ({ ...prev, highlights: [...prev.highlights, ""] }))
  }

  const updateHighlight = (index: number, value: string) => {
    const next = [...formData.highlights]
    next[index] = value
    setFormData(prev => ({ ...prev, highlights: next }))
  }

  const removeHighlight = (index: number) => {
    setFormData(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== index) }))
  }

  // Specifications management
  const addSpecification = () => {
    setFormData(prev => ({ ...prev, specifications: [...prev.specifications, { key: "", value: "" }] }))
  }

  const updateSpecification = (index: number, field: keyof Specification, value: string) => {
    const next = [...formData.specifications]
    next[index] = { ...next[index], [field]: value }
    setFormData(prev => ({ ...prev, specifications: next }))
  }

  const removeSpecification = (index: number) => {
    setFormData(prev => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== index) }))
  }



  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const toggleRelatedCategory = (id: string) => {
    setFormData(prev => {
      const current = prev.related_categories
      const next = current.includes(id)
        ? current.filter((c: string) => c !== id)
        : [...current, id]
      return { ...prev, related_categories: next }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    try {
      // Pack structured data into description as a hidden comment if columns don't exist
      const structuredData = {
        highlights: formData.highlights,
        specifications: formData.specifications
      }
      const finalDescription = `${formData.description}\n\n<!--PRODUCT_DATA:${JSON.stringify(structuredData)}-->`

      const productData: any = {
        title: formData.title,
        slug: formData.slug,
        description: finalDescription,
        price: parseFloat(formData.price as string),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price as string) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category_id: formData.category_id || null,
        status: formData.status as any,
        related_categories: formData.related_categories,
      }

      const res = await saveProductData(productData, images, variants, initialData?.id)
      
      if (!res.success) {
        throw new Error(res.error)
      }

      showToast("Product persisted successfully!", "success")
      
      setTimeout(() => {
        router.push("/admin/products")
        router.refresh()
      }, 1500)
    } catch (error: any) {
      showToast("Error saving product: " + error.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 animate-in fade-in duration-700">
      {/* Left: Main Content */}
      <div className="lg:col-span-8 space-y-12 pb-20">
        <div className="bg-white border border-gray-200 rounded-[32px] p-10 shadow-sm">
           <div className="flex items-center gap-3 mb-10">
              <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-black">
                 <Layout className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-black uppercase tracking-widest">Product Information</h3>
           </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Field label="Exquisite Title">
              <Input 
                name="title" 
                value={formData.title} 
                onChange={handleInputChange} 
                placeholder="E.G. Organic Lavender Essence"
              />
            </Field>
            <Field label="Clean URL Slug">
              <Input 
                name="slug" 
                value={formData.slug} 
                onChange={handleInputChange} 
                placeholder="organic-lavender-essence"
              />
            </Field>
          </div>

          <div className="mt-8 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Editorial Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={8}
              className="w-full bg-transparent border-b border-gray-100 py-4 text-sm outline-none focus:border-black transition-all resize-none placeholder:text-gray-300"
              placeholder="Tell the story of this product..."
            />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            <Field label="Standard Retailing Price">
              <div className="relative">
                 <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
                 <Input 
                  name="price" 
                  type="number" 
                  value={formData.price} 
                  onChange={handleInputChange} 
                  className="pl-6"
                />
              </div>
            </Field>
            <Field label="Promotional Sale Price">
              <div className="relative">
                 <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
                 <Input 
                  name="sale_price" 
                  type="number" 
                  value={formData.sale_price} 
                  onChange={handleInputChange} 
                  placeholder="Leave empty for full price"
                  className="pl-6"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Product Details Section: Highlights & Specs */}
        <div className="bg-white border border-gray-200 rounded-[32px] p-10 shadow-sm">
           <div className="flex items-center gap-3 mb-10">
              <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-black">
                 <ListChecks className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-black uppercase tracking-widest">Product Details</h3>
           </div>

           <div className="space-y-12">
              {/* Key Highlights */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Key Highlights</h4>
                  <button 
                    onClick={addHighlight}
                    type="button"
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black hover:opacity-70 transition-opacity"
                  >
                    <Plus className="h-4 w-4" />
                    Add Highlight
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.highlights.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-300">
                      <div className="flex-1">
                        <Input 
                          value={h} 
                          onChange={(e) => updateHighlight(idx, e.target.value)} 
                          placeholder="E.G. Premium quality latex material..."
                        />
                      </div>
                      <button 
                        onClick={() => removeHighlight(idx)}
                        type="button"
                        className="h-12 w-12 flex items-center justify-center text-gray-300 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {formData.highlights.length === 0 && (
                    <p className="text-[10px] text-gray-300 italic ml-1">No highlights added yet.</p>
                  )}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="border-t border-gray-50 pt-10">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Technical Specifications</h4>
                  <button 
                    onClick={addSpecification}
                    type="button"
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black hover:opacity-70 transition-opacity"
                  >
                    <Plus className="h-4 w-4" />
                    Add Spec
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.specifications.map((s, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row items-end gap-4 p-6 bg-gray-50/50 rounded-2xl animate-in slide-in-from-right-4 duration-300">
                      <div className="flex-1 w-full">
                        <Field label="Key (e.g. Color)">
                          <Input 
                            value={s.key} 
                            onChange={(e) => updateSpecification(idx, "key", e.target.value)} 
                            placeholder="Color"
                          />
                        </Field>
                      </div>
                      <div className="flex-1 w-full">
                        <Field label="Value (e.g. Multicolor)">
                          <Input 
                            value={s.value} 
                            onChange={(e) => updateSpecification(idx, "value", e.target.value)} 
                            placeholder="Multicolor"
                          />
                        </Field>
                      </div>
                      <button 
                        onClick={() => removeSpecification(idx)}
                        type="button"
                        className="h-12 w-12 flex items-center justify-center text-gray-300 hover:text-red-600 transition-colors mb-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {formData.specifications.length === 0 && (
                    <p className="text-[10px] text-gray-300 italic ml-1">No specifications added yet.</p>
                  )}
                </div>
              </div>
           </div>
        </div>

        {/* Variants Section */}
        <div className="bg-white border border-gray-200 rounded-[32px] p-10 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-black">
                 <Package className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-black uppercase tracking-widest">Size & Material Variants</h3>
            </div>
            <button 
              onClick={addVariant}
              type="button"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black hover:opacity-70 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              New Variant
            </button>
          </div>
          
          <div className="space-y-6">
            {variants.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-gray-100 rounded-[24px] flex flex-col items-center justify-center text-center">
                 <Package className="h-8 w-8 text-gray-200 mb-4" />
                 <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No variants defined. Default product will be used.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {variants.map((variant, idx) => (
                  <div key={idx} className="group relative p-8 bg-gray-50/50 border border-gray-100 rounded-[32px] transition-all hover:bg-gray-50 space-y-6">
                    {/* Top row: Label, Image Selector, and Delete button */}
                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                      <div className="flex-1">
                        <Field label="Variant Name / Option Label">
                          <Input 
                            value={variant.label} 
                            onChange={(e) => handleVariantChange(idx, "label", e.target.value)} 
                            placeholder="E.G. 500ml, 1 Litre"
                          />
                        </Field>
                      </div>

                      {/* Variant Image Selector */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="relative h-14 w-14 rounded-2xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0 group-hover:border-black/10 transition-colors">
                          {variant.image_url ? (
                            <img src={variant.image_url} alt="Variant" className="h-full w-full object-cover" />
                          ) : (
                            <Upload className="h-5 w-5 text-gray-300" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVariantIndexForImage(idx)
                            setIsVariantMediaOpen(true)
                          }}
                          className="text-xs font-bold uppercase tracking-widest text-black underline hover:opacity-75"
                        >
                          {variant.image_url ? "Change Image" : "Choose Image"}
                        </button>
                        {variant.image_url && (
                          <button
                            type="button"
                            onClick={() => handleVariantChange(idx, "image_url", "")}
                            className="text-xs font-bold uppercase tracking-widest text-red-500 hover:opacity-75"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <button 
                        onClick={() => removeVariant(idx)}
                        type="button"
                        className="h-10 w-10 flex items-center justify-center text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all self-end md:self-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Bottom row: Prices and Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100/50">
                      <Field label="Regular Price (₹)">
                        <Input 
                          type="number"
                          value={variant.price} 
                          onChange={(e) => handleVariantChange(idx, "price", e.target.value)} 
                          placeholder="e.g. 299"
                        />
                      </Field>
                      <Field label="Sale Price (₹) - Optional">
                        <Input 
                          type="number"
                          value={variant.sale_price || ""} 
                          onChange={(e) => handleVariantChange(idx, "sale_price", e.target.value)} 
                          placeholder="e.g. 199"
                        />
                      </Field>
                      <Field label="Inventory / Stock">
                        <Input 
                          type="number"
                          value={variant.stock_quantity} 
                          onChange={(e) => handleVariantChange(idx, "stock_quantity", e.target.value)} 
                          placeholder="0"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gallery Section */}
        <div className="bg-white border border-gray-200 rounded-[32px] p-10 shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-black">
                   <Upload className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-black uppercase tracking-widest">Brand Visuals</h3>
             </div>
             <button 
                onClick={() => setIsMediaSelectorOpen(true)}
                type="button"
                className="text-[10px] font-bold uppercase tracking-widest text-black hover:opacity-75 transition-opacity underline"
              >
                Media Library Selector
              </button>
          </div>
          
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
            {images.map((url, idx) => (
              <div key={idx} className="relative aspect-[3/4] rounded-[20px] overflow-hidden border border-gray-100 group shadow-sm bg-gray-50">
                <img src={url} alt="Product" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <button 
                  onClick={() => removeImage(idx)}
                  type="button"
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button 
              onClick={() => setIsMediaSelectorOpen(true)}
              type="button"
              className="flex flex-col items-center justify-center aspect-[3/4] rounded-[20px] border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all group"
            >
              <Plus className="h-6 w-6 text-gray-300 group-hover:text-black transition-colors" />
              <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black">
                Add Images
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Management Panel */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm sticky top-24 overflow-hidden">
           {/* Telkidukan Preview Integrated into Sidebar to fix overlap */}
           <div className="mb-10 bg-gray-50 border border-gray-100 rounded-[24px] p-8 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 blur-[60px] rounded-full -translate-y-12 translate-x-12" />
              <div className="flex items-center gap-3 mb-6">
                 <Eye className="h-4 w-4 text-amber-500" />
                 <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-black">Telkidukan Preview</h3>
              </div>
              <div className="space-y-3 relative z-10">
                <p className="text-[9px] font-mono text-zinc-400 truncate">telkidukan.com/shop/{formData.slug || "essence"}</p>
                <h4 className="font-serif text-xl font-bold leading-tight">{formData.title || "Product Identity"}</h4>
                <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed tracking-wider">
                  {formData.description || "The story of this creation..."}
                </p>
              </div>
           </div>

           <div className="flex flex-col gap-6">
             <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">Master State</span>
                <div className="mt-3">
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold uppercase tracking-widest outline-none focus:border-black transition-all appearance-none text-center"
                  >
                    <option value="draft">Draft Protocol</option>
                    <option value="active">Active Listing</option>
                    <option value="archived">Archived Vault</option>
                  </select>
                </div>
             </div>

             <div className="border-t border-gray-50 pt-6">
                <Field label="System Stock">
                   <Input 
                    name="stock_quantity" 
                    type="number" 
                    value={formData.stock_quantity} 
                    onChange={handleInputChange} 
                  />
                </Field>
             </div>

             <div className="border-t border-gray-50 pt-6">
                <Field label="Catalog Root">
                  <select 
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b border-gray-100 py-2 text-sm font-medium outline-none focus:border-black transition-all appearance-none"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </Field>
             </div>

             <div className="border-t border-gray-50 pt-6">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Related Classifications</label>
                <div className="mt-3 grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      onClick={() => toggleRelatedCategory(cat.id)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer",
                        formData.related_categories.includes(cat.id) 
                          ? "bg-black text-white border-black" 
                          : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest">{cat.name}</span>
                      {formData.related_categories.includes(cat.id) && <Check className="h-3 w-3" />}
                    </div>
                  ))}
                </div>
             </div>

             <div className="border-t border-gray-50 pt-6 flex flex-col gap-3">
                <Button variant="primary" size="lg" onClick={handleSubmit} loading={loading} className="w-full h-12 text-xs">
                  <Save className="mr-2 h-4 w-4" />
                  Persist Product
                </Button>
                <Link href="/admin/products" className="w-full">
                   <Button variant="outline" size="lg" className="w-full h-12 bg-white text-xs">Cancel Entry</Button>
                </Link>
             </div>
            </div>
          </div>
        </div>
        <MediaSelectorModal
          isOpen={isMediaSelectorOpen}
          onClose={() => setIsMediaSelectorOpen(false)}
          multiple={true}
          onSelect={(urls) => setImages(urls)}
          selectedUrls={images}
        />
        <MediaSelectorModal
          isOpen={isVariantMediaOpen}
          onClose={() => {
            setIsVariantMediaOpen(false)
            setSelectedVariantIndexForImage(null)
          }}
          multiple={false}
          onSelect={(urls) => {
            if (urls.length > 0 && selectedVariantIndexForImage !== null) {
              handleVariantChange(selectedVariantIndexForImage, "image_url", urls[0])
            }
            setIsVariantMediaOpen(false)
            setSelectedVariantIndexForImage(null)
          }}
          selectedUrls={selectedVariantIndexForImage !== null && variants[selectedVariantIndexForImage]?.image_url ? [variants[selectedVariantIndexForImage].image_url!] : []}
        />
        {toast.show && (
          <div className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 bg-black border border-white/10 text-white px-8 py-5 rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] max-w-sm">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-md",
              toast.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
              {toast.type === "success" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4 animate-pulse" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                {toast.type === "success" ? "Operation Success" : "Operation Failed"}
              </p>
              <p className="text-xs font-semibold mt-1 leading-normal text-white">{toast.message}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">{label}</label>
      {children}
    </div>
  )
}
