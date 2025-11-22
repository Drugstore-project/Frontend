"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AdminStats } from "@/components/admin/admin-stats"
import { AdminCharts } from "@/components/admin/admin-charts"
import { authService } from "@/lib/auth-service"
import { apiService } from "@/lib/api-service"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProducts: 0,
    lowStockCount: 0,
    staffCount: 0
  })
  const [analytics, setAnalytics] = useState<any>(null)

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

        const [statsData, analyticsData] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getAnalytics()
        ])
        
        setStats(statsData)
        setAnalytics(analyticsData)
      } catch (err) {
        console.error("Failed to fetch data:", err)
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
            <p className="text-gray-600">System overview and management</p>
          </div>
          <Button asChild>
            <Link href="/admin/staff">
              <Users className="mr-2 h-4 w-4" />
              Manage Staff
            </Link>
          </Button>
        </div>

        <AdminStats stats={stats} />
        
        {analytics && <AdminCharts data={analytics} />}
      </main>
    </div>
  )
}
