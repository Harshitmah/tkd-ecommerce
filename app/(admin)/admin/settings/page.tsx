"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Settings, 
  Globe, 
  CreditCard,
  Save,
  MessageSquare,
  Share2,
  Megaphone,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
  Truck,
  X
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import { ensureStorageBuckets, uploadBrandAsset, uploadBannerAsset, saveSiteSettings } from "@/app/actions/storage"

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

type SiteSettings = {
  id?: string
  site_name: string
  tagline: string
  logo_url: string
  logo_inverted_url: string
  favicon_url: string
  contact_email: string
  contact_phone: string
  business_address: string
  currency_code: string
  currency_symbol: string
  tax_rate: number
  tax_inclusive: boolean
  announcement_bar_active: boolean
  announcement_bar_text: string
  announcement_bar_link: string
  announcement_bar_color: string
  social_instagram: string
  social_facebook: string
  social_twitter: string
  social_tiktok: string
  social_youtube: string
  razorpay_enabled: boolean
  cod_enabled: boolean
  show_categories_in_navbar?: boolean
}

const defaultSettings: SiteSettings = {
  site_name: "Telkidukan",
  tagline: "Pure Organic Essentials",
  logo_url: "",
  logo_inverted_url: "",
  favicon_url: "",
  contact_email: "",
  contact_phone: "",
  business_address: "",
  currency_code: "INR",
  currency_symbol: "₹",
  tax_rate: 18,
  tax_inclusive: true,
  announcement_bar_active: false,
  announcement_bar_text: "",
  announcement_bar_link: "",
  announcement_bar_color: "#1A1A1A",
  social_instagram: "",
  social_facebook: "",
  social_twitter: "",
  social_tiktok: "",
  social_youtube: "",
  razorpay_enabled: false,
  cod_enabled: true,
  show_categories_in_navbar: false
}

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = React.useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("general")
  const [heroSlide, setHeroSlide] = React.useState<any>(null)
  const [bannerUrl, setBannerUrl] = React.useState("")
  const [bannerHeading, setBannerHeading] = React.useState("")
  const [bannerSubheading, setBannerSubheading] = React.useState("")
  const [bannerCtaText, setBannerCtaText] = React.useState("")
  const [bannerCtaLink, setBannerCtaLink] = React.useState("")

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

  React.useEffect(() => {
    async function load() {
      // Auto-provision storage buckets (brand-assets, media-library)
      await ensureStorageBuckets()

      const { data, error } = await supabase.from("site_settings").select("*").maybeSingle()
      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
          show_categories_in_navbar: data.social_youtube === "true"
        })
      }

      // Fetch Hero Slide
      const { data: slide } = await supabase.from("hero_slides").select("*").order("sort_order").limit(1).maybeSingle()
      if (slide) {
        setHeroSlide(slide)
        setBannerUrl(slide.image_url || "")
        setBannerHeading(slide.heading || "")
        setBannerSubheading(slide.subheading || "")
        setBannerCtaText(slide.cta_text || "")
        setBannerCtaLink(slide.cta_link || "")
      }

      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { id, created_at, show_categories_in_navbar, ...updateData }: any = settings
    const payload = {
      ...updateData,
      social_youtube: show_categories_in_navbar ? "true" : "false",
      updated_at: new Date().toISOString()
    }

    const res = await saveSiteSettings(payload, id)
    
    // Save Hero Slide
    try {
      if (heroSlide?.id) {
        await supabase.from("hero_slides").update({
          image_url: bannerUrl,
          heading: bannerHeading,
          subheading: bannerSubheading,
          cta_text: bannerCtaText,
          cta_link: bannerCtaLink,
        }).eq("id", heroSlide.id)
      } else {
        const { data: newSlide } = await supabase.from("hero_slides").insert({
          image_url: bannerUrl || '/images/hero-banner.png',
          heading: bannerHeading || 'Elevate Your\nDaily Routine.',
          subheading: bannerSubheading || 'Discover our new collection of meticulously crafted essentials for modern living.',
          cta_text: bannerCtaText || 'Shop Collection',
          cta_link: bannerCtaLink || '/products',
          is_active: true,
          sort_order: 0
        }).select().single()
        if (newSlide) setHeroSlide(newSlide)
      }
    } catch (e: any) {
      console.error("Error saving hero slide banner:", e)
    }
    
    setSaving(false)
    if (!res.success) {
      showToast("Error saving settings: " + res.error, "error")
    } else {
      showToast("Settings persisted successfully!", "success")
      if (!id && res.data?.id) {
        setSettings(p => ({ ...p, id: res.data.id }))
      }
    }
  }

  const uploadLogo = async (file: File, field: 'logo_url' | 'logo_inverted_url' | 'favicon_url') => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Logo uploads are limited to 5MB. Please upload a smaller logo.", "error")
        return
      }

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

      const fileName = `${field}-${Date.now()}.${file.name.split('.').pop()}`
      const res = await uploadBrandAsset(base64, fileName, file.type)

      if (!res.success) {
        showToast("Upload failed: " + res.error, "error")
        return
      }

      setSettings(prev => ({ ...prev, [field]: res.publicUrl }))
      showToast(`${field.replace('_', ' ').replace('url', '').toUpperCase()} asset uploaded!`, "success")
    } catch (err: any) {
      showToast("Upload failed: " + err.message, "error")
    }
  }

  const uploadBanner = async (file: File) => {
    try {
      if (file.size > 50 * 1024 * 1024) {
        showToast("Banner uploads are limited to 50MB.", "error")
        return
      }

      const fileName = `hero-banner-${Date.now()}.${file.name.split('.').pop()}`
      const formData = new FormData()
      formData.append("file", file)
      formData.append("filename", fileName)
      formData.append("mimeType", file.type)

      const res = await uploadBannerAsset(formData)

      if (!res.success) {
        showToast("Banner upload failed: " + res.error, "error")
        return
      }

      setBannerUrl(res.publicUrl || "")
      showToast("Storefront hero banner uploaded successfully!", "success")
    } catch (err: any) {
      showToast("Banner upload failed: " + err.message, "error")
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Configuration...</p>
      </div>
    )
  }

  const tabs = [
    { id: "general", name: "Store Identity", icon: Settings },
    { id: "contact", name: "Communications", icon: MessageSquare },
    { id: "social", name: "Social Presence", icon: Share2 },
    { id: "announcement", name: "Announcements", icon: Megaphone },
    { id: "regional", name: "Localization", icon: Globe },
    { id: "billing", name: "Tax & Finance", icon: CreditCard },
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black font-serif">Global Configuration</h1>
          <p className="mt-1 text-sm text-gray-500">Define your brand essence and operational parameters.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="px-10">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Persist All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3">
          <nav className="flex flex-col gap-1 sticky top-32">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center justify-between px-6 py-4 transition-all group border-l-2",
                  activeTab === tab.id 
                    ? "bg-white text-black border-black shadow-sm font-bold" 
                    : "text-gray-400 border-transparent hover:text-black hover:bg-gray-50/50"
                )}
              >
                <div className="flex items-center gap-4">
                   <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-black" : "text-gray-300 group-hover:text-black")} />
                   <span className="text-[11px] uppercase tracking-widest">{tab.name}</span>
                </div>
                {activeTab === tab.id && <ChevronRight className="h-3 w-3" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-12 pb-20">
          {activeTab === "general" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Section title="Visual Identity" description="Manage your store's name, tagline and brand visual assets.">
                <div className="grid gap-8">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <Field label="Legal Entity Name">
                      <Input value={settings.site_name} onChange={e => setSettings(p => ({ ...p, site_name: e.target.value }))} />
                    </Field>
                    <Field label="Brand Tagline">
                      <Input value={settings.tagline} onChange={e => setSettings(p => ({ ...p, tagline: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="pt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
                    <LogoUpload label="Global Primary Logo" url={settings.logo_url} onUpload={f => uploadLogo(f, 'logo_url')} />
                    <LogoUpload label="Monochrome Inverted" url={settings.logo_inverted_url} onUpload={f => uploadLogo(f, 'logo_inverted_url')} dark />
                    <LogoUpload label="System Favicon" url={settings.favicon_url} onUpload={f => uploadLogo(f, 'favicon_url')} small />
                  </div>
                </div>
              </Section>

              <Section title="Storefront Navigation" description="Customize how navigation links and categories are displayed in the header.">
                <div className="p-8 bg-gray-50/50 border border-gray-100 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left">
                     <div className="h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-black">
                        <Globe className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-black">Category Tabs in Navbar</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">
                          {settings.show_categories_in_navbar ? 'Displaying Categories directly as Navbar Tabs' : 'Displaying Standard links only'}
                        </p>
                     </div>
                  </div>
                  <Toggle active={!!settings.show_categories_in_navbar} onClick={() => setSettings(p => ({ ...p, show_categories_in_navbar: !p.show_categories_in_navbar }))} />
                </div>
              </Section>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Section title="Communication Channels" description="Configure how Telkidukan interacts with customers.">
                <div className="grid gap-8">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <Field label="Primary Concierge Email">
                      <Input type="email" value={settings.contact_email} onChange={e => setSettings(p => ({ ...p, contact_email: e.target.value }))} />
                    </Field>
                    <Field label="Direct Support Phone">
                      <Input value={settings.contact_phone} onChange={e => setSettings(p => ({ ...p, contact_phone: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="Physical Headquarters Address">
                    <textarea 
                      rows={3}
                      value={settings.business_address}
                      onChange={e => setSettings(p => ({ ...p, business_address: e.target.value }))}
                      className="w-full bg-transparent border-b border-gray-100 py-4 text-sm outline-none focus:border-black transition-all resize-none placeholder:text-gray-300"
                      placeholder="Street address, suite, city, postal code..."
                    />
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Section title="Social Ecosystem" description="Connect your brand's presence across major social platforms.">
                <div className="grid gap-8 md:grid-cols-2">
                  <Field label="Instagram Profile">
                    <Input placeholder="https://instagram.com/telkidukan" value={settings.social_instagram} onChange={e => setSettings(p => ({ ...p, social_instagram: e.target.value }))} />
                  </Field>
                  <Field label="Facebook Page">
                    <Input placeholder="https://facebook.com/telkidukan" value={settings.social_facebook} onChange={e => setSettings(p => ({ ...p, social_facebook: e.target.value }))} />
                  </Field>
                  <Field label="X (Twitter) Handle">
                    <Input placeholder="https://twitter.com/telkidukan" value={settings.social_twitter} onChange={e => setSettings(p => ({ ...p, social_twitter: e.target.value }))} />
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {activeTab === "announcement" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Section title="Broadcast Center" description="Manage site-wide promotional messages and alerts.">
                <div className="space-y-10">
                  <div className="p-6 bg-blue-50/40 border border-blue-100/50 rounded-[24px] flex items-start gap-4 animate-in fade-in duration-300">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Storefront Banner Customization</p>
                      <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        Looking to update your main storefront homepage slider or banner? You can change your homepage background image, heading, subtext, and call-to-action link in the <strong>Storefront Hero Banner</strong> section right below in this tab!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-8 bg-gray-50/50 border border-gray-100 rounded-3xl">
                    <div className="flex gap-4">
                       <div className="h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-black">
                          <Megaphone className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-black">Announcement Visibility</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Status: {settings.announcement_bar_active ? 'Online' : 'Offline'}</p>
                       </div>
                    </div>
                    <Toggle active={settings.announcement_bar_active} onClick={() => setSettings(p => ({ ...p, announcement_bar_active: !p.announcement_bar_active }))} />
                  </div>

                  <div className="grid grid-cols-1 gap-10">
                    <Field label="Broadcast Message">
                      <Input placeholder="Free shipping on all premium collections" value={settings.announcement_bar_text} onChange={e => setSettings(p => ({ ...p, announcement_bar_text: e.target.value }))} />
                    </Field>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <Field label="Target Destination Link">
                        <Input placeholder="/products/new-arrivals" value={settings.announcement_bar_link} onChange={e => setSettings(p => ({ ...p, announcement_bar_link: e.target.value }))} />
                      </Field>
                      <Field label="Visual Accent Color">
                        <div className="flex gap-4">
                          <div className="relative h-12 w-12 border border-gray-100 rounded-xl overflow-hidden shrink-0">
                             <input type="color" className="absolute inset-0 scale-150 cursor-pointer" value={settings.announcement_bar_color} onChange={e => setSettings(p => ({ ...p, announcement_bar_color: e.target.value }))} />
                          </div>
                          <Input className="flex-1" value={settings.announcement_bar_color} onChange={e => setSettings(p => ({ ...p, announcement_bar_color: e.target.value }))} />
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Storefront Hero Banner" description="Upload and configure the visual banner displayed at the top of the storefront homepage.">
                <div className="grid gap-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <Field label="Hero Banner Heading (Supports newlines)">
                        <textarea 
                          rows={2}
                          placeholder="Elevate Your Daily Routine"
                          value={bannerHeading} 
                          onChange={e => setBannerHeading(e.target.value)} 
                          className="w-full bg-transparent border-b border-gray-100 py-3 text-sm outline-none focus:border-black transition-all resize-none placeholder:text-gray-300 font-sans"
                        />
                      </Field>
                      <Field label="Hero Banner Subheading">
                        <textarea 
                          rows={3}
                          placeholder="Discover our new collection of meticulously crafted essentials for modern living."
                          value={bannerSubheading} 
                          onChange={e => setBannerSubheading(e.target.value)} 
                          className="w-full bg-transparent border-b border-gray-100 py-3 text-sm outline-none focus:border-black transition-all resize-none placeholder:text-gray-300 font-sans"
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="CTA Button Text">
                          <Input placeholder="Shop Collection" value={bannerCtaText} onChange={e => setBannerCtaText(e.target.value)} />
                        </Field>
                        <Field label="CTA Button Link">
                          <Input placeholder="/products" value={bannerCtaLink} onChange={e => setBannerCtaLink(e.target.value)} />
                        </Field>
                      </div>
                    </div>
                    <div className="flex flex-col justify-start">
                      <LogoUpload label="Hero Banner Image" url={bannerUrl} onUpload={uploadBanner} />
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {activeTab === "regional" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Section title="Regional Preferences" description="Define currency, localization and display units.">
                <div className="grid gap-8 md:grid-cols-2">
                  <Field label="System Currency ISO">
                    <Input value={settings.currency_code} onChange={e => setSettings(p => ({ ...p, currency_code: e.target.value }))} />
                  </Field>
                  <Field label="Visual Currency Token">
                    <Input value={settings.currency_symbol} onChange={e => setSettings(p => ({ ...p, currency_symbol: e.target.value }))} />
                  </Field>
                </div>
              </Section>

              <Section title="Shipping & Delivery Areas" description="Configure which Indian states and union territories your store can deliver to. Only selected states will be eligible for checkout shipping.">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSettings(p => ({ ...p, social_tiktok: INDIAN_STATES.join(", ") }))}
                      className="rounded-xl"
                    >
                      Deliver to All States
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSettings(p => ({ ...p, social_tiktok: "" }))}
                      className="rounded-xl text-red-500 border-red-100 hover:bg-red-50"
                    >
                      Disable All Deliveries
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {INDIAN_STATES.map((state) => {
                      const allowedStates = settings.social_tiktok ? settings.social_tiktok.split(", ").map(s => s.trim()) : [];
                      const isSelected = allowedStates.includes(state);
                      
                      return (
                        <div 
                          key={state}
                          onClick={() => {
                            let newStates;
                            if (isSelected) {
                              newStates = allowedStates.filter(s => s !== state).join(", ");
                            } else {
                              newStates = [...allowedStates, state].join(", ");
                            }
                            setSettings(p => ({ ...p, social_tiktok: newStates }));
                          }}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none text-left",
                            isSelected 
                              ? "bg-black border-black text-white shadow-sm" 
                              : "bg-gray-50/50 border-gray-100 hover:border-black/10 text-black"
                          )}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-widest">{state}</span>
                          <div className={cn(
                            "h-4 w-4 rounded-full border flex items-center justify-center transition-all shrink-0",
                            isSelected ? "border-white bg-white" : "border-gray-300"
                          )}>
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-black" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Section>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Section title="Financial Controls" description="Configure taxation rates and billing logic.">
                <div className="grid gap-10">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <Field label="Standard Tax Rate (%)">
                      <Input type="number" value={settings.tax_rate} onChange={e => setSettings(p => ({ ...p, tax_rate: Number(e.target.value) }))} />
                    </Field>
                    <div className="p-8 bg-gray-50/50 border border-gray-100 rounded-3xl flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-black">
                             <CreditCard className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-black">Inclusive Pricing</span>
                       </div>
                       <Toggle active={settings.tax_inclusive} onClick={() => setSettings(p => ({ ...p, tax_inclusive: !p.tax_inclusive }))} />
                    </div>
                  </div>

                  {/* Razorpay & COD Section */}
                  <div className="border-t border-gray-100 pt-10">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-8">Payment Gateways</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-gray-50 border border-gray-100 rounded-3xl flex flex-col justify-between h-48 group hover:border-black transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 blur-[60px] rounded-full -translate-y-12 translate-x-12" />
                        <div className="flex justify-between items-start relative z-10">
                          <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5 text-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-black">Razorpay Interface</span>
                          </div>
                          <Toggle active={settings.razorpay_enabled} onClick={() => setSettings(p => ({ ...p, razorpay_enabled: !p.razorpay_enabled }))} />
                        </div>
                        <div className="relative z-10">
                           <div className="flex items-center gap-2 mb-2">
                              <div className={cn("h-2 w-2 rounded-full", settings.razorpay_enabled ? "bg-emerald-500" : "bg-gray-300")} />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-black">
                                Status: {settings.razorpay_enabled ? 'Functional' : 'Interface disabled'}
                              </span>
                           </div>
                           <p className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-widest">Connected via production API keys.</p>
                        </div>
                      </div>

                      <div className="p-8 bg-gray-50 border border-gray-100 rounded-3xl flex flex-col justify-between h-48 group hover:border-black transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Truck className="h-5 w-5 text-black" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-black">Cash On Delivery</span>
                          </div>
                          <Toggle active={settings.cod_enabled} onClick={() => setSettings(p => ({ ...p, cod_enabled: !p.cod_enabled }))} />
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-2">
                              <div className={cn("h-2 w-2 rounded-full", settings.cod_enabled ? "bg-emerald-500" : "bg-gray-300")} />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-black">
                                {settings.cod_enabled ? 'Ready for selection' : 'Gateway disabled'}
                              </span>
                           </div>
                           <p className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-widest">Allow customers to pay upon receipt.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="State-Specific Tax Rates" description="Configure custom tax rates for individual Indian states. States without a custom rate will default to the standard rate above.">
                {(() => {
                  const allowedStatesList = settings.social_tiktok 
                    ? settings.social_tiktok.split(", ").map(s => s.trim()).filter(Boolean) 
                    : [];
                  
                  let stateTaxMap: Record<string, number> = {};
                  if (settings.social_instagram) {
                    try {
                      stateTaxMap = JSON.parse(settings.social_instagram);
                    } catch (e) {
                      stateTaxMap = {};
                    }
                  }

                  const updateStateTax = (stateName: string, rate: number) => {
                    const newMap = { ...stateTaxMap, [stateName]: rate };
                    setSettings(p => ({ ...p, social_instagram: JSON.stringify(newMap) }));
                  };

                  if (allowedStatesList.length === 0) {
                    return (
                      <div className="p-10 bg-zinc-50/50 border border-zinc-100 rounded-3xl text-center">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No Deliverable States Configured</p>
                        <p className="text-[9px] text-gray-400 mt-2 uppercase tracking-widest leading-relaxed">
                          Please go to the "Localization" tab and enable delivery for states first.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allowedStatesList.map((state) => {
                        const currentRate = stateTaxMap[state] !== undefined ? stateTaxMap[state] : "";
                        return (
                          <div key={state} className="p-6 bg-gray-50/50 border border-gray-100 rounded-3xl flex flex-col justify-between gap-4">
                            <span className="text-[11px] font-extrabold uppercase tracking-widest text-black">{state}</span>
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                placeholder="Uses default rate"
                                value={currentRate}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? undefined : Number(e.target.value);
                                  if (val === undefined) {
                                    const newMap = { ...stateTaxMap };
                                    delete newMap[state];
                                    setSettings(p => ({ ...p, social_instagram: Object.keys(newMap).length > 0 ? JSON.stringify(newMap) : "" }));
                                  } else {
                                    updateStateTax(state, val);
                                  }
                                }}
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold outline-none focus:border-black transition-all pr-10"
                              />
                              <span className="absolute right-4 text-[10px] font-bold text-gray-400">%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Section>
            </div>
          )}
          {toast.show && (
            <div className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 bg-black border border-white/10 text-white px-8 py-5 rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] max-w-sm">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-md",
                toast.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              )}>
                {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4 animate-pulse" />}
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
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-[32px] p-10 shadow-sm">
      <div className="mb-10 flex flex-col gap-2">
        <h3 className="text-lg font-bold text-black uppercase tracking-widest">{title}</h3>
        <p className="text-xs text-gray-400 font-medium">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-1.5">
        <Info className="h-3 w-3" />
        {label}
      </label>
      {children}
    </div>
  )
}

function Toggle({ active, onClick, white = false }: { active: boolean; onClick: () => void; white?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "h-7 w-12 rounded-full relative transition-all cursor-pointer p-1",
        active ? (white ? "bg-gold" : "bg-black") : (white ? "bg-white/10" : "bg-gray-200")
      )}
    >
       <div className={cn(
         "h-5 w-5 rounded-full transition-all shadow-sm",
         active ? "translate-x-5 bg-white" : cn("translate-x-0", white ? "bg-white/20" : "bg-white")
       )} />
    </div>
  )
}

function LogoUpload({ label, url, onUpload, dark = false, small = false }: { label: string; url: string; onUpload: (f: File) => void, dark?: boolean, small?: boolean }) {
  const inputId = `upload-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">{label}</label>
      <div 
        className={cn(
          "relative rounded-[24px] border border-gray-100 flex flex-col items-center justify-center transition-all overflow-hidden group shadow-sm",
          small ? "h-24 w-24 mx-auto" : "aspect-[3/2] w-full",
          dark ? "bg-black" : "bg-zinc-50"
        )}
      >
        {url ? (
          <img src={url} alt={label} className={cn("object-contain transition-transform duration-500 group-hover:scale-105", small ? "h-12 w-12" : "h-full w-full p-8")} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-200">
             <ImageIcon className={cn(small ? "h-6 w-6" : "h-8 w-8")} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
          <label htmlFor={inputId} className="cursor-pointer text-[9px] font-bold text-black uppercase tracking-widest bg-white px-5 py-2.5 rounded-full shadow-lg">
            Modify Asset
          </label>
        </div>
      </div>
      <input type="file" id={inputId} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
    </div>
  )
}
