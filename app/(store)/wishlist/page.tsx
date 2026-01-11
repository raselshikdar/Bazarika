import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { WishlistContent } from "@/components/wishlist/wishlist-content"
import type { Product } from "@/types/database"

export const metadata: Metadata = {
  title: "Wishlist | Bazarika",
  description: "Your saved items",
}

export default async function WishlistPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/wishlist")
  }

  const { data: wishlistItems } = await supabase
    .from("wishlist")
    .select("*, product:products(*, images:product_images(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const products = (wishlistItems?.map((item) => item.product) || []) as Product[]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
      <WishlistContent products={products} />
    </div>
  )
}
