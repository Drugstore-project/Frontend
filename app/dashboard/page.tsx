"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProductSearch } from "@/components/product-search"
import { QuickActions } from "@/components/quick-actions"
import { RecentSales } from "@/components/recent-sales"
import { StockOverview } from "@/components/stock-overview"
import { ExpirationOverview } from "@/components/expiration-overview"
import { authService } from "@/lib/auth-service"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authService.getToken()
    if (!token) {
      router.push("/auth/login")
      return
    }

    // Mock user for now, or fetch from API
    setUser({ full_name: "Pharmacist", role: "manager" })
    setLoading(false)
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  // Mock data
  const recentSales: any[] = []
  const lowStockProducts: any[] = []
  const expiringProducts: any[] = []

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
