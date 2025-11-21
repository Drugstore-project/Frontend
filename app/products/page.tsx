"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProductList } from "@/components/product-list"
import { ProductRegistration } from "@/components/product-registration"
import { StockAlerts } from "@/components/stock-alerts"
import { ExpirationAlerts } from "@/components/expiration-alerts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth-service"

export default function ProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authService.getToken()
    if (!token) {
      router.push("/auth/login")
      return
    }
    setUser({ full_name: "Pharmacist", role: "manager" })
    setLoading(false)
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  // Mock data
  const products: any[] = []
  const categories: any[] = []
  const suppliers: any[] = []
  const lowStockProducts: any[] = []
  const expiringProducts: any[] = []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

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
            <ProductList products={products} />
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <ProductRegistration categories={categories} suppliers={suppliers} />
          </TabsContent>

          <TabsContent value="stock-alerts" className="space-y-6">
            <StockAlerts products={lowStockProducts} />
          </TabsContent>

          <TabsContent value="expiration" className="space-y-6">
            <ExpirationAlerts products={expiringProducts} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
