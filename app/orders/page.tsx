"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StockAlerts } from "@/components/stock/stock-alerts"
import { authService } from "@/lib/auth-service"
import { apiService } from "@/lib/api-service"

export default function OrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const token = authService.getToken()
      if (!token) {
        router.push("/auth/login")
        return
      }

      try {
        const userData = await authService.getMe(token)
        setUser(userData)

        // Fetch products to determine low stock
        const productsData = await apiService.getProducts()
        const lowStock = productsData
          .filter((p: any) => p.stock_quantity <= (p.min_stock_level || 5))
          .map((p: any) => ({
            product_id: p.id.toString(),
            product_name: p.name,
            current_stock: p.stock_quantity,
            min_stock_level: p.min_stock_level || 5
          }))
        setLowStockProducts(lowStock)

      } catch (error) {
        console.error("Failed to fetch data", error)
        setUser({ full_name: "Pharmacist", role: "manager" })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Orders</h1>
          <p className="text-gray-600">Manage replenishment and supplier orders</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
            <StockAlerts products={lowStockProducts} />
        </div>
      </main>
    </div>
  )
}
