"use client"

import * as React from "react"
import { Plus, Minus, Search, HelpCircle, Leaf, Truck, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"

type FAQItem = {
  q: string
  a: string
  category: "products" | "shipping" | "returns"
}

const FAQS: FAQItem[] = [
  {
    category: "products",
    q: "What makes cold-pressed sweet almond oil different from regular refined oil?",
    a: "Refined oils are extracted using high heat (above 200°C) and chemical solvents (like hexane), stripping them of raw vitamins, lipids, and active aromas. Telkidukan cold-presses sweet Kashmiri almonds strictly below 38°C (100°F) in wooden presses. This preserves the oil's 100% organic molecular integrity, native sweet aroma, and high Vitamin E concentration.",
  },
  {
    category: "products",
    q: "How should I store my organic cold-pressed oils?",
    a: "Because our oils are completely free of synthetic preservatives, chemical stabilizers, and mineral paraffins, they should be stored in a cool, dry place away from direct sunlight. Our heavy-weight pharmaceutical amber glass bottles are designed to filter out light degradation, keeping the oils potent and fresh for up to 12 months.",
  },
  {
    category: "products",
    q: "Can your oils be used for both skincare and cooking?",
    a: "Absolutely. Our sweet almond oil and virgin coconut oil are food-grade and certified 100% organic. Our cold-pressed sweet almond oil is lightweight, highly absorbent, and hypoallergenic, making it ideal for delicate skin and hair. Our virgin coconut oil is fantastic for dietary nutrition, oil pulling, and gourmet culinary use.",
  },
  {
    category: "shipping",
    q: "What are your shipping rates and carrier partners?",
    a: "We offer complementary domestic shipping across India for all orders above ₹500. Orders below ₹500 incur a standard flat shipping fee of ₹50. We partner exclusively with premium express logistics carriers including Blue Dart, Delhivery, and DHL Express to ensure rapid, secure transport of our glass bottle cargo.",
  },
  {
    category: "shipping",
    q: "How long does shipping and order processing take?",
    a: "All orders placed before 12:00 PM IST are processed and dispatched on the same business day from our clean bottling facility. Standard delivery typically takes 2-3 business days for tier-1 metropolitan cities and 5-7 business days for regional areas. You will receive an instant tracking link via email and WhatsApp upon package handoff.",
  },
  {
    category: "returns",
    q: "What is your return and refund window?",
    a: "We want you to be absolutely delighted with your purchase. We offer a hassle-free 14-day return policy for all unopened, sealed bottles in their original packaging. Due to strict botanical hygiene and quality controls, we cannot accept returns for bottles that have been unsealed or partially used.",
  },
  {
    category: "returns",
    q: "How do I request a refund or bottle replacement?",
    a: "Simply contact our Client Concierge desk via email (support@telkidukan.com) or WhatsApp within 14 days of delivery. Please include your Order ID and photo evidence of the sealed product. Once approved, we will arrange a complementary courier pickup and initiate an instant refund to your original payment method upon inspection.",
  }
]

export default function FAQPage() {
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<"all" | "products" | "shipping" | "returns">("all")
  const [openIdx, setOpenIdx] = React.useState<number | null>(null)

  const handleToggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx)
  }

  // Filter FAQs based on active tab and search input
  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory
    const matchesSearch = faq.q.toLowerCase().includes(search.toLowerCase()) || 
                          faq.a.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-16 md:py-24 space-y-16 animate-in fade-in duration-1000">
      
      {/* Editorial Hero Header */}
      <header className="max-w-4xl text-left space-y-6">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">Knowledge Base</span>
        <h1 className="font-serif text-5xl font-extrabold tracking-tight text-black md:text-7xl leading-[1.1]">
          Frequently Asked Questions
        </h1>
        <p className="text-lg md:text-xl leading-relaxed text-zinc-500 font-medium max-w-2xl">
          Everything you need to know about our organic cold-pressing mechanics, bottle preservation, and concierge logistics services.
        </p>
      </header>

      {/* Toolbar & Search Block */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 border-t border-black/5 pt-12 items-center">
        
        {/* Category Tabs (Left 8 cols) */}
        <div className="md:col-span-8 flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Topics", icon: <HelpCircle className="h-3.5 w-3.5" /> },
            { id: "products", label: "Purity & Care", icon: <Leaf className="h-3.5 w-3.5" /> },
            { id: "shipping", label: "Logistics Desk", icon: <Truck className="h-3.5 w-3.5" /> },
            { id: "returns", label: "Returns Policy", icon: <ArrowLeftRight className="h-3.5 w-3.5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id as any)
                setOpenIdx(null) // Reset accordions
              }}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer",
                activeCategory === tab.id
                  ? "bg-black border-black text-white shadow-lg scale-95"
                  : "bg-zinc-50 border-black/5 text-zinc-500 hover:text-black hover:border-black/20"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field (Right 4 cols) */}
        <div className="md:col-span-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOpenIdx(null)
            }}
            className="w-full bg-zinc-50 border border-black/5 rounded-full py-3.5 pl-12 pr-6 text-xs outline-none focus:bg-white focus:border-black transition-all placeholder:text-zinc-400 text-black font-semibold"
          />
        </div>

      </div>

      {/* Accordion List Block */}
      <div className="max-w-4xl border-y border-black/5 divide-y divide-black/5">
        {filteredFaqs.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">No answers found</span>
            <p className="text-xs text-zinc-500 font-semibold max-w-xs mx-auto leading-relaxed">
              We couldn't find any FAQs matching your query "{search}". Try searching for terms like "almond", "coconut", or "shipping".
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div 
                key={idx} 
                className={cn(
                  "py-6 transition-all duration-500",
                  isOpen ? "bg-zinc-50/30 px-6 rounded-2xl border border-black/5 my-4 first:mt-0 last:mb-0" : ""
                )}
              >
                <button
                  onClick={() => handleToggle(idx)}
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                >
                  <span className="text-base font-bold text-black uppercase tracking-wide group-hover:text-zinc-600 transition-colors pr-6">
                    {faq.q}
                  </span>
                  <div className="h-8 w-8 rounded-full border border-black/5 flex items-center justify-center shrink-0 bg-white group-hover:border-black/20 transition-all">
                    {isOpen ? (
                      <Minus className="h-4 w-4 text-black transition-transform duration-300 rotate-180" />
                    ) : (
                      <Plus className="h-4 w-4 text-black transition-transform duration-300" />
                    )}
                  </div>
                </button>
                
                {/* Accordion Panel Content */}
                <div
                  className={cn(
                    "grid transition-all duration-500 ease-in-out overflow-hidden text-xs font-semibold text-zinc-500 leading-relaxed",
                    isOpen ? "grid-rows-[1fr] opacity-100 mt-5 pt-5 border-t border-black/5" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden min-h-[0px] whitespace-pre-line">
                    {faq.a}
                  </div>
                </div>

              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
