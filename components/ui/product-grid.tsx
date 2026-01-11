"use client"

import { ProductCard } from "@/components/ui/product-card"
import type { Product } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import useSWR, { mutate } from "swr"

interface ProductGridProps {
  products: Product[]
  onAddToCart?: (productId: string) => void
  onAddToWishlist?: (productId: string) => void
  wishlistIds?: string[]
}

export function ProductGrid({ products, onAddToCart, onAddToWishlist, wishlistIds = [] }: ProductGridProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const { data: user } = useSWR("user", async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  })

  const { data: userWishlistIds = [] } = useSWR(user ? `wishlist-ids-${user.id}` : null, async () => {
    const { data } = await supabase.from("wishlist").select("product_id").eq("user_id", user?.id)
    return data?.map((item) => item.product_id) || []
  })

  const allWishlistIds = [...new Set([...wishlistIds, ...userWishlistIds])]

  const handleAddToCart = async (productId: string) => {
    if (onAddToCart) {
      onAddToCart(productId)
      return
    }

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your cart",
        variant: "destructive",
      })
      return
    }

    try {
      // Get or create cart
      let { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single()

      if (!cart) {
        const { data: newCart } = await supabase.from("carts").insert({ user_id: user.id }).select("id").single()
        cart = newCart
      }

      if (!cart) throw new Error("Could not create cart")

      const product = products.find((p) => p.id === productId)

      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart.id)
        .eq("product_id", productId)
        .single()

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id)
      } else {
        await supabase.from("cart_items").insert({
          cart_id: cart.id,
          product_id: productId,
          quantity: 1,
        })
      }

      mutate("cart-count")
      toast({
        title: "Added to cart",
        description: `${product?.name || "Item"} has been added to your cart`,
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    }
  }

  const handleToggleWishlist = async (productId: string) => {
    if (onAddToWishlist) {
      onAddToWishlist(productId)
      return
    }

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your wishlist",
        variant: "destructive",
      })
      return
    }

    const isInWishlist = allWishlistIds.includes(productId)
    const product = products.find((p) => p.id === productId)

    try {
      if (isInWishlist) {
        await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId)
        toast({
          title: "Removed from wishlist",
          description: `${product?.name || "Item"} has been removed from your wishlist`,
        })
      } else {
        await supabase.from("wishlist").insert({
          user_id: user.id,
          product_id: productId,
        })
        toast({
          title: "Added to wishlist",
          description: `${product?.name || "Item"} has been added to your wishlist`,
        })
      }
      mutate(`wishlist-ids-${user.id}`)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      })
    }
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-lg mb-1">No products found</h3>
        <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleToggleWishlist}
          isInWishlist={allWishlistIds.includes(product.id)}
        />
      ))}
    </div>
  )
}
