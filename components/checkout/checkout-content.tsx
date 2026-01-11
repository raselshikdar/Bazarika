"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CreditCard, MapPin, Plus, Loader2, CheckCircle2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatPrice } from "@/lib/utils/format"
import type { CartItem, Product, Address, Coupon } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { mutate } from "swr"

interface CheckoutContentProps {
  cartItems: (CartItem & { product: Product })[]
  addresses: Address[]
  userId: string
  userPhone: string | null
  userName: string | null
}

export function CheckoutContent({
  cartItems,
  addresses: initialAddresses,
  userId,
  userPhone,
  userName,
}: CheckoutContentProps) {
  const [addresses, setAddresses] = useState(initialAddresses)
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    initialAddresses.find((a) => a.is_default)?.id || initialAddresses[0]?.id || "",
  )
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [phoneNumber, setPhoneNumber] = useState(userPhone || "")
  const [isSavingPhone, setIsSavingPhone] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const couponData = localStorage.getItem("appliedCoupon")
    if (couponData) {
      try {
        setAppliedCoupon(JSON.parse(couponData))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
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

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingAddress(true)

    try {
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: userId,
          ...newAddress,
          is_default: addresses.length === 0,
        })
        .select()
        .single()

      if (error) throw error

      setAddresses([...addresses, data as Address])
      if (!selectedAddressId) {
        setSelectedAddressId(data.id)
      }
      setShowAddressDialog(false)
      setNewAddress({
        label: "Home",
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        district: "",
        postal_code: "",
      })
      toast({
        title: "Address added",
        description: "Your new address has been saved",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to add address",
        variant: "destructive",
      })
    } finally {
      setIsAddingAddress(false)
    }
  }

  const savePhoneToProfile = async (phone: string): Promise<boolean> => {
    const { error } = await supabase.from("profiles").update({ phone }).eq("id", userId)

    if (error) {
      console.error("[v0] Failed to save phone:", error)
      return false
    }
    return true
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast({
        title: "Address required",
        description: "Please select or add a delivery address",
        variant: "destructive",
      })
      return
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to place an order",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
      if (!selectedAddress) throw new Error("Address not found")

      if (!userPhone && phoneNumber.trim()) {
        const phoneSaved = await savePhoneToProfile(phoneNumber.trim())
        if (!phoneSaved) {
          toast({
            title: "Warning",
            description: "Could not save phone to profile, but order will proceed",
          })
        }
      }

      const orderNum = `BZK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
        Math.random() * 10000,
      )
        .toString()
        .padStart(4, "0")}`

      console.log("[v0] Creating order for user:", userId)
      console.log("[v0] Order data:", { orderNum, subtotal, shipping, discount, total })

      const shippingAddressWithPhone = {
        ...selectedAddress,
        phone: phoneNumber.trim() || selectedAddress.phone,
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNum,
          user_id: userId,
          status: "pending",
          subtotal,
          shipping_cost: shipping,
          discount_amount: discount,
          total,
          shipping_address: shippingAddressWithPhone,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "pending" : "pending",
          coupon_id: appliedCoupon?.id || null,
        })
        .select()
        .single()

      if (orderError) {
        console.error("[v0] Order creation error:", orderError)
        throw orderError
      }

      console.log("[v0] Order created successfully:", order.id, order.order_number)

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        console.error("[v0] Order items error:", itemsError)
        throw itemsError
      }

      console.log("[v0] Order items created:", orderItems.length)

      const { data: cart } = await supabase.from("carts").select("id").eq("user_id", userId).single()

      if (cart) {
        await supabase.from("cart_items").delete().eq("cart_id", cart.id)
      }

      localStorage.removeItem("appliedCoupon")

      mutate("cart-count")

      setOrderNumber(orderNum)
      setOrderSuccess(true)
    } catch (error) {
      console.error("[v0] Order error:", error)
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const [newAddress, setNewAddress] = useState({
    label: "Home",
    full_name: userName || "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    district: "",
    postal_code: "",
  })

  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <CheckCircle2 className="h-16 w-16 text-primary" />
        </div>
        <h2 className="font-bold text-2xl mb-2">Order Placed Successfully!</h2>
        <p className="text-muted-foreground mb-2">Thank you for your order</p>
        <p className="font-mono text-lg mb-6">{orderNumber}</p>
        <p className="text-sm text-muted-foreground mb-8 max-w-md">
          We&apos;ve sent a confirmation email with your order details. You can track your order status in your account.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <a href="/orders">View Orders</a>
          </Button>
          <Button variant="outline" className="bg-transparent" asChild>
            <a href="/">Continue Shopping</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {!userPhone && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Phone Number
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This phone number will be saved to your profile and used for order updates.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </CardTitle>
            <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Plus className="h-4 w-4 mr-1" />
                  Add New
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Address</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAddress} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="label">Label</Label>
                      <Input
                        id="label"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        placeholder="Home, Office, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        placeholder="+880 1XXX-XXXXXX"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newAddress.full_name}
                      onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={newAddress.address_line1}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                      placeholder="Street address"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                    <Input
                      id="address_line2"
                      value={newAddress.address_line2}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        value={newAddress.district}
                        onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code (Optional)</Label>
                    <Input
                      id="postal_code"
                      value={newAddress.postal_code}
                      onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isAddingAddress}>
                    {isAddingAddress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Address"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {addresses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No addresses saved. Please add a delivery address.
              </p>
            ) : (
              <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div key={address.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                      <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{address.label}</span>
                          {address.is_default && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {address.full_name} - {address.phone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.district}
                          {address.postal_code && ` - ${address.postal_code}`}
                        </p>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="cursor-pointer">
                    <span className="font-medium">Cash on Delivery</span>
                    <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 opacity-50">
                  <RadioGroupItem value="sslcommerz" id="sslcommerz" disabled />
                  <Label htmlFor="sslcommerz" className="cursor-not-allowed">
                    <span className="font-medium">SSLCommerz</span>
                    <p className="text-sm text-muted-foreground">Coming soon - Pay with bKash, Nagad, Cards & more</p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={
                        item.product.images?.[0]?.url ||
                        `/placeholder.svg?height=64&width=64&query=${encodeURIComponent(item.product.name) || "/placeholder.svg"}`
                      }
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={isProcessing || !selectedAddressId}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Place Order - ${formatPrice(total)}`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
