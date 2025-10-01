"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { createSale } from "@/app/actions/sales-actions"
import { Search, Plus, Minus, Trash2, Receipt, AlertTriangle, FileText, ShoppingCart } from "lucide-react"

interface Product {
  id: string
  name: string
  barcode: string
  price: number
  stock_quantity: number
  anvisa_label: string
  requires_prescription: boolean
  max_quantity_per_sale?: number
  medication_categories?: {
    name: string
    anvisa_label: string
    requires_prescription: boolean
    max_quantity_per_sale?: number
  }
}

interface Client {
  id: string
  name: string
  cpf: string
  client_type: string
}

interface PaymentMethod {
  id: string
  name: string
}

interface SaleItem {
  product: Product
  quantity: number
  unit_price: number
  total_price: number
  discount_applied: number
}

interface SalesInterfaceProps {
  products: Product[]
  clients: Client[]
  paymentMethods: PaymentMethod[]
  sellerId: string
}

export function SalesInterface({ products, clients, paymentMethods, sellerId }: SalesInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [paymentMethodId, setPaymentMethodId] = useState("cash") // Updated default value
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const filteredProducts = products.filter(
    (product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.barcode.includes(searchTerm),
  )

  const calculateDiscount = (product: Product, client: Client | null, quantity: number) => {
    let discountPercentage = 0

    // Automatic discounts based on client type
    if (client) {
      switch (client.client_type) {
        case "elderly":
          discountPercentage = 10 // 10% discount for elderly
          break
        case "insurance":
          discountPercentage = 15 // 15% discount for insurance clients
          break
      }
    }

    // Bulk discount for quantities > 5
    if (quantity > 5) {
      discountPercentage = Math.max(discountPercentage, 5) // At least 5% for bulk
    }

    return (product.price * quantity * discountPercentage) / 100
  }

  const addToSale = (product: Product) => {
    const existingItem = saleItems.find((item) => item.product.id === product.id)

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1)
    } else {
      const quantity = 1
      const unit_price = product.price
      const discount_applied = calculateDiscount(product, selectedClient, quantity)
      const total_price = unit_price * quantity - discount_applied

      setSaleItems([
        ...saleItems,
        {
          product,
          quantity,
          unit_price,
          total_price,
          discount_applied,
        },
      ])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromSale(productId)
      return
    }

    setSaleItems(
      saleItems.map((item) => {
        if (item.product.id === productId) {
          // Check max quantity per sale for controlled substances
          if (item.product.max_quantity_per_sale && newQuantity > item.product.max_quantity_per_sale) {
            setMessage({
              type: "error",
              text: `Maximum ${item.product.max_quantity_per_sale} units allowed per sale for ${item.product.name}`,
            })
            return item
          }

          // Check stock availability
          if (newQuantity > item.product.stock_quantity) {
            setMessage({
              type: "error",
              text: `Only ${item.product.stock_quantity} units available for ${item.product.name}`,
            })
            return item
          }

          const discount_applied = calculateDiscount(item.product, selectedClient, newQuantity)
          const total_price = item.unit_price * newQuantity - discount_applied

          return {
            ...item,
            quantity: newQuantity,
            total_price,
            discount_applied,
          }
        }
        return item
      }),
    )
  }

  const removeFromSale = (productId: string) => {
    setSaleItems(saleItems.filter((item) => item.product.id !== productId))
  }

  // Recalculate discounts when client changes
  useEffect(() => {
    setSaleItems(
      saleItems.map((item) => {
        const discount_applied = calculateDiscount(item.product, selectedClient, item.quantity)
        const total_price = item.unit_price * item.quantity - discount_applied
        return { ...item, discount_applied, total_price }
      }),
    )
  }, [selectedClient])

  const subtotal = saleItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const totalDiscount = saleItems.reduce((sum, item) => sum + item.discount_applied, 0)
  const finalTotal = subtotal - totalDiscount

  const requiresPrescription = saleItems.some((item) => item.product.requires_prescription)

  const handleCompleteSale = async () => {
    if (saleItems.length === 0) {
      setMessage({ type: "error", text: "Add at least one product to the sale" })
      return
    }

    if (!paymentMethodId) {
      setMessage({ type: "error", text: "Select a payment method" })
      return
    }

    if (requiresPrescription && !prescriptionFile) {
      setMessage({ type: "error", text: "Prescription required for controlled medications" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await createSale({
        client_id: selectedClient?.id || null,
        seller_id: sellerId,
        payment_method_id: paymentMethodId,
        items: saleItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          discount_applied: item.discount_applied,
        })),
        total_amount: subtotal,
        discount_amount: totalDiscount,
        final_amount: finalTotal,
        prescription_required: requiresPrescription,
        prescription_file: prescriptionFile,
      })

      if (result.success) {
        setReceiptData(result.data)
        setShowReceipt(true)
        setSaleItems([])
        setSelectedClient(null)
        setPaymentMethodId("")
        setPrescriptionFile(null)
        setMessage({ type: "success", text: "Sale completed successfully!" })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to complete sale" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Product Search and Selection */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Product Search
            </CardTitle>
            <CardDescription>Search and add products to the sale</CardDescription>
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
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{product.name}</span>
                        <Badge className={getAnvisaLabelColor(product.anvisa_label)}>
                          {product.anvisa_label === "over-the-counter"
                            ? "OTC"
                            : product.anvisa_label === "red-label"
                              ? "Red"
                              : "Black"}
                        </Badge>
                        {product.requires_prescription && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Rx
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        R$ {product.price.toFixed(2)} • Stock: {product.stock_quantity} units
                      </div>
                    </div>
                    <Button size="sm" onClick={() => addToSale(product)} disabled={product.stock_quantity === 0}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sale Summary and Checkout */}
      <div className="space-y-6">
        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Client (Optional)</CardTitle>
            <CardDescription>Select client for automatic discounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedClient?.id || ""}
              onValueChange={(value) => {
                const client = clients.find((c) => c.id === value)
                setSelectedClient(client || null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client or leave empty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No client selected</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-600">
                        {formatCPF(client.cpf)} • {client.client_type}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Sale Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sale Items ({saleItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {saleItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No items added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {saleItems.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-gray-600">
                        R$ {item.unit_price.toFixed(2)} each
                        {item.discount_applied > 0 && (
                          <span className="text-green-600 ml-2">(-R$ {item.discount_applied.toFixed(2)} discount)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromSale(item.product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total Discount:</span>
                      <span>-R$ {totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment and Prescription */}
        {saleItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment & Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requiresPrescription && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="space-y-2">
                      <div>
                        <strong>Prescription Required:</strong> This sale contains controlled medications that require a
                        prescription.
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prescription">Upload Prescription *</Label>
                        <Input
                          id="prescription"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert
                  className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
                >
                  <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCompleteSale}
                disabled={loading || saleItems.length === 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Complete Sale - R$ {finalTotal.toFixed(2)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Sale Receipt
            </DialogTitle>
            <DialogDescription>Sale completed successfully</DialogDescription>
          </DialogHeader>

          {receiptData && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-lg">PharmaCare</h3>
                <p className="text-sm text-gray-600">Sale Receipt</p>
                <p className="text-sm text-gray-600">#{receiptData.invoice_number}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                {receiptData.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.product_name} x{item.quantity}
                    </span>
                    <span>R$ {item.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {receiptData.total_amount.toFixed(2)}</span>
                </div>
                {receiptData.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-R$ {receiptData.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>R$ {receiptData.final_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500">
                <p>Thank you for your purchase!</p>
                <p>{new Date().toLocaleString()}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowReceipt(false)} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
