"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Eye,
  Search,
  Filter,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import type { Order, OrderStatus } from "@/types/database"
import { useToast } from "@/hooks/use-toast"
import { updateOrderStatus } from "@/app/actions/orders"

interface OrdersTableProps {
  orders: (Order & { profile: { full_name: string; phone: string } | null })[]
}

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  },
  confirmed: {
    label: "Confirmed",
    icon: Package,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  processing: {
    label: "Processing",
    icon: Package,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId)
    try {
      const result = await updateOrderStatus(orderId, newStatus)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Order updated",
        description: `Order status changed to ${statusConfig[newStatus].label}`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const status = statusConfig[order.status]
                const StatusIcon = status.icon
                const isUpdating = updatingOrderId === order.id

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-mono text-sm">{order.order_number}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.profile?.full_name || "Customer"}</p>
                        <p className="text-xs text-muted-foreground">{order.profile?.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Badge className={cn("w-fit", status.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-sm capitalize",
                          order.payment_status === "paid" && "text-green-600",
                          order.payment_status === "pending" && "text-yellow-600",
                        )}
                      >
                        {order.payment_status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isUpdating}>
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.status !== "delivered" && order.status !== "cancelled" && (
                            <>
                              {order.status === "pending" && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "confirmed")}>
                                  <Package className="h-4 w-4 mr-2" />
                                  Confirm Order
                                </DropdownMenuItem>
                              )}
                              {order.status === "confirmed" && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "processing")}>
                                  <Package className="h-4 w-4 mr-2" />
                                  Start Processing
                                </DropdownMenuItem>
                              )}
                              {order.status === "processing" && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "shipped")}>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Mark as Shipped
                                </DropdownMenuItem>
                              )}
                              {order.status === "shipped" && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "delivered")}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark as Delivered
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(order.id, "cancelled")}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Order
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
