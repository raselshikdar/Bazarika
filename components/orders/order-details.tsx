"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, XCircle, MapPin, CreditCard, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatPrice, formatDateTime } from "@/lib/utils/format"
import type { Order, OrderItem, OrderStatus, Address } from "@/types/database"
import { cn } from "@/lib/utils"

interface OrderDetailsProps {
  order: Order & { items: OrderItem[] }
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

const statusSteps: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"]

export function OrderDetails({ order }: OrderDetailsProps) {
  const status = statusConfig[order.status]
  const StatusIcon = status.icon
  const shippingAddress = order.shipping_address as Address

  const currentStepIndex = statusSteps.indexOf(order.status)
  const isCancelled = order.status === "cancelled"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 -ml-4">
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="text-muted-foreground">Placed on {formatDateTime(order.created_at)}</p>
        </div>
        <Badge className={cn("w-fit h-fit text-sm px-3 py-1", status.color)}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {status.label}
        </Badge>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => {
                const stepStatus = statusConfig[step]
                const StepIcon = stepStatus.icon
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex

                return (
                  <div key={step} className="flex flex-col items-center relative flex-1">
                    {index > 0 && (
                      <div
                        className={cn(
                          "absolute right-1/2 w-full h-0.5 top-4 -translate-y-1/2",
                          index <= currentStepIndex ? "bg-primary" : "bg-muted",
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                        isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <span
                      className={cn("mt-2 text-xs text-center", isCurrent ? "font-medium" : "text-muted-foreground")}
                    >
                      {stepStatus.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item: OrderItem & { product?: { slug: string; images?: { url: string }[] } }) => (
                  <div key={item.id} className="flex gap-4">
                    <Link href={item.product?.slug ? `/product/${item.product.slug}` : "#"} className="flex-shrink-0">
                      <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={
                            item.product?.images?.[0]?.url ||
                            `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(item.product_name) || "/placeholder.svg"}`
                          }
                          alt={item.product_name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    </Link>
                    <div className="flex-1">
                      <Link
                        href={item.product?.slug ? `/product/${item.product.slug}` : "#"}
                        className="font-medium hover:text-primary"
                      >
                        {item.product_name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.product_price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.total)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Details */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping_cost === 0 ? "Free" : formatPrice(order.shipping_cost)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{shippingAddress.full_name}</p>
              <p className="text-sm text-muted-foreground">{shippingAddress.phone}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {shippingAddress.address_line1}
                {shippingAddress.address_line2 && <>, {shippingAddress.address_line2}</>}
              </p>
              <p className="text-sm text-muted-foreground">
                {shippingAddress.city}, {shippingAddress.district}
                {shippingAddress.postal_code && ` - ${shippingAddress.postal_code}`}
              </p>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium capitalize">
                {order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method}
              </p>
              <p className="text-sm text-muted-foreground">
                Status:{" "}
                <span
                  className={cn(
                    "font-medium",
                    order.payment_status === "paid" && "text-green-600",
                    order.payment_status === "pending" && "text-yellow-600",
                    order.payment_status === "failed" && "text-red-600",
                  )}
                >
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
