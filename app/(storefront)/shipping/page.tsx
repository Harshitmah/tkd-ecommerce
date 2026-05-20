import * as React from "react"
import { Truck, ShieldCheck, RefreshCw, Mail, HelpCircle, PackageCheck } from "lucide-react"

export const metadata = {
  title: "Shipping & Returns - Telkidukan",
  description: "Read about our express dispatch timelines, complimentary packaging rules, safe amber glass cargo delivery, and 14-day hassle-free return and exchange policy.",
}

export default function ShippingPage() {
  const highlightCards = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Complimentary Shipping",
      desc: "Free express domestic shipping across India for all organic oil orders valued above ₹500."
    },
    {
      icon: <PackageCheck className="h-6 w-6" />,
      title: "Amber Glass Cushioning",
      desc: "Every glass bottle is cocooned in 100% biodegradable honeycomb paper wraps to guarantee crack-free transit."
    },
    {
      icon: <RefreshCw className="h-6 w-6" />,
      title: "14-Day Returns",
      desc: "Easy, stress-free return pickup for all unsealed, pristine original amber glass bottles."
    }
  ]

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-16 md:py-24 space-y-24 animate-in fade-in duration-1000">
      
      {/* Editorial Hero Header */}
      <header className="max-w-4xl text-left space-y-6">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">Logistics & Dispatches</span>
        <h1 className="font-serif text-5xl font-extrabold tracking-tight text-black md:text-7xl leading-[1.1]">
          Shipping & Returns
        </h1>
        <p className="text-lg md:text-xl leading-relaxed text-zinc-500 font-medium max-w-2xl">
          We treat every shipment with extreme care. Learn about our express transit partners, premium protective packaging, and returns policy.
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
          <h2 className="font-serif text-3xl font-extrabold text-black uppercase tracking-tight">Logistics Details</h2>
          <nav className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-zinc-400 pt-4">
            <a href="#processing" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">01. Order Dispatches</a>
            <a href="#domestic" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">02. Transit Times</a>
            <a href="#packaging" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">03. Protective Packing</a>
            <a href="#returns" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">04. Returns Window</a>
            <a href="#replacements" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">05. Damaged Claims</a>
          </nav>
        </div>

        {/* Detailed Content Column */}
        <div className="lg:col-span-8 space-y-16 text-base text-zinc-600 font-medium leading-relaxed">
          
          <div id="processing" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">01</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Order Processing & Dispatch</h3>
            <p>
              To maintain our promise of absolute freshness, our cold-pressed organic oils are stored in small temperature-regulated batches. All orders placed before **12:00 PM IST, Monday through Saturday**, are dispatched from our packing facility in Tamil Nadu on the very same business day. Orders placed after 12:00 PM or on National Holidays are dispatched on the immediate following business day.
            </p>
          </div>

          <div id="domestic" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">02</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Domestic Transit Times</h3>
            <p>
              We partner exclusively with tier-1 express cargo providers, primarily **Blue Dart, Delhivery, and DHL Express**, to ensure rapid, secure transport of your products:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-sm text-zinc-500 font-semibold uppercase tracking-wide">
              <li>Tier-1 Metros (Mumbai, Delhi-NCR, Bengaluru, Chennai, Hyderabad): 2 to 3 Business Days</li>
              <li>State Capitals & Tier-2 Hubs: 3 to 5 Business Days</li>
              <li>North-East, J&K, & Rural Sectors: 5 to 7 Business Days</li>
            </ul>
            <p className="mt-4">
              Upon handoff to the courier partner, an automated SMS, WhatsApp message, and email are triggered containing your active Order ID and real-time transit tracking link.
            </p>
          </div>

          <div id="packaging" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">03</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Protective Packing Standards</h3>
            <p>
              We completely reject the use of non-recyclable plastic bubble wraps and expanded polystyrene peanuts. Every bottle of Telkidukan organic oil is encased in multi-layered, shock-absorbing **biodegradable honeycomb paper cushioning**. The bottles are then placed inside heavy-duty recycled corrugated cardboard shippers, secured with water-activated starch paper tape to ensure absolute safety and minimal environmental footprint during logistics.
            </p>
          </div>

          <div id="returns" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">04</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">14-Day Returns & Exchanges Policy</h3>
            <p>
              We are dedicated to your organic wellness experience. We support a **14-day hassle-free return policy** for all products:
            </p>
            <p className="mt-2">
              To be eligible for a return or refund, the heavy amber glass bottles must be completely unopened, with the security shrink-seal fully intact, and in their original outer packing box. Because our botanical oils are clean and free of synthetic preservatives, we cannot accept returns, refunds, or exchanges for products that have been unsealed or partially used.
            </p>
          </div>

          <div id="replacements" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">05</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Transit Damage Claims</h3>
            <p>
              While our custom packaging ensures extremely low damage rates, glass remains delicate. If your order arrives chipped, cracked, or leaking due to transport handling:
            </p>
            <p className="mt-2 font-bold text-black">
              Do not worry. We will ship a complementary fresh replacement package immediately at zero cost.
            </p>
            <p className="mt-2">
              Simply email our dispatch desk (**support@telkidukan.com**) or text our WhatsApp client support line within **48 hours of delivery**, attaching a quick photo or video of the damaged glass bottle. Our dispatch team will inspect it and ship out your brand new package within 12 hours.
            </p>
          </div>

        </div>
      </section>

      {/* Concierge Desk Help Callout */}
      <section className="text-center py-12 border-t border-black/5">
        <div className="max-w-2xl mx-auto space-y-6">
          <HelpCircle className="h-6 w-6 mx-auto text-black" />
          <h3 className="font-serif text-3xl font-bold uppercase tracking-tight">Need Urgent Assistance?</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
            For specific shipping updates, custom logistics requests, or delayed delivery queries, please contact our dispatch office directly.
          </p>
          <div className="pt-4">
            <a 
              href="mailto:support@telkidukan.com" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest rounded-full active:scale-95 shadow-lg"
            >
              Email Logistics Desk
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
