"use client"

import * as React from "react"
import { useSettings } from "@/hooks/useSettings"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export function WhatsAppSupport() {
  const { settings } = useSettings()
  const pathname = usePathname()
  const [hovered, setHovered] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Clean the phone number (remove spaces, dashes, etc.)
  const rawPhone = settings?.contact_phone || "+91 9045024365"
  const phone = rawPhone.replace(/[+\s-]/g, "")

  const getWhatsAppUrl = () => {
    let message = "Hello Telkidukan Support! "
    if (typeof window !== "undefined") {
      const currentUrl = window.location.href
      if (pathname.includes("/products/")) {
        message += `I'm interested in this product: ${currentUrl}. I have a query: `
      } else {
        message += `I have a query while browsing the site (${currentUrl}): `
      }
    } else {
      message += "I have a query: "
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="fixed right-6 bottom-6 z-50 pointer-events-auto">
      <a
        href={getWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex flex-row-reverse items-center gap-3 group"
        aria-label="Contact WhatsApp Support"
      >
        {/* Main Floating Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-12 w-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(37,211,102,0.3)] hover:bg-[#20ba59] hover:shadow-[0_12px_32px_rgba(37,211,102,0.4)] transition-all duration-300 z-10"
        >
          {/* Custom WhatsApp SVG Icon */}
          <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.58 2.017 14.12 1.01 11.5 1.01c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.453 3.39 1.31 4.877L1.93 21.07l5.42-1.42.71-.486zM17.47 14.39c-.294-.148-1.745-.86-2.012-.96-.267-.098-.463-.148-.658.148-.196.297-.759.957-.93 1.15-.173.196-.347.218-.64.07-.294-.148-1.24-.457-2.36-1.457-.872-.778-1.46-1.74-1.63-2.037-.173-.294-.018-.454.13-.601.132-.132.294-.347.44-.52.146-.173.196-.297.294-.495.097-.198.05-.37-.024-.52-.074-.148-.658-1.587-.902-2.174-.236-.57-.478-.49-.658-.5-.164-.008-.352-.01-.54-.01-.19 0-.498.07-.759.352-.26.297-1.002.978-1.002 2.385 0 1.408 1.023 2.77 1.168 2.968.145.195 2.012 3.073 4.875 4.314.68.295 1.212.472 1.626.604.684.218 1.306.187 1.8.113.548-.08 1.745-.713 1.99-1.402.244-.69.244-1.28.172-1.402-.072-.12-.267-.197-.56-.347z" />
          </svg>
        </motion.div>

        {/* Hover-reveal Expandable Premium Tooltip Label */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-black/95 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-lg border border-white/10 whitespace-nowrap pr-5 -mr-3"
            >
              WhatsApp Support
            </motion.div>
          )}
        </AnimatePresence>
      </a>
    </div>
  )
}
