"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ClientList } from "@/components/clients/client-list"
import { ClientRegistration } from "@/components/clients/client-registration"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth-service"
import { apiService } from "@/lib/api-service"

export default function ClientsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])

  const fetchClients = async () => {
    try {
      const allUsers = await apiService.getClients()
      const mappedClients = allUsers
        .filter((u: any) => u.client_type || u.role_id === 2) 
        .map((u: any) => ({
          id: u.id.toString(),
          cpf: u.cpf || "",
          name: u.name,
          phone: u.phone || "",
          email: u.email,
          address: u.address,
          birth_date: u.birth_date,
          client_type: u.client_type || "regular",
          is_active: u.is_active,
          created_at: new Date().toISOString()
        }))
      setClients(mappedClients)
    } catch (err) {
      console.error("Failed to fetch clients:", err)
    }
  }

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
        await fetchClients()
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
            <ClientRegistration onSuccess={fetchClients} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
