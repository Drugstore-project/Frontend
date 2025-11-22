"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StockMovementHistory } from "@/components/stock/stock-movement-history"
import { StockAdjustment } from "@/components/stock/stock-adjustment"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth-service"

export default function StockPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authService.getToken()
    if (!token) {
      router.push("/auth/login")
      return
    }
    
    authService.getMe(token)
      .then(userData => {
        setUser(userData)
      })
      .catch(err => {
        console.error("Failed to fetch user:", err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  // Mock data
  const stockMovements: any[] = []
  const products: any[] = []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

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
            <StockMovementHistory movements={stockMovements} />
          </TabsContent>

          <TabsContent value="adjustment" className="space-y-6">
            <StockAdjustment products={products} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
