import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { OrdersList } from "@/components/orders/orders-list"
import type { Order } from "@/types/database"

export const metadata: Metadata = {
  title: "My Orders | Bazarika",
  description: "View your order history",
}

export default async function OrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/orders")
  }

  console.log("[v0] Fetching orders for user:", user.id)

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Orders fetch error:", error.message, error.details, error.hint)
  }

  console.log("[v0] Orders found:", orders?.length || 0)

  return (
    <div className="container mx-auto px-4 py-8 overflow-x-hidden">
      <h1 className="text-3xl font-bold mb-8 break-words">My Orders</h1>
      <OrdersList orders={(orders as Order[]) || []} />
    </div>
  )
}
