import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProductList } from "@/components/product-list"
import { ProductRegistration } from "@/components/product-registration"
import { StockAlerts } from "@/components/stock-alerts"
import { ExpirationAlerts } from "@/components/expiration-alerts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get all products with categories and suppliers
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      medication_categories (name, anvisa_label),
      suppliers (name)
    `)
    .eq("is_active", true)
    .order("name", { ascending: true })

  // Get medication categories
  const { data: categories } = await supabase
    .from("medication_categories")
    .select("*")
    .order("name", { ascending: true })

  // Get suppliers
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })

  // Get low stock products
  const { data: lowStockProducts } = await supabase.rpc("get_low_stock_products")

  // Get expiring products
  const { data: expiringProducts } = await supabase.rpc("get_expiring_products", { days_ahead: 30 })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
          <p className="text-gray-600">Manage medications with Anvisa compliance and stock control</p>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="list">Products</TabsTrigger>
            <TabsTrigger value="register">Add Product</TabsTrigger>
            <TabsTrigger value="stock-alerts">Stock Alerts</TabsTrigger>
            <TabsTrigger value="expiration">Expiration</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <ProductList products={products || []} />
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <ProductRegistration categories={categories || []} suppliers={suppliers || []} />
          </TabsContent>

          <TabsContent value="stock-alerts" className="space-y-6">
            <StockAlerts products={lowStockProducts || []} />
          </TabsContent>

          <TabsContent value="expiration" className="space-y-6">
            <ExpirationAlerts products={expiringProducts || []} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
