"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Package, TrendingDown, Eye } from "lucide-react"
import Link from "next/link"

interface LowStockProduct {
  product_id: string
  product_name: string
  current_stock: number
  min_stock_level: number
}

interface StockOverviewProps {
  lowStockProducts: LowStockProduct[]
}

export function StockOverview({ lowStockProducts }: StockOverviewProps) {
  const criticalProducts = lowStockProducts.filter((p) => p.current_stock === 0)
  const lowStockCount = lowStockProducts.filter((p) => p.current_stock > 0).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stock Status
        </CardTitle>
        <CardDescription>Current inventory alerts</CardDescription>
      </CardHeader>
      <CardContent>
        {lowStockProducts.length === 0 ? (
          <div className="text-center py-4">
            <Package className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-700 font-medium">All stock levels good!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {criticalProducts.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{criticalProducts.length} products out of stock</strong>
                      <div className="text-sm mt-1">Immediate attention required</div>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Critical</Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {lowStockCount > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <TrendingDown className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{lowStockCount} products low on stock</strong>
                      <div className="text-sm mt-1">Consider reordering soon</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Most Critical:</h4>
              {lowStockProducts.slice(0, 3).map((product) => (
                <div key={product.product_id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{product.product_name}</span>
                  <Badge
                    className={
                      product.current_stock === 0 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {product.current_stock} units
                  </Badge>
                </div>
              ))}
            </div>

            <Button asChild size="sm" className="w-full bg-transparent" variant="outline">
              <Link href="/products?tab=stock-alerts">
                <Eye className="h-4 w-4 mr-2" />
                View All Alerts
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
