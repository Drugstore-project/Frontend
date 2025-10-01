import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProductSearch } from "@/components/product-search"
import { QuickActions } from "@/components/quick-actions"
import { RecentSales } from "@/components/recent-sales"
import { StockOverview } from "@/components/stock-overview"
import { ExpirationOverview } from "@/components/expiration-overview"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get recent sales for this user
  const { data: recentSales } = await supabase
    .from("sales")
    .select(`
      *,
      sale_items (
        *,
        products (name, price)
      ),
      profiles (full_name)
    `)
    .order("sale_date", { ascending: false })
    .limit(5)

  const { data: lowStockProducts } = await supabase.rpc("get_low_stock_products")
  const { data: expiringProducts } = await supabase.rpc("get_expiring_products", { days_ahead: 30 })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {profile?.full_name || "Pharmacist"}</h1>
          <p className="text-gray-600">Manage your pharmacy operations efficiently and securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ProductSearch />
            <RecentSales sales={recentSales || []} />
          </div>

          <div className="space-y-8">
            <QuickActions userRole={profile?.role || "staff"} />
            <StockOverview lowStockProducts={lowStockProducts || []} />
            <ExpirationOverview expiringProducts={expiringProducts || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
