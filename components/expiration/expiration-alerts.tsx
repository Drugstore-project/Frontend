"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, AlertTriangle, Trash2 } from "lucide-react"

interface ExpiringProduct {
  product_id: string
  product_name: string
  expiration_date: string
  days_until_expiration: number
}

interface ExpirationAlertsProps {
  products: ExpiringProduct[]
  canManage?: boolean
}

export function ExpirationAlerts({ products, canManage = true }: ExpirationAlertsProps) {
  const expiredProducts = products.filter((p) => p.days_until_expiration <= 0)
  const expiringSoonProducts = products.filter((p) => p.days_until_expiration > 0 && p.days_until_expiration <= 30)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getDaysText = (days: number) => {
    if (days <= 0) return "EXPIRED"
    if (days === 1) return "1 day"
    return `${days} days`
  }

  const getDaysColor = (days: number) => {
    if (days <= 0) return "bg-red-100 text-red-800"
    if (days <= 7) return "bg-red-100 text-red-800"
    if (days <= 15) return "bg-yellow-100 text-yellow-800"
    return "bg-orange-100 text-orange-800"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Expiration Monitoring
          </CardTitle>
          <CardDescription>Products expiring within 30 days or already expired</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">No Expiration Concerns!</h3>
              <p className="text-gray-600">No products are expiring within the next 30 days.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Expired Products */}
              {expiredProducts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Expired Products ({expiredProducts.length})
                  </h3>
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>DANGER:</strong> These products have expired and must be removed from sale immediately to
                      comply with health regulations.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-3">
                    {expiredProducts.map((product) => (
                      <Card key={product.product_id} className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-red-800">{product.product_name}</div>
                              <div className="text-red-700">
                                Expired on: {formatDate(product.expiration_date)}
                                <Badge className="ml-2 bg-red-100 text-red-800">
                                  {Math.abs(product.days_until_expiration)} days ago
                                </Badge>
                              </div>
                            </div>
                            {canManage && (
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove from Sale
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring Soon */}
              {expiringSoonProducts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-orange-700 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Expiring Soon ({expiringSoonProducts.length})
                  </h3>
                  <div className="space-y-3">
                    {expiringSoonProducts.map((product) => (
                      <Card key={product.product_id} className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-orange-800">{product.product_name}</div>
                              <div className="text-orange-700">
                                Expires: {formatDate(product.expiration_date)}
                                <Badge className={`ml-2 ${getDaysColor(product.days_until_expiration)}`}>
                                  {getDaysText(product.days_until_expiration)} remaining
                                </Badge>
                              </div>
                            </div>
                            {canManage && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-orange-300 text-orange-700 hover:bg-orange-100 bg-transparent"
                                >
                                  Mark for Discount
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-orange-300 text-orange-700 hover:bg-orange-100 bg-transparent"
                                >
                                  Contact Supplier
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
