"use client"

import Link from "next/link"
import { Camera, MessageCircle, X } from "lucide-react"
import { useSettings } from "@/hooks/useSettings"

export function Footer() {
  const { settings } = useSettings()
  const currentYear = new Date().getFullYear()

  const sanitizeUrl = (url: string | undefined, fallback: string) => {
    if (!url || url.trim() === "") return fallback
    const trimmed = url.trim()
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed
    }
    return `https://${trimmed}`
  }

  const sections = [
    {
      title: "Navigation",
      links: [
        { name: "Shop All", href: "/products" },
        { name: "New Arrivals", href: "/products?sort=newest" },
        { name: "Collections", href: "/collections" },
        { name: "About Us", href: "/about" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Contact", href: "/contact" },
        { name: "Shipping & Returns", href: "/shipping" },
        { name: "FAQ", href: "/faq" },
        { name: "Privacy Policy", href: "/privacy" },
      ],
    },
  ]

  return (
    <footer className="bg-black px-6 py-12 text-white md:px-16 lg:py-16 border-t border-white/5">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col items-start text-left">
            <Link href="/" className="flex items-center gap-2">
              {settings?.logo_inverted_url || settings?.logo_url ? (
                <img 
                  src={settings.logo_inverted_url || settings.logo_url} 
                  alt={settings.site_name || "Logo"} 
                  className={`h-8 w-auto object-contain ${!settings.logo_inverted_url ? "brightness-0 invert" : ""}`}
                />
              ) : (
                <>
                  <span className="font-serif text-3xl font-extrabold tracking-tight text-white uppercase">
                    {settings?.site_name || "Telkidukan"}
                  </span>
                  <div className="h-5 w-[2px] bg-zinc-800 rotate-[15deg]" />
                </>
              )}
            </Link>
            <p className="mt-4 max-w-xs text-[11px] leading-relaxed text-zinc-500 font-semibold uppercase tracking-wider">
              {settings?.tagline || "Redefining the essence of purity through meticulous craftsmanship and sustainable organic sourcing."}
            </p>
            <div className="mt-6 flex gap-6">
              <a 
                href={sanitizeUrl(settings?.social_instagram, "https://instagram.com")} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-600 transition-all hover:text-[#E1306C] hover:scale-110" 
                aria-label="Instagram"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a 
                href={sanitizeUrl(settings?.social_facebook, "https://facebook.com")} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-600 transition-all hover:text-[#1877F2] hover:scale-110" 
                aria-label="Facebook"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
              <a 
                href={sanitizeUrl(settings?.social_twitter, "https://x.com")} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-600 transition-all hover:text-white hover:scale-110" 
                aria-label="Twitter X"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-4 text-left">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">
                  {section.title}
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-500 transition-all hover:text-white"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-4 text-left">
            <h3 className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">
              Get in Touch
            </h3>
            <ul className="mt-4 flex flex-col gap-4">
              <li className="flex flex-col gap-1">
                <span className="text-[8px] font-extrabold uppercase tracking-[0.25em] text-zinc-700">Concierge Email</span>
                <a href={`mailto:${settings?.contact_email}`} className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                  {settings?.contact_email || "info@gmail.com"}
                </a>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-[8px] font-extrabold uppercase tracking-[0.25em] text-zinc-700">Studio HQ</span>
                <span className="text-xs font-bold leading-relaxed text-zinc-400">
                  {settings?.business_address || "01, ABC Road, XYZ Street, OPQ City"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-600">
            © {currentYear} Telkidukan Group. Crafted for Purity.
          </p>
          <div className="flex gap-8 text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-600">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/shipping" className="hover:text-white transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
