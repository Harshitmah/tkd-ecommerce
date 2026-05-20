import { Header } from "@/components/storefront/Header"
import { Footer } from "@/components/storefront/Footer"
import { CartDrawer } from "@/components/storefront/CartDrawer"
import { WhatsAppSupport } from "@/components/storefront/WhatsAppSupport"
import { VisitTracker } from "@/components/storefront/VisitTracker"

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <VisitTracker />
      <Header />
      <main className="flex-1 pt-28 md:pt-32">{children}</main>
      <CartDrawer />
      <WhatsAppSupport />
      <Footer />
    </>
  )
}
