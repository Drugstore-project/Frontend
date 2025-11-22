"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AdminStats } from "@/components/admin/admin-stats"
import { authService } from "@/lib/auth-service"

export default function AdminPage() {
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

  // Mock stats data
  const stats = {
    totalRevenue: 15430.50,
    totalProducts: 45,
    lowStockCount: 3,
    staffCount: 5
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>

        <AdminStats stats={stats} />
      </main>
    </div>
  )
}
