import { createClient } from "@/lib/supabase/server"
import { CouponsManager } from "@/components/admin/coupons/coupons-manager"
import type { Coupon } from "@/types/database"

export default async function AdminCouponsPage() {
  const supabase = await createClient()

  const { data: coupons } = await supabase.from("coupons").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coupons</h1>
        <p className="text-muted-foreground">Manage discount coupons</p>
      </div>

      <CouponsManager coupons={(coupons as Coupon[]) || []} />
    </div>
  )
}
