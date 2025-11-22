"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Package, Plus } from "lucide-react"
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
import { updateProductStock, createSupplierOrder } from "@/app/actions/product-actions"

interface LowStockProduct {
  product_id: string
  product_name: string
  current_stock: number
  min_stock_level: number
}

interface StockAlertsProps {
  products: LowStockProduct[]
  canManage?: boolean
}

export function StockAlerts({ products, canManage = true }: StockAlertsProps) {
  const [selectedProduct, setSelectedProduct] = useState<LowStockProduct | null>(null)
  const [reorderQuantity, setReorderQuantity] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [loading, setLoading] = useState(false)

  const criticalProducts = products.filter((p) => p.current_stock === 0)
  const lowStockProducts = products.filter((p) => p.current_stock > 0 && p.current_stock <= p.min_stock_level)

  const handleReorderClick = (product: LowStockProduct) => {
    setSelectedProduct(product)
    setReorderQuantity("")
    setExpirationDate("") 
  }

  const handleConfirmReorder = async () => {
    if (!selectedProduct || !reorderQuantity) return

    setLoading(true)
    try {
      const quantityToAdd = parseInt(reorderQuantity)
      
      // Create supplier order instead of updating stock directly
      await createSupplierOrder(selectedProduct.product_id, quantityToAdd, expirationDate)
      
      // Close dialog
      setSelectedProduct(null)
      alert("Reorder request created successfully!")
    } catch (error) {
      console.error("Failed to reorder", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Stock Alerts
          </CardTitle>
          <CardDescription>Products requiring immediate attention for stock replenishment</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">All Stock Levels Good!</h3>
              <p className="text-gray-600">No products are currently below minimum stock levels.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Critical - Out of Stock */}
              {criticalProducts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Critical - Out of Stock ({criticalProducts.length})
                  </h3>
                  <div className="space-y-3">
                    {criticalProducts.map((product) => (
                      <Alert key={product.product_id} className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-red-800">{product.product_name}</div>
                              <div className="text-red-700">
                                Stock: <Badge className="bg-red-100 text-red-800">0 units</Badge>
                                <span className="ml-2">Min Level: {product.min_stock_level} units</span>
                              </div>
                            </div>
                            {canManage && (
                              <Button 
                                size="sm" 
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleReorderClick(product)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Reorder Now
                              </Button>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Stock */}
              {lowStockProducts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-yellow-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Low Stock Warning ({lowStockProducts.length})
                  </h3>
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <Alert key={product.product_id} className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-yellow-800">{product.product_name}</div>
                              <div className="text-yellow-700">
                                Stock:{" "}
                                <Badge className="bg-yellow-100 text-yellow-800">{product.current_stock} units</Badge>
                                <span className="ml-2">Min Level: {product.min_stock_level} units</span>
                              </div>
                            </div>
                            {canManage && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 bg-transparent"
                                onClick={() => handleReorderClick(product)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Reorder
                              </Button>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reorder Stock</DialogTitle>
            <DialogDescription>
              Add stock for {selectedProduct?.product_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value)}
                className="col-span-3"
                placeholder="Amount to add"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Expected Delivery
              </Label>
              <Input
                id="date"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
            <Button onClick={handleConfirmReorder} disabled={loading || !reorderQuantity}>
              {loading ? "Updating..." : "Confirm Reorder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
