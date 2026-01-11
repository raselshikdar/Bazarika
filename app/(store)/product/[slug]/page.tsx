import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ProductDetails } from "@/components/product/product-details"
import { ProductReviews } from "@/components/product/product-reviews"
import { RelatedProducts } from "@/components/product/related-products"
import type { Product, Review } from "@/types/database"

export const dynamic = "force-dynamic"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!product) {
    return {
      title: "Product Not Found | Bazarika",
    }
  }

  return {
    title: `${product.name} | Bazarika`,
    description: product.description || `Shop ${product.name} at the best price on Bazarika`,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch product with images
  const { data: product } = await supabase
    .from("products")
    .select("*, images:product_images(*), category:categories(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!product) {
    notFound()
  }

  // Fetch reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profile:profiles(full_name)")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })

  // Fetch related products
  const { data: relatedProducts } = await supabase
    .from("products")
    .select("*, images:product_images(*)")
    .eq("category_id", product.category_id)
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(4)

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetails product={product as Product} />

      <div className="mt-16">
        <ProductReviews productId={product.id} reviews={(reviews as Review[]) || []} />
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-16">
          <RelatedProducts products={relatedProducts as Product[]} />
        </div>
      )}
    </div>
  )
}
