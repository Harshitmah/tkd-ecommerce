import * as React from "react"
import { ShieldCheck, Eye, Database, Lock, UserCheck } from "lucide-react"

export const metadata = {
  title: "Privacy Policy - Telkidukan",
  description: "Read about our client data security practices, payment gateway encryption, and how we protect your personal information at Telkidukan.",
}

export default function PrivacyPage() {
  const highlightCards = [
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Encrypted Transactions",
      desc: "All checkouts are processed via industry-standard SSL and PCI-DSS compliant secure payment networks."
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Data Confidentiality",
      desc: "We strictly enforce a zero third-party marketing sharing policy. Your personal information remains private."
    },
    {
      icon: <UserCheck className="h-6 w-6" />,
      title: "Full Account Autonomy",
      desc: "Complete authority to view, modify, or permanently erase your user profile and purchase records at any time."
    }
  ]

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-16 md:py-24 space-y-24 animate-in fade-in duration-1000">
      
      {/* Editorial Hero Header */}
      <header className="max-w-4xl text-left space-y-6">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">Data Security Desk</span>
        <h1 className="font-serif text-5xl font-extrabold tracking-tight text-black md:text-7xl leading-[1.1]">
          Privacy Policy
        </h1>
        <p className="text-lg md:text-xl leading-relaxed text-zinc-500 font-medium max-w-2xl">
          We respect and protect your personal space. Learn how we handle your information securely across our organic e-commerce storefront.
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
          <h2 className="font-serif text-3xl font-extrabold text-black uppercase tracking-tight">Legal Index</h2>
          <nav className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-zinc-400 pt-4">
            <a href="#gathering" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">01. Data Gathering</a>
            <a href="#utilisation" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">02. Data Utilisation</a>
            <a href="#security" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">03. Transaction Safety</a>
            <a href="#cookies" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">04. Browser Cookies</a>
            <a href="#rights" className="hover:text-black transition-colors border-l-2 border-transparent pl-4 hover:border-black">05. Client Data Rights</a>
          </nav>
        </div>

        {/* Detailed Content Column */}
        <div className="lg:col-span-8 space-y-16 text-base text-zinc-600 font-medium leading-relaxed">
          
          <div id="gathering" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">01</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Information Gathering</h3>
            <p>
              When you browse and interact with the Telkidukan storefront, we collect specific parameters necessary to deliver our premium service:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-sm text-zinc-500 font-semibold uppercase tracking-wide">
              <li>Profile Details: Your name, email, telephone number, and delivery address recorded during account sign-up.</li>
              <li>Purchase Records: Ordered organic oils, payment receipt metrics, and shipping log parameters.</li>
              <li>Device Interaction Parameters: IP addresses, basic browser attributes, and web log statistics collected via standard secure methods.</li>
            </ul>
          </div>

          <div id="utilisation" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">02</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">How We Utilize Your Data</h3>
            <p>
              Your data is strictly restricted to operations that support and enhance your client journey. Specifically, we utilize it to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-sm text-zinc-500 font-semibold uppercase tracking-wide">
              <li>Process transactions, authorize payments, and fulfill express courier delivery.</li>
              <li>Provide customer support, manage reviews, and handle package replacements.</li>
              <li>Dispatch automated order confirmations, shipping updates, and tracking parameters.</li>
              <li>Protect our server structure against malicious traffic, fraud, or spam.</li>
            </ul>
          </div>

          <div id="security" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">03</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Transaction Security Protocols</h3>
            <p>
              We implement top-tier encryption standards. All transaction data undergoes secure socket layer (SSL) encryption prior to transport. Payment processing is managed exclusively by verified external payment gateways that carry **PCI-DSS Level 1 compliance** (including Razorpay, Stripe, or standard bank networks).
            </p>
            <p className="mt-2 font-bold text-black">
              Telkidukan servers never record, store, or have visibility into your credit card numbers, CVVs, or online banking passwords.
            </p>
          </div>

          <div id="cookies" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">04</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Browser Cookies & Storage</h3>
            <p>
              We utilize cookies and lightweight browser local storage to enable core shopping mechanisms. These allow us to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-sm text-zinc-500 font-semibold uppercase tracking-wide">
              <li>Maintain your active cart items across page refreshes.</li>
              <li>Authorize secure sign-in sessions so you do not have to log in repeatedly.</li>
              <li>Understand overall traffic volume to continuously refine storefront speed.</li>
            </ul>
            <p className="mt-4">
              You can disable cookie tracking through your browser settings, though doing so will prevent the e-commerce cart from functioning correctly.
            </p>
          </div>

          <div id="rights" className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-black bg-zinc-50 border border-black/5 px-2.5 py-1 rounded-full">05</span>
            <h3 className="text-xl font-bold text-black uppercase tracking-wider pt-2">Your Data Rights & Deletion</h3>
            <p>
              You maintain full autonomy over your personal information. Under general international privacy standards, you have the absolute right to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-sm text-zinc-500 font-semibold uppercase tracking-wide">
              <li>Request a copy of the personal information stored in our secure database.</li>
              <li>Modify or correct inaccurate shipping addresses, telephone numbers, or profile names.</li>
              <li>Request the **permanent erasure** of your entire user profile and personal data from our databases (excluding transactional records that we are legally required to retain for tax auditing).</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please submit a request to our data protection desk at **privacy@telkidukan.com**. We will finalize your request within 48 hours.
            </p>
          </div>

        </div>
      </section>

      {/* Editorial Compliance Footer Callout */}
      <section className="text-center py-12 border-t border-black/5">
        <div className="max-w-2xl mx-auto space-y-6">
          <ShieldCheck className="h-6 w-6 mx-auto text-black" />
          <h3 className="font-serif text-3xl font-bold uppercase tracking-tight">Our Security Promise</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
            We will never sell your contact information to external advertisers. That is our absolute, organic guarantee.
          </p>
        </div>
      </section>

    </div>
  )
}
