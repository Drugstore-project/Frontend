import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { SalesInterface } from "@/components/sales-interface"

export default async function NewSalePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Check if user has permission to make sales
  if (!profile || !["seller", "manager", "owner"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get active products with categories
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      medication_categories (name, anvisa_label, requires_prescription, max_quantity_per_sale)
    `)
    .eq("is_active", true)
    .gt("stock_quantity", 0)
    .order("name", { ascending: true })

  // Get active clients
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, cpf, client_type")
    .eq("is_active", true)
    .order("name", { ascending: true })

  // Get payment methods
  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Sale</h1>
          <p className="text-gray-600">Process a new sale with automatic discounts and prescription validation</p>
        </div>

        <SalesInterface
          products={products || []}
          clients={clients || []}
          paymentMethods={paymentMethods || []}
          sellerId={profile.id}
        />
      </main>
    </div>
  )
}
