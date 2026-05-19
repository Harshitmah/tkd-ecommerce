import { Metadata } from "next"
import { createClient } from "@/lib/supabase/client"

export async function generateMetadata(
  title?: string,
  description?: string,
  image?: string,
  slug?: string
): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const defaultTitle = "AURA | Premium E-Commerce"
  const defaultDescription = "Defining modern elegance through curated design and exceptional quality."

  return {
    title: title ? `${title} | AURA` : defaultTitle,
    description: description || defaultDescription,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title: title || defaultTitle,
      description: description || defaultDescription,
      url: slug ? `${siteUrl}/products/${slug}` : siteUrl,
      siteName: "AURA",
      images: [
        {
          url: image || "/og-image.jpg",
          width: 1200,
          height: 630,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title || defaultTitle,
      description: description || defaultDescription,
      images: [image || "/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
