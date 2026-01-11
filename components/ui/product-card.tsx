"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils/format"
import type { Product } from "@/types/database"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
  onAddToWishlist?: (productId: string) => void
  isInWishlist?: boolean
}

export function ProductCard({ product, onAddToCart, onAddToWishlist, isInWishlist = false }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist)
  const [imageError, setImageError] = useState(false)

  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : 0

  const imageUrl =
    product.images?.[0]?.url || `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(product.name)}`

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    onAddToWishlist?.(product.id)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(product.id)
  }

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={
              imageError ? `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(product.name)}` : imageUrl
            }
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && <Badge className="bg-amber-500 text-white">-{discount}%</Badge>}
            {product.is_featured && <Badge className="bg-primary">Featured</Badge>}
            {product.stock_quantity === 0 && (
              <Badge variant="secondary" className="bg-muted-foreground text-muted">
                Out of Stock
              </Badge>
            )}
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
              onClick={handleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("h-4 w-4", isWishlisted && "fill-destructive text-destructive")} />
            </Button>
          </div>

          {/* Add to cart overlay */}
          {product.stock_quantity > 0 && (
            <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button className="w-full" size="sm" onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-medium line-clamp-2 mb-2 text-sm group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating placeholder */}
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs text-muted-foreground ml-1">(0)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{formatPrice(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
