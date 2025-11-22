"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createStaffMember } from "@/app/actions/staff-actions"
import { apiService } from "@/lib/api-service"

interface StaffRegistrationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StaffRegistration({ open, onOpenChange, onSuccess }: StaffRegistrationProps) {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
    cpf: "",
  })

  useEffect(() => {
    if (open) {
      apiService.getRoles().then(data => {
        // Filter out client roles if needed, or just show all
        setRoles(data.filter((r: any) => !['client', 'customer'].includes(r.name.toLowerCase())))
      }).catch(console.error)
    }
  }, [open])

  const formatCPF = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, "")
    
    // Limit to 11 digits
    const truncatedValue = numericValue.slice(0, 11)

    // Apply mask
    return truncatedValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setFormData({ ...formData, cpf: formatted })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.role_id) {
      alert("Please select a role")
      return
    }

    setLoading(true)

    try {
      const result = await createStaffMember(formData)
      if (result.success) {
        onSuccess()
        onOpenChange(false)
        setFormData({ name: "", email: "", password: "", role_id: "", cpf: "" })
      } else {
        alert(result.error || "Failed to create staff member")
      }
    } catch (error) {
      console.error(error)
      alert("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Create a new account for a staff member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpf" className="text-right">
                CPF
              </Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                className="col-span-3"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select 
                value={formData.role_id} 
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
