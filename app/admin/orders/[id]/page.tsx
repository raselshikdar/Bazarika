import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !order) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Order {order.order_number}
      </h1>

      <pre className="bg-muted p-4 rounded">
        {JSON.stringify(order, null, 2)}
      </pre>
    </div>
  )
}
