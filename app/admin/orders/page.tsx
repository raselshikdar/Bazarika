import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "@/components/admin/orders/orders-table"
import { redirect } from "next/navigation"
import type { Order } from "@/types/database"

export const dynamic = "force-dynamic"
export const revalidate = 0

type OrderWithProfile = Order & { profile: { full_name: string; phone: string } | null }

export default async function AdminOrdersPage() {
  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (ordersError) {
    console.error("[v0] Admin orders fetch error:", ordersError)
  }

  const userIds = orders?.map((o) => o.user_id).filter(Boolean) || []
  const uniqueUserIds = [...new Set(userIds)]

  let profilesMap: Record<string, { full_name: string; phone: string }> = {}

  if (uniqueUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", uniqueUserIds)

    if (profilesError) {
      console.error("[v0] Profiles fetch error:", profilesError)
    }

    if (profiles) {
      profilesMap = profiles.reduce(
        (acc, p) => {
          acc[p.id] = { full_name: p.full_name || "", phone: p.phone || "" }
          return acc
        },
        {} as Record<string, { full_name: string; phone: string }>,
      )
    }
  }

  const ordersWithProfiles: OrderWithProfile[] = (orders || []).map((order) => ({
    ...order,
    profile: profilesMap[order.user_id] || null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      <OrdersTable orders={ordersWithProfiles} />
    </div>
  )
}
