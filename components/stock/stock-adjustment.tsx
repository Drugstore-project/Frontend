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
import { adjustStock } from "@/app/actions/stock-actions"
import { AlertCircle, CheckCircle2, Package, Search } from "lucide-react"

interface Product {
  id: string
  name: string
  barcode: string
  stock_quantity: number
  min_stock_level: number
}

interface StockAdjustmentProps {
  products: Product[]
}

export function StockAdjustment({ products }: StockAdjustmentProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<"set" | "add" | "subtract">("set")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const filteredProducts = products.filter(
    (product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.barcode.includes(searchTerm),
  )

  const calculateNewStock = () => {
    if (!selectedProduct || !quantity) return selectedProduct?.stock_quantity || 0

    const qty = Number.parseInt(quantity)
    switch (adjustmentType) {
      case "set":
        return qty
      case "add":
        return selectedProduct.stock_quantity + qty
      case "subtract":
        return Math.max(0, selectedProduct.stock_quantity - qty)
      default:
        return selectedProduct.stock_quantity
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !quantity || !reason) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    const newStock = calculateNewStock()
    if (newStock < 0) {
      setMessage({ type: "error", text: "Stock cannot be negative" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await adjustStock(selectedProduct.id, newStock, reason)

      if (result.success) {
        setMessage({ type: "success", text: "Stock adjusted successfully!" })
        // Update local product data
        setSelectedProduct({ ...selectedProduct, stock_quantity: newStock })
        setQuantity("")
        setReason("")
      } else {
        setMessage({ type: "error", text: result.error || "Failed to adjust stock" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { color: "bg-red-100 text-red-800", text: "Out of Stock" }
    if (current <= min) return { color: "bg-yellow-100 text-yellow-800", text: "Low Stock" }
    return { color: "bg-green-100 text-green-800", text: "In Stock" }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select Product
          </CardTitle>
          <CardDescription>Choose a product to adjust stock levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity, product.min_stock_level)
                return (
                  <div
                    key={product.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProduct?.id === product.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">Barcode: {product.barcode}</div>
                      </div>
                      <div className="text-right">
                        <Badge className={stockStatus.color}>{product.stock_quantity} units</Badge>
                        <div className="text-xs text-gray-500 mt-1">Min: {product.min_stock_level}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Adjustment
          </CardTitle>
          <CardDescription>Adjust inventory levels with audit trail</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedProduct ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a product to adjust stock</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">{selectedProduct.name}</h3>
                <div className="text-sm text-gray-600">
                  Current Stock: <span className="font-medium">{selectedProduct.stock_quantity} units</span>
                  <br />
                  Min Level: <span className="font-medium">{selectedProduct.min_stock_level} units</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustment_type">Adjustment Type *</Label>
                <Select
                  value={adjustmentType}
                  onValueChange={(value: "set" | "add" | "subtract") => setAdjustmentType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set">Set to specific amount</SelectItem>
                    <SelectItem value="add">Add to current stock</SelectItem>
                    <SelectItem value="subtract">Subtract from current stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity * {adjustmentType === "set" && "(new total)"}
                  {adjustmentType === "add" && "(amount to add)"}
                  {adjustmentType === "subtract" && "(amount to subtract)"}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  required
                />
              </div>

              {quantity && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm">
                    <strong>Preview:</strong> Stock will change from{" "}
                    <span className="font-medium">{selectedProduct.stock_quantity}</span> to{" "}
                    <span className="font-medium">{calculateNewStock()}</span> units
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Adjustment *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this adjustment is needed (e.g., inventory count, damaged goods, etc.)"
                  rows={3}
                  required
                />
              </div>

              {message && (
                <Alert
                  className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
                >
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
                {loading ? "Adjusting Stock..." : "Adjust Stock"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
