import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export const dynamic = "force-dynamic"
export const revalidate = 0

const ADMIN_EMAIL = "raselshikdar597@gmail.com"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/admin")
  }

  const isAdmin = user.email === ADMIN_EMAIL
  if (!isAdmin) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <AdminHeader user={user} />
        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  )
}
