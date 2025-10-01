import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface Sale {
  id: string
  customer_name: string
  quantity: number
  total_price: number
  sale_date: string
  products?: {
    name: string
    category: string
  }
  profiles?: {
    full_name: string
    role: string
  }
}

interface SalesReportProps {
  sales: Sale[]
}

export function SalesReport({ sales }: SalesReportProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {sales.map((sale) => (
              <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium">{sale.products?.name}</h4>
                    <p className="text-sm text-gray-600">Customer: {sale.customer_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{sale.products?.category}</Badge>
                      <Badge variant="secondary">Qty: {sale.quantity}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${Number(sale.total_price).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                  <span>Sold by: {sale.profiles?.full_name}</span>
                  <span>{formatDistanceToNow(new Date(sale.sale_date), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No sales data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
