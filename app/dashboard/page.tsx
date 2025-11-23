"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProductSearch } from "@/components/products/product-search"
import { QuickActions } from "@/components/sales/quick-actions"
import { RecentSales } from "@/components/sales/recent-sales"
import { StockOverview } from "@/components/stock/stock-overview"
import { ExpirationOverview } from "@/components/expiration/expiration-overview"
import { authService } from "@/lib/auth-service"
import { apiService } from "@/lib/api-service"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [expiringProducts, setExpiringProducts] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const token = authService.getToken()
      if (!token) {
        router.push("/auth/login")
        return
      }

      try {
        const userData = await authService.getMe(token)
        
        // Default fallback if role is missing or numeric
        userData.role = userData.role || 'staff';

        setUser(userData)

        // Fetch products, orders, and users for dashboard widgets
        const [products, orders, users] = await Promise.all([
          apiService.getProducts(),
          apiService.getOrders(),
          apiService.getClients()
        ])
        
        // Process Low Stock (threshold dynamic)
        const lowStock = products
          .filter((p: any) => p.stock_quantity <= (p.min_stock_level || 10))
          .map((p: any) => ({
            product_id: p.id.toString(),
            product_name: p.name,
            current_stock: p.stock_quantity,
            min_stock_level: p.min_stock_level || 10
          }))
        setLowStockProducts(lowStock)

        // Process Expiration
        const today = new Date()
        const expiring = products
          .filter((p: any) => p.validity)
          .map((p: any) => {
            const validityDate = new Date(p.validity)
            const diffTime = validityDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return {
              product_id: p.id.toString(),
              product_name: p.name,
              expiration_date: p.validity,
              days_until_expiration: diffDays
            }
          })
          .filter((p: any) => p.days_until_expiration <= 90) // Show items expiring in next 90 days
          .sort((a: any, b: any) => a.days_until_expiration - b.days_until_expiration)
          
        setExpiringProducts(expiring)

        // Process Recent Sales
        const processedSales = orders
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5) // Get top 5 recent sales
          .map((order: any) => {
            const client = users.find((u: any) => u.id === order.user_id)
            const seller = users.find((u: any) => u.id === order.seller_id)
            const firstItem = order.items[0]
            const product = products.find((p: any) => p.id === firstItem?.product_id)
            
            return {
              id: order.id.toString(),
              customer_name: client?.name || "Walk-in Client",
              quantity: order.items.reduce((acc: number, item: any) => acc + item.quantity, 0),
              total_price: order.total_value,
              sale_date: order.created_at,
              products: {
                name: product?.name || "Unknown Product",
                price: firstItem?.unit_price || 0
              },
              profiles: {
                full_name: seller?.name || "Staff"
              }
            }
          })
        setRecentSales(processedSales)

      } catch (error) {
        console.error("Failed to fetch data", error)
        // Fallback for demo/testing if backend isn't ready
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.full_name || "Pharmacist"}</h1>
          <p className="text-gray-600">Manage your pharmacy operations efficiently and securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ProductSearch />
            <RecentSales sales={recentSales} />
          </div>

          <div className="space-y-8">
            <QuickActions userRole={user?.role || "staff"} />
            <StockOverview lowStockProducts={lowStockProducts} />
            <ExpirationOverview expiringProducts={expiringProducts} />
          </div>
        </div>
      </main>
    </div>
  )
}
