"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, TrendingUp, TrendingDown, RotateCcw, Minus } from "lucide-react"

interface StockMovement {
  id: string
  movement_type: string
  quantity: number
  notes?: string
  created_at: string
  products?: {
    name: string
    barcode: string
  }
  profiles?: {
    full_name: string
  }
}

interface StockMovementHistoryProps {
  movements: StockMovement[]
}

export function StockMovementHistory({ movements }: StockMovementHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.products?.barcode.includes(searchTerm) ||
      movement.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || movement.movement_type === filterType
    return matchesSearch && matchesFilter
  })

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "purchase":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "adjustment":
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      case "expiration":
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return <RotateCcw className="h-4 w-4 text-gray-600" />
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "sale":
        return "bg-red-100 text-red-800"
      case "purchase":
        return "bg-green-100 text-green-800"
      case "adjustment":
        return "bg-blue-100 text-blue-800"
      case "expiration":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getQuantityColor = (quantity: number) => {
    return quantity > 0 ? "text-green-600" : "text-red-600"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Stock Movement History
        </CardTitle>
        <CardDescription>Complete audit trail of all stock changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by product name, barcode, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Movements</SelectItem>
              <SelectItem value="sale">Sales</SelectItem>
              <SelectItem value="purchase">Purchases</SelectItem>
              <SelectItem value="adjustment">Adjustments</SelectItem>
              <SelectItem value="expiration">Expirations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterType !== "all"
                ? "No movements found matching your criteria"
                : "No stock movements recorded yet"}
            </div>
          ) : (
            filteredMovements.map((movement) => (
              <Card key={movement.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getMovementIcon(movement.movement_type)}
                      <Badge className={getMovementColor(movement.movement_type)}>
                        {movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <div className="font-medium">{movement.products?.name || "Unknown Product"}</div>
                      <div className="text-sm text-gray-600">
                        Barcode: {movement.products?.barcode || "N/A"}
                        {movement.notes && <span className="ml-2">• {movement.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-bold text-lg ${getQuantityColor(movement.quantity)}`}>
                      {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity}
                    </div>
                    <div className="text-sm text-gray-600">{new Date(movement.created_at).toLocaleString()}</div>
                    {movement.profiles?.full_name && (
                      <div className="text-xs text-gray-500">by {movement.profiles.full_name}</div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
