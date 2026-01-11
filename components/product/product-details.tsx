"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Minus, Plus, ShoppingCart, Share2, Truck, Shield, RefreshCcw, Star, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils/format"
import type { Product } from "@/types/database"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import useSWR, { mutate } from "swr"

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const { toast } = useToast()

  const supabase = createClient()

  // Check if user is logged in
  const { data: user } = useSWR("user", async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  })

  // Check if in wishlist
  const { data: isInWishlist } = useSWR(user ? `wishlist-${product.id}` : null, async () => {
    const { data } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", user?.id)
      .eq("product_id", product.id)
      .single()
    return !!data
  })

  const images = product.images?.length
    ? product.images.sort((a, b) => a.position - b.position)
    : [
        {
          url: `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(product.name)}`,
          alt_text: product.name,
        },
      ]

  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : 0

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your cart",
        variant: "destructive",
      })
      return
    }

    setIsAddingToCart(true)

    try {
      // Get or create cart
      let { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single()

      if (!cart) {
        const { data: newCart } = await supabase.from("carts").insert({ user_id: user.id }).select("id").single()
        cart = newCart
      }

      if (!cart) throw new Error("Could not create cart")

      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart.id)
        .eq("product_id", product.id)
        .single()

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id)
      } else {
        await supabase.from("cart_items").insert({
          cart_id: cart.id,
          product_id: product.id,
          quantity,
        })
      }

      await mutate("cart-count")

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      })
    } catch (err) {
      console.error("[v0] Add to cart error:", err)
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleWishlist = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your wishlist",
        variant: "destructive",
      })
      return
    }

    setIsAddingToWishlist(true)

    try {
      if (isInWishlist) {
        await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", product.id)
        toast({
          title: "Removed from wishlist",
          description: `${product.name} has been removed from your wishlist`,
        })
      } else {
        await supabase.from("wishlist").insert({
          user_id: user.id,
          product_id: product.id,
        })
        toast({
          title: "Added to wishlist",
          description: `${product.name} has been added to your wishlist`,
        })
      }
      mutate(`wishlist-${product.id}`)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      })
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        text: product.description || "",
        url: window.location.href,
      })
    } catch {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Product link has been copied to clipboard",
      })
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 overflow-x-hidden">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={images[selectedImage].url || "/placeholder.svg"}
            alt={images[selectedImage].alt_text || product.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {discount > 0 && (
            <Badge className="absolute top-4 left-4 bg-amber-500 text-white text-lg px-3 py-1">-{discount}%</Badge>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                  selectedImage === index ? "border-primary" : "border-transparent hover:border-muted-foreground/50",
                )}
              >
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt={image.alt_text || `${product.name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col max-w-full overflow-hidden">
        {/* Breadcrumb */}
        {product.category && (
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 overflow-hidden min-w-0">
            <Link href="/" className="hover:text-foreground flex-shrink-0">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link href={`/category/${product.category.slug}`} className="hover:text-foreground flex-shrink-0">
              {product.category.name}
            </Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="text-foreground truncate">{product.name}</span>
          </nav>
        )}

        <h1
          className="text-2xl md:text-3xl font-bold mb-4 text-balance break-words max-w-full overflow-wrap-anywhere"
          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
        >
          {product.name}
        </h1>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">(0 reviews)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xl text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-muted-foreground mb-6 text-pretty break-words">{product.description}</p>
        )}

        {/* Stock Status */}
        <div className="mb-6">
          {product.stock_quantity > 0 ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              In Stock ({product.stock_quantity} available)
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Quantity & Add to Cart */}
        {product.stock_quantity > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                disabled={quantity >= product.stock_quantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="flex-1 sm:max-w-xs h-12 py-3 text-base"
              size="lg"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Button
            variant="outline"
            onClick={handleToggleWishlist}
            disabled={isAddingToWishlist}
            className={cn(isInWishlist && "text-destructive border-destructive")}
          >
            <Heart className={cn("mr-2 h-4 w-4", isInWishlist && "fill-current")} />
            {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Features */}
        <div className="grid gap-4 border-t pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Free Delivery</h4>
              <p className="text-sm text-muted-foreground">For orders above ৳2000</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Easy Returns</h4>
              <p className="text-sm text-muted-foreground">7 days return policy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Secure Payment</h4>
              <p className="text-sm text-muted-foreground">100% secure checkout</p>
            </div>
          </div>
        </div>

        {/* SKU */}
        {product.sku && (
          <p className="text-sm text-muted-foreground mt-6">
            SKU: <span className="font-mono">{product.sku}</span>
          </p>
        )}
      </div>
    </div>
  )
}
