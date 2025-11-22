import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Package, Users, BarChart3, AlertTriangle, Truck } from "lucide-react"
import Link from "next/link"

interface QuickActionsProps {
  userRole: string
}

export function QuickActions({ userRole }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button asChild className="w-full justify-start" variant="default">
          <Link href="/sales/new">
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Link>
        </Button>

        {["manager", "owner"].includes(userRole) && (
          <Button asChild className="w-full justify-start" variant="outline">
            <Link href="/clients">
              <Users className="h-4 w-4 mr-2" />
              Manage Clients
            </Link>
          </Button>
        )}

        <Button asChild className="w-full justify-start" variant="outline">
          <Link href="/products">
            <Package className="h-4 w-4 mr-2" />
            View Inventory
          </Link>
        </Button>

        <Button asChild className="w-full justify-start" variant="outline">
          <Link href="/orders">
            <Truck className="h-4 w-4 mr-2" />
            Supplier Orders
          </Link>
        </Button>

        <Button asChild className="w-full justify-start" variant="outline">
          <Link href="/reports">
            <BarChart3 className="h-4 w-4 mr-2" />
            Sales Reports
          </Link>
        </Button>

        {userRole === "admin" && (
          <>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/staff">
                <Users className="h-4 w-4 mr-2" />
                Manage Staff
              </Link>
            </Button>

            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/alerts">
                <AlertTriangle className="h-4 w-4 mr-2" />
                System Alerts
              </Link>
            </Button>
          </>
        )}

        {userRole === "owner" && (
          <>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/staff">
                <Users className="h-4 w-4 mr-2" />
                Manage Staff
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
