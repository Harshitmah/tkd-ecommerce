"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Calendar, User, Clock, ArrowLeft, Loader2, Share2, BookOpen } from "lucide-react"

type Blog = {
  id: string
  title: string
  slug: string
  content: string
  summary: string | null
  featured_image: string | null
  author: string
  is_published: boolean
  created_at: string
}

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function StorefrontBlogDetailPage({ params }: PageProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // Safe param resolver for Next.js 13, 14, 15, and 16
  const unwrappedParams = React.use ? React.use(params as Promise<{ slug: string }>) : (params as { slug: string })
  const slug = unwrappedParams.slug

  const [blog, setBlog] = React.useState<Blog | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [shareCopied, setShareCopied] = React.useState(false)

  const fetchArticle = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .single()

      if (error || !data) {
        loadFallbackArticle()
      } else {
        setBlog(data)
      }
    } catch (err) {
      console.error("Error retrieving article details:", err)
      loadFallbackArticle()
    } finally {
      setLoading(false)
    }
  }

  const loadFallbackArticle = () => {
    // Check local storage
    try {
      const localData = localStorage.getItem("aura_fallback_blogs")
      const localBlogs: Blog[] = localData ? JSON.parse(localData) : []
      const matched = localBlogs.find(b => b.slug === slug)
      
      if (matched) {
        setBlog(matched)
        return
      }
    } catch (e) {
      console.error("Local storage lookup failed", e)
    }

    setBlog(null)
  }

  React.useEffect(() => {
    fetchArticle()
  }, [slug])

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  const getReadingTime = (text: string) => {
    const words = text.split(/\s+/).length
    const minutes = Math.ceil(words / 200)
    return `${minutes} min read`
  }

  // Helper to format content paragraphs and subheaders cleanly
  const renderFormattedContent = (contentString: string) => {
    const blocks = contentString.split("\n\n")
    return blocks.map((block, index) => {
      if (block.startsWith("###")) {
        return (
          <h3 key={index} className="font-serif text-2xl font-extrabold text-black mt-8 mb-4 tracking-tight">
            {block.replace("###", "").trim()}
          </h3>
        )
      }
      if (block.startsWith("*")) {
        const items = block.split("\n")
        return (
          <ul key={index} className="list-disc list-inside my-6 pl-4 space-y-2 text-zinc-600 font-medium">
            {items.map((item, itemIdx) => {
              const cleanItem = item.replace(/^\*\s*/, "")
              if (cleanItem.includes(":")) {
                const parts = cleanItem.split(":")
                return (
                  <li key={itemIdx}>
                    <strong className="text-black">{parts[0]}:</strong>{parts.slice(1).join(":")}
                  </li>
                )
              }
              return <li key={itemIdx}>{cleanItem}</li>
            })}
          </ul>
        )
      }
      return (
        <p key={index} className="text-zinc-600 leading-relaxed font-medium mb-6 text-base md:text-lg">
          {block}
        </p>
      )
    })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Opening Journal Volume...</p>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="mx-auto max-w-xl text-center py-32 space-y-6">
        <BookOpen className="h-16 w-16 text-zinc-200 mx-auto" />
        <h2 className="font-serif text-3xl font-extrabold text-black">Article Volume Not Found</h2>
        <p className="text-sm text-zinc-500 font-medium">
          The requested article may have been retracted or moved to another path.
        </p>
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Journal
        </Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-20 space-y-12 animate-in fade-in duration-700">
      
      {/* Back to Blog catalog link */}
      <Link 
        href="/blog" 
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Telkidukan Journal
      </Link>

      {/* Hero Header Block */}
      <header className="max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-extrabold uppercase tracking-widest text-zinc-450">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(blog.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {blog.author}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 bg-zinc-50 border border-zinc-150 rounded-full px-3 py-1 text-black font-extrabold">
            <Clock className="h-3 w-3" />
            {getReadingTime(blog.content)}
          </span>
        </div>

        <h1 className="font-serif text-4xl font-extrabold tracking-tight text-black md:text-6xl leading-[1.1] max-w-3xl">
          {blog.title}
        </h1>

        <p className="text-lg md:text-xl leading-relaxed text-zinc-500 font-medium max-w-2xl italic">
          {blog.summary}
        </p>
      </header>

      {/* Featured Cover Photo */}
      {blog.featured_image && (
        <div className="relative aspect-[21/9] w-full rounded-[40px] overflow-hidden border border-black/5 bg-zinc-100 shadow-premium">
          <img src={blog.featured_image} alt={blog.title} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Main Body Columns */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20 items-start pt-6 border-t border-black/5">
        
        {/* Left Side: Dynamic Actions */}
        <aside className="lg:col-span-3 space-y-8 lg:sticky lg:top-28">
          <div className="p-6 border border-black/5 bg-zinc-50/20 rounded-[28px] space-y-6">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Written By</p>
              <p className="text-sm font-bold text-black mt-1.5">{blog.author}</p>
            </div>
            
            <div className="h-px bg-black/5" />

            <div className="space-y-3">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Share Wisdom</p>
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-zinc-200 hover:border-black text-xs font-bold uppercase tracking-wider text-black transition-all hover:scale-[1.02] cursor-pointer"
              >
                {shareCopied ? (
                  "Link Copied!"
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Copy Article Link
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Right Side: Article Body Text */}
        <section className="lg:col-span-9 max-w-3xl prose prose-zinc prose-lg">
          {renderFormattedContent(blog.content)}
        </section>

      </div>

    </article>
  )
}
