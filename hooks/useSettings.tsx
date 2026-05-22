"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"

interface SiteSettings {
  site_name: string
  tagline: string
  logo_url: string
  logo_inverted_url: string
  contact_email: string
  contact_phone: string
  business_address: string
  social_instagram: string
  social_facebook: string
  social_twitter: string
  social_tiktok: string
  social_youtube: string
  announcement_bar_active: boolean
  announcement_bar_text: string
  announcement_bar_link: string
  announcement_bar_color: string
  currency_code: string
  currency_symbol: string
  show_categories_in_navbar?: boolean
}

interface SettingsContextType {
  settings: SiteSettings | null
  loading: boolean
}

const SettingsContext = React.createContext<SettingsContextType>({
  settings: null,
  loading: true,
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<SiteSettings | null>(null)
  const [loading, setLoading] = React.useState(true)
  const supabase = createClient()

  React.useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .maybeSingle()

        if (error) throw error
        if (data) {
          setSettings({
            ...data,
            show_categories_in_navbar: data.social_youtube === "true",
          })
        }
      } catch (error: any) {
        console.error("Error fetching site settings:", error?.message || error?.name || JSON.stringify(error) || error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => React.useContext(SettingsContext)
