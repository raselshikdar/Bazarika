"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { OrderStatus } from "@/types/database"

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabaseAdmin = createAdminClient()

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("[v0] Failed to get profile:", profileError)
    return { success: false, error: "Failed to verify admin status" }
  }

  if (profile?.role !== "admin") {
    return { success: false, error: "Not authorized" }
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId)

  if (error) {
    console.error("[v0] Failed to update order status:", error)
    return { success: false, error: error.message }
  }

  // Revalidate both admin and user orders pages
  revalidatePath("/admin/orders")
  revalidatePath("/orders")

  return { success: true }
}

export async function getOrderDetails(orderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabaseAdmin = createAdminClient()

  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role === "admin") {
    // Admin can see any order
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "*, order_items(*, product:products(name, images:product_images(url))), profile:profiles(full_name, email, phone)",
      )
      .eq("id", orderId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, order }
  }

  // Regular user can only see their own orders (RLS enforced)
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "*, order_items(*, product:products(name, images:product_images(url))), profile:profiles(full_name, email, phone)",
    )
    .eq("id", orderId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, order }
}
