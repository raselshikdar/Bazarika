"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Cart, CartItem, Product } from "@/types/database"

interface CartWithItems extends Cart {
  items: (CartItem & { product: Product })[]
}

export function useCart() {
  const [cart, setCart] = useState<CartWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false) // Track mount state
  const [supabase] = useState(() => createClient()) // Memoize client

  useEffect(() => {
    setMounted(true)
  }, [])

  const getSessionId = useCallback(() => {
    if (typeof window === "undefined") return null
    let sessionId = localStorage.getItem("cart_session_id")
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem("cart_session_id", sessionId)
    }
    return sessionId
  }, [])

  const fetchCart = useCallback(async () => {
    if (!mounted) return

    setLoading(true)
    try {
      let user = null
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!error && data.user) {
          user = data.user
        }
      } catch {
        // Auth failed - continue as anonymous
      }

      const sessionId = getSessionId()

      let query = supabase.from("carts").select(`
          *,
          items:cart_items(
            *,
            product:products(*, images:product_images(*))
          )
        `)

      if (user) {
        query = query.eq("user_id", user.id)
      } else if (sessionId) {
        query = query.eq("session_id", sessionId)
      } else {
        // No user and no session - no cart
        setCart(null)
        setLoading(false)
        return
      }

      const { data } = await query.maybeSingle()
      setCart(data as CartWithItems | null)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [supabase, getSessionId, mounted])

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      let user = null
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!error && data.user) {
          user = data.user
        }
      } catch {
        // Continue as anonymous
      }

      const sessionId = getSessionId()

      // Get or create cart
      let cartId = cart?.id

      if (!cartId) {
        const { data: newCart, error } = await supabase
          .from("carts")
          .insert({
            user_id: user?.id || null,
            session_id: user ? null : sessionId,
          })
          .select()
          .single()

        if (error) throw error
        cartId = newCart.id
      }

      // Check if item already exists
      const existingItem = cart?.items?.find((item) => item.product_id === productId)

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id)
      } else {
        await supabase.from("cart_items").insert({
          cart_id: cartId,
          product_id: productId,
          quantity,
        })
      }

      await fetchCart()
    },
    [supabase, cart, fetchCart, getSessionId],
  )

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) {
        await removeItem(itemId)
        return
      }

      await supabase.from("cart_items").update({ quantity }).eq("id", itemId)

      await fetchCart()
    },
    [supabase, fetchCart],
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      await supabase.from("cart_items").delete().eq("id", itemId)

      await fetchCart()
    },
    [supabase, fetchCart],
  )

  const clearCart = useCallback(async () => {
    if (!cart) return

    await supabase.from("cart_items").delete().eq("cart_id", cart.id)

    await fetchCart()
  }, [supabase, cart, fetchCart])

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const subtotal = cart?.items?.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || 0

  useEffect(() => {
    if (mounted) {
      fetchCart()
    }
  }, [fetchCart, mounted])

  return {
    cart,
    loading,
    itemCount,
    subtotal,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
  }
}
