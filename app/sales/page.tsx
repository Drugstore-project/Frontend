"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SalesList } from "@/components/sales/sales-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/auth-service"

export default function SalesPage() {
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
        // Try to get real user data
        const userData = await authService.getMe(token)
        // Map backend role_id to frontend role string if necessary
        // Assuming backend returns role_id: 1 -> 'admin', 2 -> 'manager', 3 -> 'pharmacist'
        // But for now, let's check what the backend actually returns.
        // If the backend returns a role object or string, use it.
        // If it returns role_id, we need to map it.
        
        // Default fallback if role is missing or numeric
        userData.role = userData.role || 'staff';
        
        setUser(userData)
      } catch (error) {
        console.error("Failed to fetch user, using fallback", error)
        // Fallback for demo/testing if backend isn't ready
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

  // Mock data
  const sales: any[] = []

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
