"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SalesInterface } from "@/components/sales/sales-interface"
import { authService } from "@/lib/auth-service"
import { apiService } from "@/lib/api-service"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewSalePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/auth/login")
        return
      }

      if (!user) {
          const userData = await authService.getMe(token)
          setUser(userData)
      }

      // Fetch products and clients from Python Backend
      const [productsData, clientsData] = await Promise.all([
        apiService.getProducts(),
        apiService.getClients()
      ])

      // Map backend data to frontend interfaces
      const mappedProducts = productsData.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        barcode: p.barcode || "N/A",
        price: p.price,
        stock_quantity: p.stock_quantity,
        anvisa_label: p.stripe || "over-the-counter", // Map 'stripe' to 'anvisa_label'
        requires_prescription: p.requires_prescription,
        max_quantity_per_sale: null // Backend doesn't seem to have this yet
      }))

      const mappedClients = clientsData.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        cpf: c.cpf || "000.000.000-00", // Backend might not have CPF on User model yet
        client_type: "standard" // Default
      }))

      setProducts(mappedProducts)
      setClients(mappedClients)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const paymentMethods = [
    { id: "cash", name: "Cash" },
    { id: "credit_card", name: "Credit Card" },
    { id: "debit_card", name: "Debit Card" },
    { id: "pix", name: "Pix" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">New Sale</h1>
            <p className="text-gray-600">Process a new sale with automatic discounts and prescription validation</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/sales">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sales
            </Link>
          </Button>
        </div>

        <SalesInterface
          products={products}
          clients={clients}
          paymentMethods={paymentMethods}
          sellerId={user?.id?.toString() || "1"}
          onSaleComplete={loadData}
        />
      </main>
    </div>
  )
}

