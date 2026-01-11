"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, X, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils/format"
import type { CartItem, Product, Coupon } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { mutate } from "swr"

interface CartContentProps {
  initialItems: (CartItem & { product: Product })[]
  isLoggedIn: boolean
}

export function CartContent({ initialItems, isLoggedIn }: CartContentProps) {
  const [items, setItems] = useState(initialItems)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [couponCode, setCouponCode] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const savedCoupon = localStorage.getItem("appliedCoupon")
    if (savedCoupon) {
      try {
        const coupon = JSON.parse(savedCoupon) as Coupon
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          localStorage.removeItem("appliedCoupon")
        } else {
          setAppliedCoupon(coupon)
          setCouponCode(coupon.code)
        }
      } catch {
        localStorage.removeItem("appliedCoupon")
      }
    }
  }, [])

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = subtotal >= 2000 ? 0 : 100

  let discount = 0
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discount = (subtotal * appliedCoupon.discount_value) / 100
      if (appliedCoupon.max_discount_amount && discount > appliedCoupon.max_discount_amount) {
        discount = appliedCoupon.max_discount_amount
      }
    } else {
      discount = appliedCoupon.discount_value
    }
  }

  const total = subtotal + shipping - discount

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    const item = items.find((i) => i.id === itemId)
    if (!item || newQuantity > item.product.stock_quantity) {
      toast({
        title: "Error",
        description: "Not enough stock available",
        variant: "destructive",
      })
      return
    }

    setUpdatingIds((prev) => new Set(prev).add(itemId))

    try {
      await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", itemId)

      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)))
      await mutate("/cart-items")
    } catch {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      })
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdatingIds((prev) => new Set(prev).add(itemId))

    try {
      await supabase.from("cart_items").delete().eq("id", itemId)

      setItems((prev) => prev.filter((i) => i.id !== itemId))
      await mutate("/cart-items")
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      })
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setIsApplyingCoupon(true)

    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .single()

      if (error || !coupon) {
        toast({
          title: "Invalid coupon",
          description: "This coupon code is not valid",
          variant: "destructive",
        })
        return
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast({
          title: "Coupon expired",
          description: "This coupon has expired",
          variant: "destructive",
        })
        return
      }

      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        toast({
          title: "Minimum order not met",
          description: `Minimum order of ${formatPrice(coupon.min_order_amount)} required`,
          variant: "destructive",
        })
        return
      }

      setAppliedCoupon(coupon as Coupon)
      localStorage.setItem("appliedCoupon", JSON.stringify(coupon))

      toast({
        title: "Coupon applied!",
        description: `You saved ${coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : formatPrice(coupon.discount_value)}`,
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to apply coupon",
        variant: "destructive",
      })
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    localStorage.removeItem("appliedCoupon")
    toast({
      title: "Coupon removed",
      description: "The coupon has been removed from your order",
    })
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-xl mb-2">Sign in to view your cart</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Please sign in to add items to your cart and complete your purchase.
        </p>
        <Button asChild>
          <Link href="/login?redirect=/cart">Sign In</Link>
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-xl mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Looks like you haven&apos;t added any items to your cart yet.
        </p>
        <Button asChild>
          <Link href="/">
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => {
          const imageUrl =
            item.product.images?.[0]?.url ||
            `/placeholder.svg?height=120&width=120&query=${encodeURIComponent(item.product.name)}`
          const isUpdating = updatingIds.has(item.id)

          return (
            <Card key={item.id} className={isUpdating ? "opacity-50" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Link href={`/product/${item.product.slug}`} className="flex-shrink-0">
                    <div className="relative h-24 w-24 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between">
                      <div>
                        <Link href={`/product/${item.product.slug}`} className="font-medium hover:text-primary">
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">{formatPrice(item.product.price)} each</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={isUpdating}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUpdating}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock_quantity || isUpdating}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Order Summary */}
      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            {shipping > 0 && <p className="text-xs text-muted-foreground">Free shipping for orders above ৳2000</p>}
            {appliedCoupon && discount > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Discount ({appliedCoupon.code})
                </span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="pt-4">
              <p className="text-sm font-medium mb-2">Have a coupon?</p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">{appliedCoupon.code}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveCoupon}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="uppercase"
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    className="bg-transparent"
                  >
                    {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button className="w-full" size="lg" asChild>
              <Link href="/checkout">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
