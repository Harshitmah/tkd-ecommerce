import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  MapPin, 
  User,
  ExternalLink
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      profiles(full_name, email),
      order_items(
        *,
        products(title, images:product_images(image_url))
      )
    `)
    .eq("id", id)
    .single()

  if (!order) return notFound()

  const timeline = [
    { status: "Ordered", date: order.created_at, icon: Clock, completed: true },
    { status: "Processing", date: order.created_at, icon: Package, completed: order.status !== "pending" },
    { status: "Shipped", date: null, icon: Truck, completed: order.status === "shipped" || order.status === "completed" },
    { status: "Delivered", date: null, icon: CheckCircle2, completed: order.status === "completed" },
  ]

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/orders" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="mt-2 text-zinc-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">Print Invoice</Button>
          <Button variant="primary">Mark as Shipped</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left: Order Items & Timeline */}
        <div className="lg:col-span-8 space-y-10">
          {/* Timeline */}
          <div className="rounded-[40px] border border-white/5 bg-white/5 p-10">
            <h3 className="text-xl font-bold mb-10">Order Timeline</h3>
            <div className="relative flex justify-between">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/5 z-0" />
              {timeline.map((item, idx) => (
                <div key={item.status} className="relative z-10 flex flex-col items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    item.completed ? "bg-accent border-accent text-white shadow-[0_0_20px_rgba(var(--accent),0.3)]" : "bg-[#0A0A0A] border-white/10 text-zinc-600"
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className={cn("text-sm font-bold", item.completed ? "text-white" : "text-zinc-600")}>{item.status}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{item.date ? new Date(item.date).toLocaleDateString() : 'Pending'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-[40px] border border-white/5 bg-white/5 p-10">
            <h3 className="text-xl font-bold mb-8">Items Summary</h3>
            <div className="space-y-6">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between pb-6 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                      {item.products?.images?.[0] && (
                        <img src={item.products.images[0].image_url} alt={item.products.title} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{item.products?.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-10 border-t border-white/5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-medium text-white">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Shipping</span>
                <span className="font-medium text-success">Free</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-4 border-t border-white/5">
                <span>Total</span>
                <span className="text-accent">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Customer & Shipping Details */}
        <div className="lg:col-span-4 space-y-10">
          <div className="rounded-[40px] border border-white/5 bg-white/5 p-10 space-y-8">
            <h3 className="text-xl font-bold">Customer Details</h3>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold">{order.profiles?.full_name}</p>
                <p className="text-xs text-zinc-500">{order.profiles?.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">View Customer Profile</Button>
          </div>

          <div className="rounded-[40px] border border-white/5 bg-white/5 p-10 space-y-8">
            <h3 className="text-xl font-bold">Shipping Address</h3>
            <div className="flex gap-4">
              <MapPin className="h-5 w-5 text-accent mt-1" />
              <p className="text-sm text-zinc-400 leading-relaxed">
                123 Design Street, Suite 400<br />
                San Francisco, CA 94103<br />
                United States
              </p>
            </div>
          </div>

          <div className="rounded-[40px] border border-white/5 bg-white/5 p-10 space-y-8">
            <h3 className="text-xl font-bold">Payment Method</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CreditCard className="h-5 w-5 text-zinc-500" />
                <span className="text-sm font-medium">Razorpay</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-success bg-success/10 px-2 py-1 rounded-full">Paid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
