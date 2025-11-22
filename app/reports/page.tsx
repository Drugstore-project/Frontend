"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SalesReport } from "@/components/sales/sales-report"
import { authService } from "@/lib/auth-service"

export default function ReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = authService.getToken()
      if (!token) {
        router.push("/auth/login")
        return
      }

      try {
        const userData = await authService.getMe(token)
        setUser(userData)
      } catch (error) {
        console.error("Failed to fetch user", error)
        setUser({ full_name: "Pharmacist", role: "manager" })
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  // Mock data for reports
  const sales: any[] = []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Reports</h1>
          <p className="text-gray-600">Analyze sales performance and trends</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
            <SalesReport sales={sales} />
        </div>
      </main>
    </div>
  )
}
