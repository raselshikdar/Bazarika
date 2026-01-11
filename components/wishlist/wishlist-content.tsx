"use client"

import { Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/components/ui/product-grid"
import type { Product } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface WishlistContentProps {
  products: Product[]
}

export function WishlistContent({ products }: WishlistContentProps) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleRemoveFromWishlist = async (productId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId)

    toast({
      title: "Removed from wishlist",
      description: "Item has been removed from your wishlist",
    })

    router.refresh()
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Heart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-xl mb-2">Your wishlist is empty</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Save items you love by clicking the heart icon on any product. They&apos;ll appear here for easy access.
        </p>
        <Button asChild>
          <Link href="/">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Start Shopping
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <ProductGrid
      products={products}
      onAddToWishlist={handleRemoveFromWishlist}
      wishlistIds={products.map((p) => p.id)}
    />
  )
}
