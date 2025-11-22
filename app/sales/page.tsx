"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SalesList } from "@/components/sales/sales-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/auth-service"
import { apiService } from "@/lib/api-service"

export default function SalesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const token = authService.getToken()
      if (!token) {
        router.push("/auth/login")
        return
      }

      try {
        const userData = await authService.getMe(token)
        userData.role = userData.role || 'staff';
        setUser(userData)

        const ordersData = await apiService.getOrders()
        
        const mappedSales = ordersData.map((order: any) => ({
          id: order.id.toString(),
          invoice_number: order.id.toString().padStart(6, '0'),
          total_amount: order.total_value,
          discount_amount: 0,
          final_amount: order.total_value,
          sale_date: order.created_at,
          prescription_required: order.items.some((item: any) => item.product?.requires_prescription),
          clients: order.user ? {
            name: order.user.name,
            cpf: order.user.cpf || "N/A"
          } : undefined,
          profiles: {
            full_name: "Staff" // Backend doesn't track seller yet
          },
          payment_methods: {
            name: order.payment_method || "Cash"
          },
          sale_items: order.items.map((item: any) => ({
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            discount_applied: 0,
            products: {
              name: item.product?.name || "Unknown Product",
              anvisa_label: item.product?.stripe || "over-the-counter"
            }
          }))
        }))
        
        setSales(mappedSales)
      } catch (error) {
        console.error("Failed to fetch data", error)
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

        <SalesList sales={sales} />
      </main>
    </div>
  )
}
