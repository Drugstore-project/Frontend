import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { SalesList } from "@/components/sales-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function SalesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get recent sales
  const { data: sales } = await supabase
    .from("sales")
    .select(`
      *,
      clients (name, cpf),
      profiles!sales_seller_id_fkey (full_name),
      payment_methods (name),
      sale_items (
        *,
        products (name, anvisa_label)
      )
    `)
    .order("sale_date", { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales History</h1>
            <p className="text-gray-600">View and manage all sales transactions</p>
          </div>
          <Button asChild>
            <Link href="/sales/new">
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </Link>
          </Button>
        </div>

        <SalesList sales={sales || []} />
      </main>
    </div>
  )
}
