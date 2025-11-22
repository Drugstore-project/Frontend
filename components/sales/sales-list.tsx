"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Receipt, Search, FileText, User, Calendar, CreditCard } from "lucide-react"

interface Sale {
  id: string
  invoice_number: string
  total_amount: number
  discount_amount: number
  final_amount: number
  sale_date: string
  prescription_required: boolean
  clients?: {
    name: string
    cpf: string
  }
  profiles?: {
    full_name: string
  }
  payment_methods?: {
    name: string
  }
  sale_items: Array<{
    quantity: number
    unit_price: number
    total_price: number
    discount_applied: number
    products: {
      name: string
      anvisa_label: string
    }
  }>
}

interface SalesListProps {
  sales: Sale[]
}

export function SalesList({ sales }: SalesListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const filteredSales = sales.filter(
    (sale) =>
      sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Sales Transactions
          </CardTitle>
          <CardDescription>Complete history of all sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice, client, or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-4">
            {filteredSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No sales found matching your search" : "No sales recorded yet"}
              </div>
            ) : (
              filteredSales.map((sale) => (
                <Card key={sale.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">#{sale.invoice_number}</h3>
                        {sale.prescription_required && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Prescription Required
                          </Badge>
                        )}
                        <Badge className="bg-green-100 text-green-800">R$ {sale.final_amount.toFixed(2)}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(sale.sale_date).toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            {sale.clients
                              ? `${sale.clients.name} (${formatCPF(sale.clients.cpf)})`
                              : "Unspecified User"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Receipt className="h-3 w-3" />
                          <span>Seller: {sale.profiles?.full_name || "Unknown"}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span>{sale.payment_methods?.name || "Unknown"}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        Items: {sale.sale_items.length} •
                        {sale.discount_amount > 0 && (
                          <span className="text-green-600 ml-1">Discount: R$ {sale.discount_amount.toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedSale(sale)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Receipt className="h-5 w-5" />
                              Sale Details
                            </DialogTitle>
                            <DialogDescription>#{sale.invoice_number}</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="text-center">
                              <h3 className="font-bold text-lg">PharmaCare</h3>
                              <p className="text-sm text-gray-600">Sale Receipt</p>
                              <p className="text-sm text-gray-600">#{sale.invoice_number}</p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <div className="text-sm">
                                <strong>Date:</strong> {new Date(sale.sale_date).toLocaleString()}
                              </div>
                              <div className="text-sm">
                                <strong>Client:</strong>{" "}
                                {sale.clients
                                  ? `${sale.clients.name} (${formatCPF(sale.clients.cpf)})`
                                  : "Unspecified User"}
                              </div>
                              <div className="text-sm">
                                <strong>Seller:</strong> {sale.profiles?.full_name || "Unknown"}
                              </div>
                              <div className="text-sm">
                                <strong>Payment:</strong> {sale.payment_methods?.name || "Unknown"}
                              </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              {sale.sale_items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span>{item.products.name}</span>
                                      <Badge className={getAnvisaLabelColor(item.products.anvisa_label)}>
                                        {item.products.anvisa_label === "over-the-counter"
                                          ? "OTC"
                                          : item.products.anvisa_label === "red-label"
                                            ? "Red"
                                            : "Black"}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {item.quantity} x R$ {item.unit_price.toFixed(2)}
                                      {item.discount_applied > 0 && (
                                        <span className="text-green-600 ml-1">
                                          (-R$ {item.discount_applied.toFixed(2)})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span>R$ {item.total_price.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            <Separator />

                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>R$ {sale.total_amount.toFixed(2)}</span>
                              </div>
                              {sale.discount_amount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Discount:</span>
                                  <span>-R$ {sale.discount_amount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold">
                                <span>Total:</span>
                                <span>R$ {sale.final_amount.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="text-center text-xs text-gray-500">
                              <p>Thank you for your purchase!</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
