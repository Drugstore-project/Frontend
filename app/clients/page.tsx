"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClientList } from "@/components/client-list"
import { ClientRegistration } from "@/components/client-registration"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth-service"

export default function ClientsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authService.getToken()
    if (!token) {
      router.push("/auth/login")
      return
    }
    setUser({ full_name: "Pharmacist", role: "manager" })
    setLoading(false)
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  // Mock data
  const clients: any[] = []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Management</h1>
          <p className="text-gray-600">Manage client information with LGPD compliance</p>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="list">Client List</TabsTrigger>
            <TabsTrigger value="register">Register Client</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <ClientList clients={clients} />
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <ClientRegistration />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
