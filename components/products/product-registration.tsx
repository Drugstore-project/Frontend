"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { createProduct } from "@/app/actions/product-actions"
import { AlertCircle, CheckCircle2, Shield, AlertTriangle } from "lucide-react"

interface Category {
  id: string
  name: string
  anvisa_label: string
  requires_prescription: boolean
  max_quantity_per_sale?: number
}

interface Supplier {
  id: string
  name: string
}

interface ProductRegistrationProps {
  categories: Category[]
  suppliers: Supplier[]
}

export function ProductRegistration({ categories, suppliers }: ProductRegistrationProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    barcode: "",
    price: "",
    stock_quantity: "",
    min_stock_level: "10",
    category_id: "",
    supplier_id: "",
    expiration_date: "",
    batch_number: "",
    anvisa_label: "over-the-counter",
    requires_prescription: false,
    max_quantity_per_sale: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const selectedCategory = categories.find((c) => c.id === formData.category_id)

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (category) {
      setFormData({
        ...formData,
        category_id: categoryId,
        anvisa_label: category.anvisa_label,
        requires_prescription: category.requires_prescription,
        max_quantity_per_sale: category.max_quantity_per_sale?.toString() || "",
      })
    }
  }

  const getAnvisaLabelColor = (label: string) => {
    switch (label) {
      case "over-the-counter":
        return "bg-green-100 text-green-800"
      case "red-label":
        return "bg-red-100 text-red-800"
      case "black-label":
        return "bg-gray-900 text-white"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAnvisaLabelName = (label: string) => {
    switch (label) {
      case "over-the-counter":
        return "Over-the-Counter"
      case "red-label":
        return "Red Label (Controlled)"
      case "black-label":
        return "Black Label (Highly Controlled)"
      default:
        return label
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validate required fields
    if (!formData.name || !formData.barcode || !formData.price || !formData.expiration_date) {
      setMessage({ type: "error", text: "Name, barcode, price, and expiration date are mandatory" })
      setLoading(false)
      return
    }

    // Validate expiration date is in the future
    if (new Date(formData.expiration_date) <= new Date()) {
      setMessage({ type: "error", text: "Expiration date must be in the future" })
      setLoading(false)
      return
    }

    try {
      const result = await createProduct({
        ...formData,
        price: Number.parseFloat(formData.price),
        stock_quantity: Number.parseInt(formData.stock_quantity) || 0,
        min_stock_level: Number.parseInt(formData.min_stock_level) || 10,
        max_quantity_per_sale: formData.max_quantity_per_sale ? Number.parseInt(formData.max_quantity_per_sale) : null,
      })

      if (result.success) {
        setMessage({ type: "success", text: "Product registered successfully!" })
        setFormData({
          name: "",
          description: "",
          barcode: "",
          price: "",
          stock_quantity: "",
          min_stock_level: "10",
          category_id: "",
          supplier_id: "",
          expiration_date: "",
          batch_number: "",
          anvisa_label: "over-the-counter",
          requires_prescription: false,
          max_quantity_per_sale: "",
        })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to register product" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Register New Medication
        </CardTitle>
        <CardDescription>Add a new medication to inventory with Anvisa compliance and stock control</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medication Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter medication name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode *</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Product barcode (must be unique)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch_number">Batch Number</Label>
                <Input
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder="Batch/Lot number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Medication description, usage, etc."
                rows={3}
              />
            </div>
          </div>

          {/* Category and Compliance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Category & Anvisa Compliance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Medication Category *</Label>
                <Select value={formData.category_id} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <span>{category.name}</span>
                          <Badge className={getAnvisaLabelColor(category.anvisa_label)}>
                            {getAnvisaLabelName(category.anvisa_label)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedCategory && (
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <strong>Anvisa Classification:</strong>
                      <Badge className={getAnvisaLabelColor(selectedCategory.anvisa_label)}>
                        {getAnvisaLabelName(selectedCategory.anvisa_label)}
                      </Badge>
                    </div>
                    {selectedCategory.requires_prescription && (
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Requires prescription for sale</span>
                      </div>
                    )}
                    {selectedCategory.max_quantity_per_sale && (
                      <div>
                        <strong>Max quantity per sale:</strong> {selectedCategory.max_quantity_per_sale} units
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Stock and Expiration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stock & Expiration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Initial Stock</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Min Stock Alert Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  min="1"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date *</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {formData.max_quantity_per_sale && (
              <div className="space-y-2">
                <Label htmlFor="max_quantity_per_sale">Max Quantity Per Sale</Label>
                <Input
                  id="max_quantity_per_sale"
                  type="number"
                  min="1"
                  value={formData.max_quantity_per_sale}
                  onChange={(e) => setFormData({ ...formData, max_quantity_per_sale: e.target.value })}
                  placeholder="Maximum units per sale"
                />
              </div>
            )}
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
            {loading ? "Registering..." : "Register Medication"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
