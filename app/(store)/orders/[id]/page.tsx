import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import type { Metadata } from "next"
import { OrderDetails } from "@/components/orders/order-details"
import type { Order, OrderItem } from "@/types/database"

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase.from("orders").select("order_number").eq("id", id).single()

  return {
    title: order ? `Order ${order.order_number} | Bazarika` : "Order Details | Bazarika",
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/orders")
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*, product:products(slug, images:product_images(*)))")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!order) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <OrderDetails order={order as Order & { items: OrderItem[] }} />
    </div>
  )
}
