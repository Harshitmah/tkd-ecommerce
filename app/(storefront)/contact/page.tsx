"use client"

import * as React from "react"
import { Mail, Phone, MapPin, Clock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useSettings } from "@/hooks/useSettings"

export default function ContactPage() {
  const { settings } = useSettings()
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSent, setIsSent] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      alert("Please fill out all required fields.")
      return
    }

    setIsSubmitting(true)
    // Simulate API request
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSent(true)
    setFormData({ name: "", email: "", subject: "", message: "" })
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => setIsSent(false), 5000)
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-16 md:py-24 space-y-20 animate-in fade-in duration-1000">
      
      {/* Editorial Header */}
      <header className="max-w-4xl text-left space-y-6">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-zinc-400">Concierge Desk</span>
        <h1 className="font-serif text-5xl font-extrabold tracking-tight text-black md:text-7xl leading-[1.1]">
          How Can We Help You?
        </h1>
        <p className="text-lg md:text-xl leading-relaxed text-zinc-500 font-medium max-w-2xl">
          Whether you have a query about single-origin cold-pressing or wish to place a custom wholesale order, our concierge desk is here to assist.
        </p>
      </header>

      {/* Two-Column Main Content */}
      <section className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24 items-start border-t border-black/5 pt-16">
        
        {/* Left Column: Premium Contact Cards */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-zinc-400">Direct Channels</span>
            <h2 className="font-serif text-3xl font-extrabold text-black uppercase tracking-tight">Studio Contacts</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            
            {/* Email Card */}
            <div className="p-8 border border-black/5 bg-zinc-50/30 rounded-[28px] space-y-4 hover:bg-white hover:shadow-premium transition-all duration-500 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-black" />
                </div>
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  Response under 2h
                </span>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Client Email</p>
                <a 
                  href={`mailto:${settings?.contact_email || "support@telkidukan.com"}`} 
                  className="text-sm font-bold text-black hover:underline tracking-tight mt-1 block"
                >
                  {settings?.contact_email || "support@telkidukan.com"}
                </a>
              </div>
            </div>

            {/* Phone Card */}
            <div className="p-8 border border-black/5 bg-zinc-50/30 rounded-[28px] space-y-4 hover:bg-white hover:shadow-premium transition-all duration-500 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-black" />
                </div>
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-400">Concierge Line</span>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Direct Hotline</p>
                <a 
                  href={`tel:${settings?.contact_phone || "+91 9876543210"}`} 
                  className="text-sm font-bold text-black hover:underline tracking-tight mt-1 block"
                >
                  {settings?.contact_phone || "+91 9876543210"}
                </a>
              </div>
            </div>

            {/* Headquarters Card */}
            <div className="p-8 border border-black/5 bg-zinc-50/30 rounded-[28px] space-y-4 hover:bg-white hover:shadow-premium transition-all duration-500 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-black" />
                </div>
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-400">Extraction Plant</span>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Studio HQ Address</p>
                <span className="text-xs font-bold text-black tracking-tight mt-1 block leading-relaxed">
                  {settings?.business_address || "01, ABC Road, XYZ Street, OPQ City, India"}
                </span>
              </div>
            </div>

            {/* Operational Hours Card */}
            <div className="p-8 border border-black/5 bg-zinc-50/30 rounded-[28px] space-y-4 hover:bg-white hover:shadow-premium transition-all duration-500 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-black" />
                </div>
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-400">Dispatch Desk</span>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Operating Hours</p>
                <span className="text-xs font-bold text-black tracking-tight mt-1 block">
                  Mon – Sat, 9:00 AM – 6:00 PM IST
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Premium Contact Form */}
        <div className="lg:col-span-7 bg-zinc-50/50 border border-zinc-100 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-extrabold text-black uppercase tracking-tight">Send a Dispatch</h3>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              Fill out the details below. Our organic client representatives will contact you immediately.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Your Full Name</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.G. Rohan Shah"
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Your Email</label>
                <Input 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rohan@example.com" 
                  type="email"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Subject of inquiry</label>
              <Input 
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="E.G. Custom Wholesale Coconut Oil Orders" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Message Detail</label>
              <textarea 
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full bg-transparent border-b border-zinc-200 py-3 text-sm outline-none focus:border-black transition-all resize-none placeholder:text-zinc-350 text-black font-semibold"
                placeholder="Write down the details of your inquiry..."
                required
              ></textarea>
            </div>

            {/* Success Sent State */}
            {isSent && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in duration-300">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Thank you! Your concierge request has been dispatched. We will reply shortly.</span>
              </div>
            )}

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-14 w-full rounded-2xl bg-black text-white hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Transmitting...
                  </>
                ) : (
                  <>
                    Send Message
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

      </section>

    </div>
  )
}
