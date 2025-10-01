import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClientList } from "@/components/client-list"
import { ClientRegistration } from "@/components/client-registration"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Check if user has permission to manage clients
  if (!profile || !["manager", "owner"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get all clients
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={profile} />

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
            <ClientList clients={clients || []} />
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <ClientRegistration />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
