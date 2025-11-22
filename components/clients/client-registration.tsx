"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiService } from "@/lib/api-service"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface ClientRegistrationProps {
  onSuccess?: () => void
}

export function ClientRegistration({ onSuccess }: ClientRegistrationProps) {
  const [formData, setFormData] = useState({
    cpf: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    birth_date: "",
    client_type: "regular",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, "")
    if (numbers.length !== 11) return false

    // Basic CPF validation algorithm
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(numbers.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== Number.parseInt(numbers.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += Number.parseInt(numbers.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    return remainder === Number.parseInt(numbers.charAt(10))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validate CPF
    if (!validateCPF(formData.cpf)) {
      setMessage({ type: "error", text: "Invalid CPF format" })
      setLoading(false)
      return
    }

    // Validate required fields
    if (!formData.name || !formData.phone) {
      setMessage({ type: "error", text: "Name and phone are mandatory fields" })
      setLoading(false)
      return
    }

    try {
      await apiService.createClient({
        cpf: formData.cpf.replace(/\D/g, ""),
        name: formData.name,
        phone: formData.phone.replace(/\D/g, ""),
        email: formData.email,
        address: formData.address,
        birth_date: formData.birth_date,
        client_type: formData.client_type,
      })

      setMessage({ type: "success", text: "Client registered successfully!" })
      setFormData({
        cpf: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        birth_date: "",
        client_type: "regular",
      })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Register New Client</CardTitle>
        <CardDescription>
          Add a new client to the database. CPF must be unique and name/phone are mandatory.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_type">Client Type</Label>
              <Select
                value={formData.client_type}
                onValueChange={(value) => setFormData({ ...formData, client_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="elderly">Elderly (60+)</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Complete address"
            />
          </div>

          {message && (
            <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              {message.type === "error" ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Registering..." : "Register Client"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
