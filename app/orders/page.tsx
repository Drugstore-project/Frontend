"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, Calendar, Package, CheckCircle, History, Plus } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StockAlerts } from "@/components/stock/stock-alerts"
import { authService } from "@/lib/auth-service"
import { apiService } from "@/lib/api-service"
import { receiveSupplierOrder } from "@/app/actions/product-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [supplierOrders, setSupplierOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  
  // Receive Order State
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [receiveData, setReceiveData] = useState({
    batch_number: "",
    expiration_date: ""
  })

  // Test Data State
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [testOrderData, setTestOrderData] = useState({
    product_id: "",
    quantity: "10",
    date: new Date().toISOString().split('T')[0],
    batch_number: "",
    expiration_date: ""
  })

  const fetchData = async () => {
    const token = authService.getToken()
    if (!token) {
      router.push("/auth/login")
      return
    }

    try {
      const userData = await authService.getMe(token)
      setUser(userData)

      // Fetch products
      const productsData = await apiService.getProducts()
      setProducts(productsData)
      
      const lowStock = productsData
        .filter((p: any) => p.stock_quantity <= (p.min_stock_level || 5))
        .map((p: any) => ({
          product_id: p.id.toString(),
          product_name: p.name,
          current_stock: p.stock_quantity,
          min_stock_level: p.min_stock_level || 5
        }))
      setLowStockProducts(lowStock)

      // Fetch supplier orders
      try {
        const orders = await apiService.getSupplierOrders()
        setSupplierOrders(orders)
      } catch (e) {
        console.error("Failed to fetch supplier orders", e)
      }

    } catch (error) {
      console.error("Failed to fetch data", error)
      setUser({ full_name: "Pharmacist", role: "manager" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [router])

  const openReceiveDialog = (orderId: string) => {
    setSelectedOrderId(orderId)
    setReceiveData({ batch_number: "", expiration_date: "" })
    setIsReceiveDialogOpen(true)
  }

  const handleReceiveOrder = async () => {
    if (!selectedOrderId || !receiveData.batch_number || !receiveData.expiration_date) {
      alert("Please fill in all fields")
      return
    }

    try {
      await receiveSupplierOrder(selectedOrderId, receiveData)
      setIsReceiveDialogOpen(false)
      fetchData()
    } catch (e) {
      alert("Failed to receive order")
    }
  }

  const handleCreateTestOrder = async () => {
    try {
      const payload = {
        product_id: parseInt(testOrderData.product_id),
        quantity: parseInt(testOrderData.quantity),
        expected_delivery_date: testOrderData.date,
        status: 'received',
        created_at: new Date(testOrderData.date).toISOString(),
        batch_number: testOrderData.batch_number || `TEST-${Date.now()}`,
        expiration_date: testOrderData.expiration_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      }
      
      await apiService.createSupplierOrder(payload)
      setIsTestDialogOpen(false)
      fetchData()
    } catch (e) {
      alert("Failed to create test order")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const activeOrders = supplierOrders.filter(o => o.status === 'pending')
  const receivedOrders = supplierOrders.filter(o => o.status === 'received')

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Orders</h1>
            <p className="text-gray-600">Manage replenishment and supplier orders</p>
          </div>
          
          <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Receive Order</DialogTitle>
                <DialogDescription>
                  Enter the batch details for the received items.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Batch Number</Label>
                  <Input 
                    value={receiveData.batch_number}
                    onChange={(e) => setReceiveData({...receiveData, batch_number: e.target.value})}
                    className="col-span-3"
                    placeholder="e.g. LOTE-2025-001"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Expiration</Label>
                  <Input 
                    type="date" 
                    value={receiveData.expiration_date}
                    onChange={(e) => setReceiveData({...receiveData, expiration_date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleReceiveOrder}>Confirm Receipt</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Past Order (Test)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Past Order Record</DialogTitle>
                <DialogDescription>
                  Simulate a received order for testing history.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Product</Label>
                  <Select 
                    value={testOrderData.product_id} 
                    onValueChange={(val) => setTestOrderData({...testOrderData, product_id: val})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Quantity</Label>
                  <Input 
                    type="number" 
                    value={testOrderData.quantity}
                    onChange={(e) => setTestOrderData({...testOrderData, quantity: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Date</Label>
                  <Input 
                    type="date" 
                    value={testOrderData.date}
                    onChange={(e) => setTestOrderData({...testOrderData, date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Batch #</Label>
                  <Input 
                    value={testOrderData.batch_number}
                    onChange={(e) => setTestOrderData({...testOrderData, batch_number: e.target.value})}
                    className="col-span-3"
                    placeholder="Optional (Auto-generated)"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Expires</Label>
                  <Input 
                    type="date" 
                    value={testOrderData.expiration_date}
                    onChange={(e) => setTestOrderData({...testOrderData, expiration_date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateTestOrder}>Create Record</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {/* Active Orders Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Active Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active supplier orders found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.product_name || `Product #${order.product_id}`}</h3>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <span>Quantity: {order.quantity}</span>
                              <span>•</span>
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                              <Calendar className="h-4 w-4" />
                              Expected Delivery
                            </div>
                            <div className="font-medium">
                              {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : "Not set"}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => openReceiveDialog(order.id.toString())}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Receive
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order History Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-gray-600" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {receivedOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No order history found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.product_name || `Product #${order.product_id}`}</h3>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <span>Quantity: {order.quantity}</span>
                              <span>•</span>
                              <span className="text-green-600 font-medium capitalize">{order.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                            <Calendar className="h-4 w-4" />
                            Received On
                          </div>
                          <div className="font-medium">
                            {order.received_at ? new Date(order.received_at).toLocaleDateString() : new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <StockAlerts products={lowStockProducts} />
        </div>
      </main>
    </div>
  )
}
