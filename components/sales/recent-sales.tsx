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
    price: number
  }
  profiles?: {
    full_name: string
  }
}

interface RecentSalesProps {
  sales: Sale[]
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length > 0 ? (
          <div className="space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{sale.products?.name}</span>
                    <Badge variant="secondary">Qty: {sale.quantity}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Customer: {sale.customer_name}</p>
                  <p className="text-xs text-gray-500">
                    Sold by: {sale.profiles?.full_name} •{" "}
                    {formatDistanceToNow(new Date(sale.sale_date), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${Number(sale.total_price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No recent sales</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
