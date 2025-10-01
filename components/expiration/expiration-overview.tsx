"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, AlertTriangle, Clock, Eye } from "lucide-react"
import Link from "next/link"

interface ExpiringProduct {
  product_id: string
  product_name: string
  expiration_date: string
  days_until_expiration: number
}

interface ExpirationOverviewProps {
  expiringProducts: ExpiringProduct[]
}

export function ExpirationOverview({ expiringProducts }: ExpirationOverviewProps) {
  const expiredProducts = expiringProducts.filter((p) => p.days_until_expiration <= 0)
  const expiringSoonProducts = expiringProducts.filter(
    (p) => p.days_until_expiration > 0 && p.days_until_expiration <= 7,
  )

  const getDaysText = (days: number) => {
    if (days <= 0) return "EXPIRED"
    if (days === 1) return "1 day"
    return `${days} days`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Expiration Status
        </CardTitle>
        <CardDescription>Products expiring soon</CardDescription>
      </CardHeader>
      <CardContent>
        {expiringProducts.length === 0 ? (
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-700 font-medium">No expiration concerns!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expiredProducts.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{expiredProducts.length} products expired</strong>
                      <div className="text-sm mt-1">Remove from sale immediately</div>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Expired</Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {expiringSoonProducts.length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{expiringSoonProducts.length} products expiring this week</strong>
                      <div className="text-sm mt-1">Consider discounting or returning</div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Most Urgent:</h4>
              {expiringProducts.slice(0, 3).map((product) => (
                <div key={product.product_id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{product.product_name}</span>
                  <Badge
                    className={
                      product.days_until_expiration <= 0
                        ? "bg-red-100 text-red-800"
                        : product.days_until_expiration <= 7
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {getDaysText(product.days_until_expiration)}
                  </Badge>
                </div>
              ))}
            </div>

            <Button asChild size="sm" className="w-full bg-transparent" variant="outline">
              <Link href="/products?tab=expiration">
                <Eye className="h-4 w-4 mr-2" />
                View All Expiring
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
