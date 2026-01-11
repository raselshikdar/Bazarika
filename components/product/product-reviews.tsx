"use client"

import type React from "react"

import { useState } from "react"
import { Star, MessageSquare, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils/format"
import type { Review } from "@/types/database"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"
import { submitReview } from "@/app/actions/submit-review"
import { useRouter } from "next/navigation"

interface ProductReviewsProps {
  productId: string
  reviews: Review[]
}

export function ProductReviews({ productId, reviews: initialReviews }: ProductReviewsProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const supabase = createClient()

  const { data: user } = useSWR("user", async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  })

  const { data: reviews = initialReviews, mutate: mutateReviews } = useSWR(
    `reviews-${productId}`,
    async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profile:profiles(full_name)")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Reviews fetch error:", error)
      }
      return (data as Review[]) || initialReviews
    },
    {
      fallbackData: initialReviews,
      revalidateOnMount: true,
      dedupingInterval: 0,
    },
  )

  const hasReviewed = reviews.some((r) => r.user_id === user?.id)

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }))

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to leave a review",
        variant: "destructive",
      })
      return
    }

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitReview({
        productId,
        rating,
        title: "",
        comment: comment.trim(),
      })

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
        variant: "success",
      })

      setRating(0)
      setComment("")

      await mutateReviews(undefined, { revalidate: true })
      router.refresh()
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Customer Reviews</h2>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Rating Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
              <div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
              </div>
            </div>

            <div className="space-y-2">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-3 text-sm">{star}</span>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="w-8 text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Write Review */}
        {user && !hasReviewed && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Write a Review</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1"
                        disabled={isSubmitting}
                      >
                        <Star
                          className={cn(
                            "h-8 w-8 transition-colors",
                            (hoverRating || rating) >= star
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground hover:text-amber-200",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium mb-2">
                    Your Review (Optional)
                  </label>
                  <Textarea
                    id="comment"
                    placeholder="Share your experience with this product..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card className="lg:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Sign in to leave a review</p>
              <Button asChild>
                <a href="/login">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {user && hasReviewed && (
          <Card className="lg:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-amber-400 fill-amber-400 mb-4" />
              <p className="text-muted-foreground">You have already reviewed this product</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {(review.profile as { full_name: string })?.full_name || "Customer"}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                                )}
                              />
                            ))}
                          </div>
                          {review.is_verified_purchase && (
                            <span className="text-xs text-green-600 font-medium">Verified Purchase</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{formatDate(review.created_at)}</span>
                    </div>
                    {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
