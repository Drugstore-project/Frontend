"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StaffActivity } from "@/components/staff/staff-activity"
import { authService } from "@/lib/auth-service"
import { getStaffMembers } from "@/app/actions/staff-actions"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { StaffRegistration } from "@/components/staff/staff-registration"

export default function StaffPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)

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

        // Check if user is admin/owner/manager
        if (!["admin", "owner", "manager"].includes(userData.role)) {
          router.push("/dashboard")
          return
        }

        const result = await getStaffMembers()
        if (result.success) {
          setStaffMembers(result.data)
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const refreshStaff = async () => {
    const result = await getStaffMembers()
    if (result.success) {
      setStaffMembers(result.data)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
            <p className="text-gray-600">Manage employees and their roles</p>
          </div>
          <Button onClick={() => setIsRegistrationOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        <div className="grid gap-6">
          <StaffActivity staff={staffMembers} />
        </div>

        <StaffRegistration 
          open={isRegistrationOpen} 
          onOpenChange={setIsRegistrationOpen}
          onSuccess={refreshStaff}
        />
      </main>
    </div>
  )
}
