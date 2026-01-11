import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import { CartContent } from "@/components/cart/cart-content"
import type { CartItem, Product } from "@/types/database"

export const metadata: Metadata = {
  title: "Shopping Cart | Bazarika",
  description: "Review your cart items",
}

export default async function CartPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let cartItems: (CartItem & { product: Product })[] = []

  if (user) {
    const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single()

    if (cart) {
      const { data: items } = await supabase
        .from("cart_items")
        .select("*, product:products(*, images:product_images(*))")
        .eq("cart_id", cart.id)

      cartItems = (items as (CartItem & { product: Product })[]) || []
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <CartContent initialItems={cartItems} isLoggedIn={!!user} />
    </div>
  )
}
