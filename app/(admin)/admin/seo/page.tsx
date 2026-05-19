"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Save, Globe, FileText, Search, BarChart2, Code } from "lucide-react"

type SeoSettings = {
  id?: string
  meta_title_template: string
  default_meta_description: string
  og_default_image_url: string
  ga_tracking_id: string
  fb_pixel_id: string
  search_console_meta: string
  robots_txt: string
}

type PageSeo = {
  id?: string
  page_slug: string
  meta_title: string
  meta_description: string
  og_image_url: string
}

const PAGE_SLUGS = [
  { slug: "home", label: "Homepage" },
  { slug: "about", label: "About Us" },
  { slug: "contact", label: "Contact" },
  { slug: "faq", label: "FAQ" },
  { slug: "shipping-policy", label: "Shipping Policy" },
  { slug: "returns-policy", label: "Returns Policy" },
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-of-service", label: "Terms of Service" },
]

const defaultGlobal: SeoSettings = {
  meta_title_template: "{Page Title} | Telkidukan",
  default_meta_description: "",
  og_default_image_url: "",
  ga_tracking_id: "",
  fb_pixel_id: "",
  search_console_meta: "",
  robots_txt: "User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: /sitemap.xml",
}

export default function SeoPage() {
  const supabase = createClient()
  const [tab, setTab] = React.useState<"global" | "pages" | "robots">("global")
  const [global, setGlobal] = React.useState<SeoSettings>(defaultGlobal)
  const [pages, setPages] = React.useState<Record<string, PageSeo>>({})
  const [saving, setSaving] = React.useState(false)
  const [toast, setToast] = React.useState("")

  React.useEffect(() => {
    async function load() {
      const { data: g } = await supabase.from("seo_settings").select("*").single()
      if (g) setGlobal(g as SeoSettings)

      const { data: p } = await supabase.from("page_seo").select("*")
      if (p) {
        const map: Record<string, PageSeo> = {}
        p.forEach((row: PageSeo) => { map[row.page_slug] = row })
        setPages(map)
      }
    }
    load()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  async function saveGlobal() {
    setSaving(true)
    const { error } = global.id
      ? await supabase.from("seo_settings").update({ ...global, updated_at: new Date().toISOString() }).eq("id", global.id)
      : await supabase.from("seo_settings").insert({ ...global, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) showToast("❌ Error: " + error.message)
    else showToast("✅ SEO settings saved!")
  }

  async function savePage(slug: string) {
    setSaving(true)
    const row = pages[slug] || { page_slug: slug, meta_title: "", meta_description: "", og_image_url: "" }
    const { error } = row.id
      ? await supabase.from("page_seo").update(row).eq("id", row.id)
      : await supabase.from("page_seo").insert(row)
    setSaving(false)
    if (error) showToast("❌ Error: " + error.message)
    else showToast("✅ Page SEO saved!")
  }

  function updatePage(slug: string, field: keyof PageSeo, value: string) {
    setPages(prev => {
      const current = prev[slug] || { page_slug: slug, meta_title: "", meta_description: "", og_image_url: "" }
      return {
        ...prev,
        [slug]: { ...current, [field]: value }
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Management</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Control how your store appears in search engines.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-black/5 dark:bg-white/5 p-1 w-fit">
        {[
          { key: "global", label: "Global SEO", icon: Globe },
          { key: "pages", label: "Per-Page SEO", icon: FileText },
          { key: "robots", label: "Robots.txt", icon: Code },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === key ? "bg-white dark:bg-white/10 shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Global SEO Tab */}
      {tab === "global" && (
        <div className="grid gap-6 max-w-3xl">
          <Card title="Meta & Titles">
            <Field label="Title Template" hint='Use {Page Title} and {Site Name} as placeholders'>
              <input value={global.meta_title_template} onChange={e => setGlobal(p => ({ ...p, meta_title_template: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Default Meta Description">
              <textarea rows={3} value={global.default_meta_description} onChange={e => setGlobal(p => ({ ...p, default_meta_description: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Default OG Image URL">
              <input value={global.og_default_image_url} onChange={e => setGlobal(p => ({ ...p, og_default_image_url: e.target.value }))} className={inputCls} placeholder="https://..." />
            </Field>
          </Card>

          <Card title="Analytics & Tracking">
            <Field label="Google Analytics 4 ID" hint="e.g. G-XXXXXXXXXX">
              <input value={global.ga_tracking_id} onChange={e => setGlobal(p => ({ ...p, ga_tracking_id: e.target.value }))} className={inputCls} placeholder="G-XXXXXXXXXX" />
            </Field>
            <Field label="Facebook Pixel ID">
              <input value={global.fb_pixel_id} onChange={e => setGlobal(p => ({ ...p, fb_pixel_id: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Google Search Console Meta Tag" hint="Paste the full <meta name=...> tag">
              <input value={global.search_console_meta} onChange={e => setGlobal(p => ({ ...p, search_console_meta: e.target.value }))} className={inputCls} placeholder='<meta name="google-site-verification" content="..." />' />
            </Field>
          </Card>

          <button onClick={saveGlobal} disabled={saving} className={saveBtnCls}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Global SEO"}
          </button>
        </div>
      )}

      {/* Per-Page SEO Tab */}
      {tab === "pages" && (
        <div className="space-y-4 max-w-3xl">
          {PAGE_SLUGS.map(({ slug, label }) => (
            <Card key={slug} title={label} collapsible>
              <Field label="Meta Title">
                <input value={pages[slug]?.meta_title || ""} onChange={e => updatePage(slug, "meta_title", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Meta Description">
                <textarea rows={2} value={pages[slug]?.meta_description || ""} onChange={e => updatePage(slug, "meta_description", e.target.value)} className={inputCls} />
              </Field>
              <Field label="OG Image URL">
                <input value={pages[slug]?.og_image_url || ""} onChange={e => updatePage(slug, "og_image_url", e.target.value)} className={inputCls} placeholder="https://..." />
              </Field>
              <button onClick={() => savePage(slug)} disabled={saving} className={saveBtnCls}>
                <Save className="h-4 w-4" /> Save {label}
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Robots.txt Tab */}
      {tab === "robots" && (
        <div className="max-w-3xl space-y-4">
          <Card title="robots.txt Content">
            <p className="text-xs text-zinc-500 mb-3">This content will be served at <code className="bg-black/5 dark:bg-white/5 px-1 rounded">/robots.txt</code>.</p>
            <textarea
              rows={12}
              value={global.robots_txt}
              onChange={e => setGlobal(p => ({ ...p, robots_txt: e.target.value }))}
              className={`${inputCls} font-mono text-sm`}
            />
          </Card>
          <button onClick={saveGlobal} disabled={saving} className={saveBtnCls}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Robots.txt"}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 rounded-2xl bg-black dark:bg-white text-white dark:text-black px-6 py-4 text-sm font-medium shadow-2xl animate-in slide-in-from-right">
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────
const inputCls = "w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
const saveBtnCls = "flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"

function Card({ title, children, collapsible = false }: { title: string; children: React.ReactNode; collapsible?: boolean }) {
  const [open, setOpen] = React.useState(!collapsible)
  return (
    <div className="rounded-3xl border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 overflow-hidden">
      <button
        className={`flex w-full items-center justify-between px-8 py-5 font-semibold text-sm ${collapsible ? "cursor-pointer hover:bg-black/2" : "cursor-default"}`}
        onClick={() => collapsible && setOpen(o => !o)}
      >
        {title}
        {collapsible && <span className="text-zinc-400">{open ? "▲" : "▼"}</span>}
      </button>
      {open && <div className="px-8 pb-8 space-y-4">{children}</div>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  )
}
