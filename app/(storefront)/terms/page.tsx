import * as React from "react"
import { Scale, ShieldAlert, FileText, CheckCircle, HelpCircle } from "lucide-react"

export const metadata = {
  title: "Terms of Service - Telkidukan",
  description: "Read our official terms and conditions governing the use of the Telkidukan organic oil e-commerce store.",
}

export default function TermsPage() {
  const highlightCards = [
    {
      icon: <Scale className="h-6 w-6" />,
      title: "Legally Binding",
      desc: "By accessing or placing orders on Telkidukan, you accept and agree to comply with our commercial terms."
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Authentic Fulfillment",
      desc: "We pledge and guarantee that all oils dispatched represent absolute organic purity as listed."
    },
    {
      icon: <ShieldAlert className="h-6 w-6" />,
      title: "Fair Use Integrity",
      desc: "Our products, logos, and custom extraction photography are protected under intellectual property rights."
    }
  ]

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-16 md:py-24 space-y-24 animate-in fade-in duration-1000">
      
      {/* Editorial Hero Header */}
      <header className="max-w-4xl text-left space-y-6">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">Legal Agreement</span>
        <h1 className="font-serif text-5xl font-extrabold tracking-tight text-black md:text-7xl leading-[1.1]">
          Terms of Service
        </h1>
        <p className="text-lg md:text-xl leading-relaxed text-zinc-500 font-medium max-w-2xl">
          Please read these terms and conditions carefully. These govern your purchase of organic products and use of our e-commerce platform.
        </p>
      </header>

      {/* Visual Policy Highlights Row */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-3 border-t border-black/5 pt-16">
        {highlightCards.map((card, idx) => (
          <div 
            key={idx} 
            className="flex flex-col justify-between p-8 border border-black/5 bg-zinc-50/30 rounded-[28px] hover:bg-white hover:shadow-premium transition-all duration-500 min-h-[240px] group"
          >
            <div className="h-12 w-12 rounded-2xl bg-zinc-100 text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
              {card.icon}
            </div>
            <div className="space-y-3 mt-6">
              <h3 className="text-base font-bold text-black uppercase tracking-wider">{card.title}</h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">{card.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Detailed Editorial Guidelines */}
      <section className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-24 border-t border-black/5 pt-16">
        
        {/* Sticky Index Column */}
        <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">Policy Sections</span>
          <h2 className="font-serif text-3xl font-extrabold text-black uppercase tracking-tight">Terms Index</h2>
          <nav className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-zinc-400 pt-4">
            <a href="#scope" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">01. Terms Scope</a>
            <a href="#authenticity" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">02. Product Purity</a>
            <a href="#checkout" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">03. Checkout Rules</a>
            <a href="#dispatch" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">04. Deliveries</a>
            <a href="#ip" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">05. Intellectual Property</a>
            <a href="#laws" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">06. Governing Law</a>
          </nav>
        </div>

        {/* Detailed Content Column */}
        <div className="lg:col-span-8 space-y-16 text-base text-zinc-600 font-medium leading-relaxed">
          
          <div id="scope" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">01</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Scope of Agreement</h3>
            <p>
              By accessing, browsing, or purchasing from `telkidukan.com`, you signify your agreement to these Terms of Service. If you do not agree with any clause within this document, you must discontinue your use of our platform immediately. We reserve the right to amend, update, or modify these terms at any time without prior announcement.
            </p>
          </div>

          <div id="authenticity" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">02</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Product Representation & Purity</h3>
            <p>
              We prioritize laboratory-grade honesty. All products listed are described with maximum accuracy. We guarantee that our sweet almond oil and virgin coconut oil are 100% cold-pressed, organic, and completely unrefined. However, since botanical extractions are organic and subject to natural variations, minor differences in native aroma, viscosity, or color gradient may occur between batches.
            </p>
          </div>

          <div id="checkout" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">03</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Transactions & Checkout Authenticity</h3>
            <p>
              By finalizing a purchase on Telkidukan, you verify that all details provided (billing, credit card details, shipping address, telephone contact) are correct and legally yours. We utilize highly protected external, PCI-DSS compliant processing platforms. We reserve the right to cancel or place an administrative hold on any order if fraud, security discrepancies, or payment failure is detected.
            </p>
          </div>

          <div id="dispatch" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">04</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Delivery & Handoff Conditions</h3>
            <p>
              Orders are packaged and handed over to premier courier partners (Blue Dart, Delhivery, DHL Express). Once the shipment transitions to the courier, logistics liability shifts in accordance with standard carrier clauses. In cases of transit delays, severe weather disruptions, or courier delays, our concierge desk will actively coordinate with the logistics partners to expedite resolution.
            </p>
          </div>

          <div id="ip" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">05</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Intellectual Property Integrity</h3>
            <p>
              All visual layouts, brand assets, logos, organic product copy, website designs, code blocks, custom graphics, and generative photos found on `telkidukan.com` are the intellectual property of Telkidukan Group. Any replication, harvesting, copying, or public reproduction of these assets without written studio approval is strictly prohibited.
            </p>
          </div>

          <div id="laws" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">06</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Governing Law & Disputes</h3>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of India. Any conflicts, disputes, or legal proceedings relating directly or indirectly to the Telkidukan storefront will be submitted to the exclusive jurisdiction of the state courts of India.
            </p>
          </div>

        </div>
      </section>

      {/* Help Callout */}
      <section className="text-center py-12 border-t border-black/5">
        <div className="max-w-2xl mx-auto space-y-6">
          <HelpCircle className="h-6 w-6 mx-auto text-black" />
          <h3 className="font-serif text-3xl font-bold uppercase tracking-tight">Legal Queries?</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
            If you have any questions regarding our terms, copyright licenses, or wholesale agreements, please contact our legal desk directly.
          </p>
          <div className="pt-4">
            <a 
              href="mailto:legal@telkidukan.com" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest rounded-full active:scale-95 shadow-lg"
            >
              Email Legal Desk
              <FileText className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
