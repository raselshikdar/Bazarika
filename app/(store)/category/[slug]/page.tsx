import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ProductGrid } from "@/components/ui/product-grid"
import { CategoryFilters } from "@/components/category/category-filters"
import type { Product } from "@/types/database"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; minPrice?: string; maxPrice?: string; page?: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase.from("categories").select("name, description").eq("slug", slug).single()

  if (!category) {
    return {
      title: "Category Not Found | Bazarika",
    }
  }

  return {
    title: `${category.name} | Bazarika`,
    description: category.description || `Shop ${category.name} products at Bazarika`,
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { sort, minPrice, maxPrice } = await searchParams
  const supabase = await createClient()

  // Fetch category
  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).single()

  if (!category) {
    notFound()
  }

  // Build query for products
  let query = supabase
    .from("products")
    .select("*, images:product_images(*)")
    .eq("category_id", category.id)
    .eq("is_active", true)

  // Apply price filters
  if (minPrice) {
    query = query.gte("price", Number.parseFloat(minPrice))
  }
  if (maxPrice) {
    query = query.lte("price", Number.parseFloat(maxPrice))
  }

  // Apply sorting
  switch (sort) {
    case "price-asc":
      query = query.order("price", { ascending: true })
      break
    case "price-desc":
      query = query.order("price", { ascending: false })
      break
    case "name":
      query = query.order("name", { ascending: true })
      break
    case "newest":
    default:
      query = query.order("created_at", { ascending: false })
  }

  const { data: products } = await query

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        {category.description && <p className="text-muted-foreground">{category.description}</p>}
        <p className="text-sm text-muted-foreground mt-2">{products?.length || 0} products found</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        {/* Filters */}
        <CategoryFilters categorySlug={slug} />

        {/* Products */}
        <div>
          <ProductGrid products={(products as Product[]) || []} />
        </div>
      </div>
    </div>
  )
}
