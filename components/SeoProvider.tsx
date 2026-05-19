"use client"

import * as React from "react"
import Script from "next/script"
import { createClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"

export function SeoProvider() {
  const supabase = createClient()
  const pathname = usePathname()
  const [settings, setSettings] = React.useState<any>(null)

  React.useEffect(() => {
    async function load() {
      const { data } = await supabase.from("seo_settings").select("*").single()
      if (data) setSettings(data)
    }
    load()
  }, [])

  const getSlugFromPath = (path: string) => {
    if (path === "/") return "home"
    const parts = path.split("/").filter(Boolean)
    if (parts[0] === "products") return "product"
    return parts[0] || "home"
  }

  React.useEffect(() => {
    async function updateSeo() {
      if (!settings) return
      
      // Skip admin paths
      if (pathname.startsWith("/admin")) return

      const slug = getSlugFromPath(pathname)
      let title = ""
      let description = settings.default_meta_description || ""
      let ogImage = settings.og_default_image_url || ""

      // Fetch page-specific SEO from database
      const { data: pageSeo } = await supabase
        .from("page_seo")
        .select("*")
        .eq("page_slug", slug)
        .maybeSingle()

      if (pageSeo) {
        title = pageSeo.meta_title || ""
        description = pageSeo.meta_description || description
        ogImage = pageSeo.og_image_url || ogImage
      }

      // Fallback details if pageSeo not defined yet
      if (!title) {
        if (slug === "home") title = "Shop Purity & Premium Oils"
        else title = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      }

      // Format final title based on the global template
      const titleTemplate = settings.meta_title_template || "{Page Title} | Telkidukan"
      const finalTitle = titleTemplate
        .replace("{Page Title}", title)
        .replace("{Site Name}", "Telkidukan")

      document.title = finalTitle

      // Update meta description tag
      if (description) {
        let metaDesc = document.querySelector('meta[name="description"]')
        if (!metaDesc) {
          metaDesc = document.createElement('meta')
          metaDesc.setAttribute('name', 'description')
          document.head.appendChild(metaDesc)
        }
        metaDesc.setAttribute('content', description)
      }

      // Update OpenGraph Title
      let ogTitleTag = document.querySelector('meta[property="og:title"]')
      if (!ogTitleTag) {
        ogTitleTag = document.createElement('meta')
        ogTitleTag.setAttribute('property', 'og:title')
        document.head.appendChild(ogTitleTag)
      }
      ogTitleTag.setAttribute('content', finalTitle)

      // Update OpenGraph Description
      if (description) {
        let ogDescTag = document.querySelector('meta[property="og:description"]')
        if (!ogDescTag) {
          ogDescTag = document.createElement('meta')
          ogDescTag.setAttribute('property', 'og:description')
          document.head.appendChild(ogDescTag)
        }
        ogDescTag.setAttribute('content', description)
      }

      // Update OpenGraph Image
      if (ogImage) {
        let ogImageTag = document.querySelector('meta[property="og:image"]')
        if (!ogImageTag) {
          ogImageTag = document.createElement('meta')
          ogImageTag.setAttribute('property', 'og:image')
          document.head.appendChild(ogImageTag)
        }
        ogImageTag.setAttribute('content', ogImage)
      }
    }

    updateSeo()
  }, [pathname, settings])

  if (!settings) return null

  return (
    <>
      {/* Google Analytics */}
      {settings.ga_tracking_id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga_tracking_id}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.ga_tracking_id}');
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {settings.fb_pixel_id && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${settings.fb_pixel_id}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Search Console Meta Tag */}
      {settings.search_console_meta && (
        <div dangerouslySetInnerHTML={{ __html: settings.search_console_meta }} />
      )}
    </>
  )
}

