import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "@/components/admin/orders/orders-table"
import { redirect } from "next/navigation"
import type { Order } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function AdminOrdersPage() {
  // First verify the user is admin using auth client
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  const supabaseAdmin = createAdminClient()

  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("*, profile:profiles(full_name, phone)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Admin orders fetch error:", error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      <OrdersTable orders={(orders as (Order & { profile: { full_name: string; phone: string } | null })[]) || []} />
    </div>
  )
}
