import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { CheckoutContent } from "@/components/checkout/checkout-content"
import type { CartItem, Product, Address } from "@/types/database"

export const metadata: Metadata = {
  title: "Checkout | Bazarika",
  description: "Complete your purchase",
}

export default async function CheckoutPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/checkout")
  }

  // Get cart items
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single()

  if (!cart) {
    redirect("/cart")
  }

  const { data: items } = await supabase
    .from("cart_items")
    .select("*, product:products(*, images:product_images(*))")
    .eq("cart_id", cart.id)

  const cartItems = (items as (CartItem & { product: Product })[]) || []

  if (cartItems.length === 0) {
    redirect("/cart")
  }

  // Get user addresses
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })

  const { data: profile } = await supabase.from("profiles").select("phone, full_name").eq("id", user.id).single()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <CheckoutContent
        cartItems={cartItems}
        addresses={(addresses as Address[]) || []}
        userId={user.id}
        userPhone={profile?.phone || null}
        userName={profile?.full_name || null}
      />
    </div>
  )
}
