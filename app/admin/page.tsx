import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react"
import { formatPrice } from "@/lib/utils/format"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get stats
  const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true })

  const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true })

  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  // Calculate total revenue
  const { data: orders } = await supabase.from("orders").select("total").not("status", "eq", "cancelled")

  const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, profile:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get low stock products
  const { data: lowStockProducts } = await supabase
    .from("products")
    .select("id, name, stock_quantity")
    .lt("stock_quantity", 10)
    .eq("is_active", true)
    .order("stock_quantity")
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Bazarika Admin Panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From {totalOrders} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders || 0} pending
              {(pendingOrders || 0) > 0 && <span className="text-yellow-600 ml-1">• Needs attention</span>}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(lowStockProducts?.length || 0) > 0 && (
                <span className="text-red-600">{lowStockProducts?.length} low stock</span>
              )}
              {(lowStockProducts?.length || 0) === 0 && "All stocked"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from customers</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="bg-transparent">
              <Link href="/admin/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium font-mono text-sm">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {(order.profile as { full_name: string })?.full_name || "Customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total)}</p>
                      <p
                        className={`text-xs capitalize ${
                          order.status === "pending"
                            ? "text-yellow-600"
                            : order.status === "delivered"
                              ? "text-green-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Low Stock Alert</CardTitle>
              <CardDescription>Products that need restocking</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="bg-transparent">
              <Link href="/admin/products">Manage Products</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate flex-1 mr-4">{product.name}</p>
                    <span
                      className={`text-sm font-medium ${
                        product.stock_quantity === 0
                          ? "text-red-600"
                          : product.stock_quantity < 5
                            ? "text-orange-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {product.stock_quantity} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">All products are well stocked</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
