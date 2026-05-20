import * as React from "react"
import { ShieldCheck, Droplet, Leaf, Heart, ArrowRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Our Story - Telkidukan",
  description: "Learn about the heritage of Telkidukan, our traditional cold-pressing extraction methods, and our commitment to pure organic cold-pressed wellness oils.",
}

export default function AboutPage() {
  const pillars = [
    {
      icon: <Leaf className="h-6 w-6" />,
      title: "Botanical Sourcing",
      desc: "We partner exclusively with certified organic orchards in Kashimr and coastal Tamil Nadu to source premium, single-origin almonds and coconuts."
    },
    {
      icon: <Droplet className="h-6 w-6" />,
      title: "Cold Press Extraction",
      desc: "Our extraction operates strictly below 38°C (100°F). Zero heat, zero solvents, and zero chemicals. The raw essence and molecular integrity remain fully intact."
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Amber Glass Preservation",
      desc: "Every drop is carefully double-filtered and bottled in pharmaceutical-grade amber glass to block UV degradation, preserving freshness and nutritional potency."
    }
  ]

  const steps = [
    {
      num: "01",
      title: "Meticulous Selection",
      desc: "Only fully matured, sun-dried organic seeds and nuts pass our stringent moisture and density metrics."
    },
    {
      num: "02",
      title: "Small-Batch Pressing",
      desc: "Traditional wood-press (ghani) mechanics gently crush the ingredients without friction-induced heat."
    },
    {
      num: "03",
      title: "Natural Sedimentation",
      desc: "Instead of aggressive refining, we allow natural gravity sedimentation over 48 hours for clean, pure oils."
    },
    {
      num: "04",
      title: "Amber Bottling",
      desc: "Sealed under nitrogen flush in amber glass bottles to prevent oxidation and ensure 100% molecular purity."
    }
  ]

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-16 md:py-24 space-y-24 animate-in fade-in duration-1000">
      
      {/* Editorial Hero Header */}
      <header className="max-w-4xl text-left space-y-6">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">Our Heritage</span>
        <h1 className="font-serif text-5xl font-extrabold tracking-tight text-black md:text-7xl leading-[1.1]">
          Crafted for Purity,<br />
          Rooted in Tradition.
        </h1>
        <p className="text-lg md:text-xl leading-relaxed text-zinc-500 font-medium max-w-2xl">
          At Telkidukan, we believe wellness begins with pristine simplicity. We extract premium, single-origin cold-pressed oils without compromising on nutritional richness.
        </p>
      </header>

      {/* Brand Narrative Section (Two Columns) */}
      <section className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-24 items-start border-t border-black/5 pt-16">
        <div className="lg:col-span-5 space-y-4">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">The Genesis</span>
          <h2 className="font-serif text-3xl font-extrabold text-black md:text-4xl uppercase tracking-tight">
            Redefining the Essence of Wellness Oils
          </h2>
        </div>
        <div className="lg:col-span-7 space-y-8 text-base text-zinc-600 font-medium leading-relaxed">
          <p>
            Founded in 2026, Telkidukan emerged out of a frustration with commercial, mass-refined oils. High-heat refining, chemical bleaching, and synthetic deodorizing strip botanical oils of their natural antioxidants, essential vitamins, and native therapeutic aromas.
          </p>
          <p>
            We resolved to do things differently. By returning to ancestral wooden ghani press mechanics and merging them with modern hygiene and quality control standards, we created a production pipeline that honors nature. Every bottle of Telkidukan oil is a celebration of unrefined, cold-pressed integrity.
          </p>
          <p>
            Whether it is our sweet almond oil sourced from high-altitude Kashmiri groves or our rich virgin coconut oil from the shorelines of Tamil Nadu, we promise absolute, laboratory-certified botanical purity.
          </p>
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-3 border-t border-black/5 pt-16">
        {pillars.map((p, i) => (
          <div 
            key={i} 
            className="flex flex-col justify-between p-8 border border-black/5 bg-zinc-50/30 rounded-[28px] hover:bg-white hover:shadow-premium transition-all duration-500 min-h-[260px] group"
          >
            <div className="h-12 w-12 rounded-2xl bg-zinc-100 text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
              {p.icon}
            </div>
            <div className="space-y-3 mt-6">
              <h3 className="text-base font-bold text-black uppercase tracking-wider">{p.title}</h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* The Extraction Process Flow */}
      <section className="bg-zinc-50 rounded-[40px] p-8 md:p-16 space-y-16 border border-black/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">Our Alchemy</span>
            <h2 className="font-serif text-3xl font-extrabold text-black md:text-4xl uppercase tracking-tight">The Cold-Press Journey</h2>
          </div>
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">100% Solvent-Free • Laboratory Tested</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[220px]"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Step {s.num}</span>
                <span className="text-2xl font-extrabold text-black/10 font-mono">{s.num}</span>
              </div>
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-bold text-black uppercase tracking-wider">{s.title}</h4>
                <p className="text-[11px] leading-relaxed text-zinc-500 font-medium">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Editorial Callout */}
      <section className="text-center py-8 border-t border-black/5">
        <div className="max-w-2xl mx-auto space-y-6">
          <Heart className="h-6 w-6 mx-auto text-black animate-pulse" />
          <h3 className="font-serif text-3xl font-bold uppercase tracking-tight">Join the Mindful Movement</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
            Experience organic botanical luxury in its truest form. Free from paraffins, synthetics, and artificial preservatives.
          </p>
          <div className="pt-4">
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest rounded-full active:scale-95 shadow-lg"
            >
              Discover the Collection
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
