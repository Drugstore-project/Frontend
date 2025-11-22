"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProductList } from "@/components/products/product-list"
import { ProductRegistration } from "@/components/products/product-registration"
import { StockAlerts } from "@/components/stock/stock-alerts"
import { ExpirationAlerts } from "@/components/expiration/expiration-alerts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth-service"
import { apiService } from "@/lib/api-service"

export default function ProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])

  const fetchProducts = async () => {
    try {
      console.log("Fetching products from API...");
      const productsData = await apiService.getProducts()
      console.log("Raw products data:", productsData);
      
      setProducts(productsData.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        barcode: p.barcode || "N/A",
        price: p.price,
        stock_quantity: p.stock_quantity,
        category: p.category || "General",
        anvisa_label: p.stripe || "over-the-counter",
        requires_prescription: p.requires_prescription,
        expiration_date: p.validity,
        min_stock_level: 5 // Default value
      })))
    } catch (error: any) {
      console.error("Failed to fetch data", error)
      setError(error.message || "An error occurred while fetching data")
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const token = authService.getToken()
      if (!token) {
        router.push("/auth/login")
        return
      }
      
      try {
        const userData = await authService.getMe(token)
        
        // Default fallback if role is missing or numeric
        userData.role = userData.role || 'staff';

        setUser(userData)
        await fetchProducts()
      } catch (error: any) {
        console.error("Failed to fetch data", error)
        setError(error.message || "An error occurred while fetching data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-red-600 text-xl font-bold mb-4">Error Loading Data</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Predefined categories for the frontend since backend stores them as strings
  const categories = [
    {
      id: "analgesics",
      name: "Analgesics (Pain Relievers)",
      anvisa_label: "over-the-counter",
      requires_prescription: false
    },
    {
      id: "antibiotics",
      name: "Antibiotics",
      anvisa_label: "red-label",
      requires_prescription: true
    },
    {
      id: "antidepressants",
      name: "Antidepressants (Controlled)",
      anvisa_label: "black-label",
      requires_prescription: true,
      max_quantity_per_sale: 2
    },
    {
      id: "vitamins",
      name: "Vitamins & Supplements",
      anvisa_label: "over-the-counter",
      requires_prescription: false
    },
    {
      id: "anti-inflammatory",
      name: "Anti-inflammatory",
      anvisa_label: "red-label",
      requires_prescription: true
    },
    {
      id: "hygiene",
      name: "Personal Hygiene",
      anvisa_label: "over-the-counter",
      requires_prescription: false
    }
  ]

  const suppliers = [
    { id: "sup1", name: "PharmaDistributor Inc." },
    { id: "sup2", name: "MedSupply Co." },
    { id: "sup3", name: "Global Health Logistics" }
  ]
  
  const lowStockProducts = products
    .filter(p => p.stock_quantity <= p.min_stock_level)
    .map(p => ({
      product_id: p.id,
      product_name: p.name,
      current_stock: p.stock_quantity,
      min_stock_level: p.min_stock_level
    }))
  
  const expiringProducts = products
    .filter(p => {
      const expDate = new Date(p.expiration_date)
      const today = new Date()
      const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiration <= 30
    })
    .map(p => {
      const expDate = new Date(p.expiration_date)
      const today = new Date()
      const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        product_id: p.id,
        product_name: p.name,
        expiration_date: p.expiration_date,
        days_until_expiration: daysUntilExpiration
      }
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
          <p className="text-gray-600">Manage medications with Anvisa compliance and stock control</p>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="list">Products</TabsTrigger>
            <TabsTrigger value="register">Add Product</TabsTrigger>
            <TabsTrigger value="stock-alerts">Stock Alerts</TabsTrigger>
            <TabsTrigger value="expiration">Expiration</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <ProductList products={products} />
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <ProductRegistration 
              categories={categories} 
              suppliers={suppliers} 
              onSuccess={() => {
                fetchProducts()
                // Optional: Switch back to list tab if you want
                // document.querySelector('[value="list"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              }}
            />
          </TabsContent>

          <TabsContent value="stock-alerts" className="space-y-6">
            <StockAlerts products={lowStockProducts} />
          </TabsContent>

          <TabsContent value="expiration" className="space-y-6">
            <ExpirationAlerts products={expiringProducts} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
