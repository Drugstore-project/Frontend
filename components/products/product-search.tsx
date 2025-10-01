"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Package, AlertTriangle, ShoppingCart } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock_quantity: number
  category: string
  requires_prescription: boolean
  suppliers?: {
    name: string
    contact_email: string
  }
}

export function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const searchProducts = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        suppliers (name, contact_email)
      `)
      .ilike("name", `%${searchTerm}%`)
      .order("name")

    if (!error && data) {
      setProducts(data)
    }
    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchProducts()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Product Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search for medications, vitamins, supplies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={searchProducts} disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>

        {products.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{product.category}</Badge>
                      {product.requires_prescription && <Badge variant="destructive">Prescription Required</Badge>}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${product.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>Stock: {product.stock_quantity}</span>
                      {product.stock_quantity < 20 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    </div>
                    {product.suppliers && <span>Supplier: {product.suppliers.name}</span>}
                  </div>

                  <div className="flex gap-2">
                    {product.stock_quantity > 0 ? (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Sell
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline">
                        Order from Supplier
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {products.length === 0 && searchTerm && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No products found matching "{searchTerm}"</p>
            <p className="text-sm">Try a different search term or check with suppliers</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
