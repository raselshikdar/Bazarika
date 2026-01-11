"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitReview(formData: {
  productId: string
  rating: number
  title: string
  comment: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to submit a review" }
  }

  console.log("[v0] Server action: submitting review for product:", formData.productId, "user:", user.id)

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      product_id: formData.productId,
      user_id: user.id,
      rating: formData.rating,
      title: formData.title || null,
      comment: formData.comment || null,
    })
    .select()

  if (error) {
    console.error("[v0] Server action: Error submitting review:", error.message, error.details, error.hint)
    return { error: error.message }
  }

  console.log("[v0] Server action: Review inserted successfully:", data)

  revalidatePath(`/product/[slug]`, "page")

  return { success: true }
}
