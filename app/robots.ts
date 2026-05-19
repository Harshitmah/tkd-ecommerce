import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/'],
      },
      sitemap: `${siteUrl}/sitemap.xml`,
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { data } = await supabase.from('seo_settings').select('robots_txt').single()
    
    if (data?.robots_txt) {
      // Parse robots_txt text into rules object
      const lines = data.robots_txt.split('\n')
      const rules: any = []
      let sitemap = `${siteUrl}/sitemap.xml`
      
      let currentAgent = '*'
      let allows: string[] = []
      let disallows: string[] = []
      
      for (const line of lines) {
        const clean = line.trim()
        if (!clean || clean.startsWith('#')) continue
        
        const firstCol = clean.indexOf(':')
        if (firstCol === -1) continue
        
        const key = clean.substring(0, firstCol).trim().toLowerCase()
        const val = clean.substring(firstCol + 1).trim()
        
        if (key === 'user-agent') {
          if (allows.length > 0 || disallows.length > 0) {
            rules.push({
              userAgent: currentAgent,
              allow: allows,
              disallow: disallows,
            })
            allows = []
            disallows = []
          }
          currentAgent = val
        } else if (key === 'allow') {
          allows.push(val)
        } else if (key === 'disallow') {
          disallows.push(val)
        } else if (key === 'sitemap') {
          sitemap = val
        }
      }
      
      // Push the last rule
      rules.push({
        userAgent: currentAgent,
        allow: allows,
        disallow: disallows,
      })
      
      return {
        rules: rules.length > 0 ? (rules.length === 1 ? rules[0] : rules) : { userAgent: '*', allow: '/' },
        sitemap,
      }
    }
  } catch (e) {
    console.error("Error in robots.ts:", e)
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}

