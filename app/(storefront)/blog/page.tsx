"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, Calendar, User, Clock, ArrowRight, Loader2 } from "lucide-react"

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

export default function StorefrontBlogsPage() {
  const supabase = createClient()
  const [blogs, setBlogs] = React.useState<Blog[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })

      if (error) {
        // Table does not exist or database offline -> use local fallback
        loadFallbackBlogs()
      } else {
        setBlogs(data || [])
      }
    } catch (err) {
      console.error("Storefront blogs fetch error:", err)
      loadFallbackBlogs()
    } finally {
      setLoading(false)
    }
  }

  const loadFallbackBlogs = () => {
    try {
      const localData = localStorage.getItem("aura_fallback_blogs")
      const localBlogs: Blog[] = localData ? JSON.parse(localData) : []
      const activeLocal = localBlogs.filter(b => b.is_published)
      setBlogs(activeLocal)
    } catch (e) {
      setBlogs([])
    }
  }

  React.useEffect(() => {
    fetchBlogs()
  }, [])

  // Calculate reading time roughly based on word count
  const getReadingTime = (text: string) => {
    const words = text.split(/\s+/).length
    const minutes = Math.ceil(words / 200) // Avg 200 words per min
    return `${minutes} min read`
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-16 md:py-24 space-y-20 animate-in fade-in duration-1000">
      
      {/* Editorial Header */}
      <header className="max-w-4xl text-left space-y-6">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">The Telkidukan Journal</span>
        <h1 className="font-serif text-5xl font-extrabold tracking-tight text-black md:text-7xl leading-[1.1]">
          Organic Wisdom & Wellness
        </h1>
        <p className="text-lg md:text-xl leading-relaxed text-zinc-500 font-medium max-w-2xl">
          Discover traditional Ayurvedic health recipes, expert single-origin extraction guides, and holistic living practices curated by our specialists.
        </p>
      </header>

      {/* Grid Content */}
      <section className="border-t border-black/5 pt-16">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Assembling Journal Articles...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-24 text-center">
            <BookOpen className="h-12 w-12 text-zinc-200 mx-auto mb-3" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No Articles Published Yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">
            {blogs.map((blog) => (
              <article 
                key={blog.id} 
                className="group border border-black/5 bg-zinc-50/20 rounded-[32px] overflow-hidden flex flex-col justify-between hover:bg-white hover:shadow-premium hover:border-transparent transition-all duration-500 cursor-pointer"
              >
                <Link href={`/blog/${blog.slug}`} className="flex flex-col h-full">
                  {/* Aspect Ratio Box */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 border-b border-black/5">
                    {blog.featured_image ? (
                      <img 
                        src={blog.featured_image} 
                        alt={blog.title} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-350">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-black/5 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-black">
                        {getReadingTime(blog.content)}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Meta Date & Author */}
                      <div className="flex items-center gap-4 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(blog.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          {blog.author.split(" ")[0]}
                        </span>
                      </div>

                      {/* Title & summary */}
                      <h3 className="font-serif text-2xl font-extrabold text-black leading-tight group-hover:text-accent transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-3">
                        {blog.summary}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-black/5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-black group-hover:text-accent transition-colors">
                      <span>Read Full Entry</span>
                      <ArrowRight className="h-4 w-4 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
