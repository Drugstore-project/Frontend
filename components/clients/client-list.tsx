"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiService } from "@/lib/api-service"
import { Search, Edit, Trash2, AlertTriangle, Shield } from "lucide-react"
import { ClientEditDialog } from "./client-edit-dialog"

interface Client {
  id: string
  cpf: string
  name: string
  phone: string
  email?: string
  address?: string
  birth_date?: string
  client_type: string
  is_active: boolean
  created_at: string
}

interface ClientListProps {
  clients: Client[]
}

export function ClientList({ clients: initialClients }: ClientListProps) {
  const [clients, setClients] = useState(initialClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setClients(initialClients)
  }, [initialClients])

  const filteredClients = clients.filter(
    (client) => {
      const searchLower = searchTerm.toLowerCase()
      const nameMatch = client.name && client.name.toLowerCase().includes(searchLower)
      
      // Normalize CPF for search: remove non-digits
      const searchDigits = searchTerm.replace(/\D/g, "")
      const clientCpfDigits = client.cpf ? client.cpf.replace(/\D/g, "") : ""
      const cpfMatch = searchDigits && clientCpfDigits.includes(searchDigits)

      return nameMatch || cpfMatch
    }
  )

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case "elderly":
        return "bg-blue-100 text-blue-800"
      case "insurance":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) return

    setLoading(true)
    try {
      await apiService.deleteClient(selectedClient.id)
      
      // Remove from local state
      setClients(clients.filter((c) => c.id !== selectedClient.id))
      setShowDeleteDialog(false)
      setSelectedClient(null)
      
    } catch (error) {
      console.error("Error deleting client:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Client Database
          </CardTitle>
          <CardDescription>Search and manage client information with LGPD compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-4">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No clients found matching your search" : "No clients registered yet"}
              </div>
            ) : (
              filteredClients.map((client) => (
                <Card key={client.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        <Badge className={getClientTypeColor(client.client_type)}>{client.client_type}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div>CPF: {formatCPF(client.cpf)}</div>
                        <div>Phone: {formatPhone(client.phone)}</div>
                        {client.email && <div>Email: {client.email}</div>}
                      </div>
                      {client.address && <div className="text-sm text-gray-600 mt-1">Address: {client.address}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setClientToEdit(client)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog
                        open={showDeleteDialog && selectedClient?.id === client.id}
                        onOpenChange={setShowDeleteDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedClient(client)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              LGPD Data Deletion
                            </DialogTitle>
                            <DialogDescription>
                              This action will anonymize the client's personal data in compliance with LGPD (Brazilian
                              Data Protection Law). The client record will be marked as inactive and personal
                              information will be replaced with anonymous data.
                            </DialogDescription>
                          </DialogHeader>

                          <Alert className="border-red-200 bg-red-50">
                            <Shield className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              <strong>LGPD Compliance:</strong> This action cannot be undone. The client's personal data
                              will be permanently anonymized.
                            </AlertDescription>
                          </Alert>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteClient} disabled={loading}>
                              {loading ? "Processing..." : "Confirm Deletion"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {clientToEdit && (
        <ClientEditDialog 
            client={clientToEdit} 
            open={!!clientToEdit} 
            onOpenChange={(open) => !open && setClientToEdit(null)}
            onSuccess={(updatedClient) => {
                setClients(clients.map(c => c.id === updatedClient.id ? { ...c, ...updatedClient } : c))
            }}
        />
      )}
    </div>
  )
}
