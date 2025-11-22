"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Edit, Package, AlertTriangle, Calendar, Barcode } from "lucide-react"

interface Product {
  id: string
  name: string
  description?: string
  barcode: string
  price: number
  stock_quantity: number
  min_stock_level: number
  expiration_date: string
  batch_number?: string
  anvisa_label: string
  requires_prescription: boolean
  max_quantity_per_sale?: number
  is_active: boolean
  category?: string
  medication_categories?: {
    name: string
    anvisa_label: string
  }
  suppliers?: {
    name: string
  }
}

interface ProductListProps {
  products: Product[]
}

export function ProductList({ products }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLabel, setFilterLabel] = useState<string>("all")

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.barcode.includes(searchTerm)
    const matchesFilter = filterLabel === "all" || product.anvisa_label === filterLabel
    return matchesSearch && matchesFilter
  })

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
        return "OTC"
      case "red-label":
        return "Red Label"
      case "black-label":
        return "Black Label"
      default:
        return label
    }
  }

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { color: "bg-red-100 text-red-800", text: "Out of Stock" }
    if (current <= min) return { color: "bg-yellow-100 text-yellow-800", text: "Low Stock" }
    return { color: "bg-green-100 text-green-800", text: "In Stock" }
  }

  const isExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate)
    const today = new Date()
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiration <= 30
  }

  const isExpired = (expirationDate: string) => {
    return new Date(expirationDate) <= new Date()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Medication Inventory
          </CardTitle>
          <CardDescription>Manage medications with Anvisa compliance and stock monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterLabel === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterLabel("all")}
              >
                All
              </Button>
              <Button
                variant={filterLabel === "over-the-counter" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterLabel("over-the-counter")}
              >
                OTC
              </Button>
              <Button
                variant={filterLabel === "red-label" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterLabel("red-label")}
              >
                Red Label
              </Button>
              <Button
                variant={filterLabel === "black-label" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterLabel("black-label")}
              >
                Black Label
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || filterLabel !== "all"
                  ? "No products found matching your criteria"
                  : "No products registered yet"}
              </div>
            ) : (
              filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity, product.min_stock_level)
                const expiringSoon = isExpiringSoon(product.expiration_date)
                const expired = isExpired(product.expiration_date)

                return (
                  <Card key={product.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <Badge className={getAnvisaLabelColor(product.anvisa_label)}>
                            {getAnvisaLabelName(product.anvisa_label)}
                          </Badge>
                          {product.requires_prescription && (
                            <Badge variant="outline" className="text-red-600 border-red-200">
                              Prescription Required
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Barcode className="h-3 w-3" />
                              <span>Barcode: {product.barcode}</span>
                            </div>
                            <div className="font-semibold text-green-600">R$ {product.price.toFixed(2)}</div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span>Stock:</span>
                              <Badge className={stockStatus.color}>{product.stock_quantity} units</Badge>
                            </div>
                            <div className="text-gray-600">Min: {product.min_stock_level} units</div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>Expires: {new Date(product.expiration_date).toLocaleDateString()}</span>
                            </div>
                            {product.batch_number && <div className="text-gray-600">Batch: {product.batch_number}</div>}
                          </div>

                          <div className="space-y-1">
                            {product.medication_categories && (
                              <div className="text-gray-600">Category: {product.medication_categories.name}</div>
                            )}
                            {product.suppliers && (
                              <div className="text-gray-600">Supplier: {product.suppliers.name}</div>
                            )}
                          </div>
                        </div>

                        {product.description && <p className="text-gray-600 text-sm mt-2">{product.description}</p>}

                        {/* Alerts */}
                        <div className="mt-3 space-y-2">
                          {expired && (
                            <Alert className="border-red-200 bg-red-50">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800">
                                <strong>EXPIRED:</strong> This medication has expired and should not be sold.
                              </AlertDescription>
                            </Alert>
                          )}

                          {!expired && expiringSoon && (
                            <Alert className="border-yellow-200 bg-yellow-50">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <AlertDescription className="text-yellow-800">
                                <strong>Expiring Soon:</strong> This medication expires within 30 days.
                              </AlertDescription>
                            </Alert>
                          )}

                          {product.stock_quantity <= product.min_stock_level && (
                            <Alert className="border-orange-200 bg-orange-50">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <AlertDescription className="text-orange-800">
                                <strong>Low Stock:</strong> Stock is at or below minimum level.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
