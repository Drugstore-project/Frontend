import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { StockMovementHistory } from "@/components/stock-movement-history"
import { StockAdjustment } from "@/components/stock-adjustment"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function StockPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Check if user has permission to manage stock
  if (!profile || !["manager", "owner"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get stock movements
  const { data: stockMovements } = await supabase
    .from("stock_movements")
    .select(`
      *,
      products (name, barcode),
      profiles (full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  // Get products for stock adjustment
  const { data: products } = await supabase
    .from("products")
    .select("id, name, barcode, stock_quantity, min_stock_level")
    .eq("is_active", true)
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Management</h1>
          <p className="text-gray-600">Monitor stock movements and adjust inventory levels</p>
        </div>

        <Tabs defaultValue="movements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="movements">Movement History</TabsTrigger>
            <TabsTrigger value="adjustment">Stock Adjustment</TabsTrigger>
          </TabsList>

          <TabsContent value="movements" className="space-y-6">
            <StockMovementHistory movements={stockMovements || []} />
          </TabsContent>

          <TabsContent value="adjustment" className="space-y-6">
            <StockAdjustment products={products || []} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
