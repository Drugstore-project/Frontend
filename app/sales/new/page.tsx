"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { SalesInterface } from "@/components/sales-interface"
import { authService } from "@/lib/auth-service"

export default function NewSalePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authService.getToken()
    if (!token) {
      router.push("/auth/login")
      return
    }
    setUser({ full_name: "Pharmacist", role: "manager", id: 1 })
    setLoading(false)
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  // Mock data
  const products: any[] = []
  const clients: any[] = []
  const paymentMethods: any[] = []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Sale</h1>
          <p className="text-gray-600">Process a new sale with automatic discounts and prescription validation</p>
        </div>

        <SalesInterface
          products={products}
          clients={clients}
          paymentMethods={paymentMethods}
          sellerId={user.id}
        />
      </main>
    </div>
  )
}
