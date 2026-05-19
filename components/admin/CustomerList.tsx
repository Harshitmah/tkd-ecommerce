"use client"

import * as React from "react"
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Calendar,
  ShoppingBag,
  User as UserIcon,
  Phone,
  MapPin,
  ShieldAlert,
  Loader2,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { updateCustomerProfile, deleteCustomer } from "@/app/actions/customers"
import { Button } from "@/components/ui/Button"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface CustomerListProps {
  customers: any[]
}

export default function CustomerList({ customers: initialCustomers }: CustomerListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""

  const [customers, setCustomers] = React.useState(initialCustomers)
  const [search, setSearch] = React.useState(q)
  const [selectedRole, setSelectedRole] = React.useState("all")

  React.useEffect(() => {
    setSearch(q)
  }, [q])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set("q", val)
    } else {
      params.delete("q")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  
  // Interactive UI States
  const [activeDropdownId, setActiveDropdownId] = React.useState<string | null>(null)
  const [editingCustomer, setEditingCustomer] = React.useState<any | null>(null)
  const [deletingCustomerId, setDeletingCustomerId] = React.useState<string | null>(null)
  
  // Loading & feedback states
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [feedbackMsg, setFeedbackMsg] = React.useState<{ type: "success" | "error", text: string } | null>(null)

  // Sync initialCustomers if server component revalidates
  React.useEffect(() => {
    setCustomers(initialCustomers)
  }, [initialCustomers])

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null)
    window.addEventListener("click", handleOutsideClick)
    return () => window.removeEventListener("click", handleOutsideClick)
  }, [])

  // Auto-clear feedback messages after 3 seconds
  React.useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [feedbackMsg])

  // Filter logic
  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      const searchLower = search.toLowerCase()
      const nameMatches = (customer.full_name || "").toLowerCase().includes(searchLower)
      const emailMatches = (customer.email || "").toLowerCase().includes(searchLower)
      const phoneMatches = (customer.phone || "").toLowerCase().includes(searchLower)
      const matchesSearch = nameMatches || emailMatches || phoneMatches

      const matchesRole = selectedRole === "all" || customer.role === selectedRole

      return matchesSearch && matchesRole
    })
  }, [customers, search, selectedRole])

  // Copy User ID utility
  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    setFeedbackMsg({ type: "success", text: "Customer ID copied to clipboard!" })
    setActiveDropdownId(null)
  }

  // Save modified profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return
    setIsSaving(true)
    
    const result = await updateCustomerProfile(editingCustomer.id, {
      fullName: editingCustomer.full_name || "",
      email: editingCustomer.email || "",
      phone: editingCustomer.phone || "",
      city: editingCustomer.city || "",
      role: editingCustomer.role || "customer"
    })

    setIsSaving(false)
    if (result.success) {
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...editingCustomer } : c))
      setEditingCustomer(null)
      setFeedbackMsg({ type: "success", text: "Customer profile updated successfully!" })
    } else {
      setFeedbackMsg({ type: "error", text: result.error || "Failed to update profile." })
    }
  }

  // Trigger Deletion
  const handleDeleteConfirm = async () => {
    if (!deletingCustomerId) return
    setIsDeleting(true)

    const result = await deleteCustomer(deletingCustomerId)
    setIsDeleting(false)
    if (result.success) {
      setCustomers(prev => prev.filter(c => c.id !== deletingCustomerId))
      setDeletingCustomerId(null)
      setFeedbackMsg({ type: "success", text: "Customer account deleted successfully." })
    } else {
      setFeedbackMsg({ type: "error", text: result.error || "Failed to delete customer." })
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* Dynamic Feedback Toast */}
      {feedbackMsg && (
        <div className={cn(
          "fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-6 duration-300",
          feedbackMsg.type === "success" 
            ? "bg-black border-zinc-800 text-white" 
            : "bg-red-50 border-red-100 text-red-700"
        )}>
          {feedbackMsg.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <ShieldAlert className="h-5 w-5 text-red-500" />}
          <span className="text-xs font-bold uppercase tracking-widest">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: "Total Customers", value: customers.length, icon: Users, color: "text-black", bg: "bg-gray-50" },
          { label: "Active This Month", value: customers.filter(c => c.orders?.length > 0).length || "1", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50/50" },
          { label: "Top Spenders", value: customers.filter(c => c.orders?.length > 2).length || "0", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-50/50" },
        ].map((stat) => (
          <div key={stat.label} className="p-8 rounded-[32px] border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-gray-100", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label.split(' ')[0]}</span>
            </div>
            <p className="text-3xl font-serif font-bold text-black">{stat.value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar & Live Filters */}
      <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Live Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search customers by name, email or phone..." 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-white focus:border-gray-200 transition-all text-black font-semibold placeholder:text-gray-400"
            />
          </div>

          {/* Role Filter Selector */}
          <div className="flex items-center gap-2 border border-gray-100 rounded-xl px-4 py-2 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-black outline-none cursor-pointer pr-2"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Refactored Premium Customer Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredCustomers.map((customer) => (
          <div 
            key={customer.id} 
            className="group p-8 rounded-[40px] border border-gray-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:border-gray-300 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              {/* Profile Details Area */}
              <div className="flex items-start gap-6">
                <div className="h-20 w-20 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center text-black group-hover:scale-105 transition-transform flex-shrink-0">
                  <UserIcon className="h-9 w-9 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-black">{customer.full_name || customer.email.split('@')[0]}</h3>
                    {customer.role === "admin" && (
                      <span className="inline-flex items-center rounded-lg bg-black text-white px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="text-xs font-medium truncate max-w-[200px]">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="text-xs font-medium">{customer.phone}</span>
                    </div>
                  )}
                  {customer.city && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="text-xs font-medium">{customer.city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Three-dots Action Button Container */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveDropdownId(activeDropdownId === customer.id ? null : customer.id)
                  }}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {/* Dropdown Options Box */}
                {activeDropdownId === customer.id && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 z-10 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 text-left animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button 
                      onClick={() => {
                        setEditingCustomer(customer)
                        setActiveDropdownId(null)
                      }}
                      className="w-full px-4 py-3 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Edit3 className="h-4 w-4 text-gray-400" />
                      Edit Details
                    </button>
                    <button 
                      onClick={(e) => handleCopyId(e, customer.id)}
                      className="w-full px-4 py-3 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Copy className="h-4 w-4 text-gray-400" />
                      Copy User ID
                    </button>
                    <div className="h-px bg-gray-50 my-1" />
                    <button 
                      onClick={() => {
                        setDeletingCustomerId(customer.id)
                        setActiveDropdownId(null)
                      }}
                      className="w-full px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                      Delete Customer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Orders summary & Join Date */}
            <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200/50 text-[9px] font-extrabold uppercase tracking-widest text-gray-600">
                <ShoppingBag className="h-3 w-3 text-gray-400" /> {customer.orders?.length || 0} Orders
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-300" /> Joined {new Date(customer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-[40px] border border-gray-200 border-dashed">
          <Users className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No matching customers found.</p>
        </div>
      )}

      {/* floating Edit Profile overlay Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 border border-gray-100 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setEditingCustomer(null)}
              className="absolute top-6 right-6 p-1 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-serif font-bold text-black">Edit Customer Profile</h2>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Modifies their storefront account info.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={editingCustomer.full_name || ""}
                  onChange={e => setEditingCustomer({...editingCustomer, full_name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-black transition-all text-black font-semibold"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={editingCustomer.email || ""}
                  onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-black transition-all text-black font-semibold"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                <input 
                  type="text" 
                  value={editingCustomer.phone || ""}
                  onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-black transition-all text-black font-semibold"
                  placeholder="Not provided"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 ml-1">City / Region</label>
                <input 
                  type="text" 
                  value={editingCustomer.city || ""}
                  onChange={e => setEditingCustomer({...editingCustomer, city: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-black transition-all text-black font-semibold"
                  placeholder="Worldwide"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 ml-1">Account Role</label>
                <select 
                  value={editingCustomer.role || "customer"}
                  onChange={e => setEditingCustomer({...editingCustomer, role: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-black transition-all text-black font-bold cursor-pointer"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setEditingCustomer(null)}
                  className="rounded-xl h-12 text-[10px] font-bold uppercase tracking-widest"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="rounded-xl h-12 px-8 bg-black text-white hover:bg-zinc-900 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Confirm Delete Overlay Modal */}
      {deletingCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 p-8 border border-gray-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-serif font-bold text-black mb-2">Delete User Account?</h2>
            <p className="text-xs text-gray-500 leading-relaxed font-medium mb-8">
              Are you sure? This will permanently delete the customer's database profile and revoke their authentication access. This action is irreversible.
            </p>

            <div className="flex gap-3 justify-center">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setDeletingCustomerId(null)}
                className="rounded-xl h-12 flex-1 text-[10px] font-bold uppercase tracking-widest border border-gray-200"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl h-12 flex-1 bg-red-600 hover:bg-red-700 text-white transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
