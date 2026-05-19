import { createServerSupabaseClient } from "@/lib/supabase/server"
import CustomerList from "@/components/admin/CustomerList"

export default async function AdminCustomersPage() {
  const supabase = await createServerSupabaseClient()

  // Query database profiles along with their linked order records
  const { data: customers } = await supabase
    .from("profiles")
    .select(`
      *,
      orders(id)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black font-serif">Customer Directory</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your customer database, modify user profiles, and inspect shopping history.</p>
      </div>

      {/* Render the interactive Client Customer List & Admin Modals */}
      <CustomerList customers={customers || []} />
    </div>
  )
}
