import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import { ProductGrid } from "@/components/ui/product-grid"
import { SearchFilters } from "@/components/search/search-filters"
import type { Product } from "@/types/database"
import { Search } from "lucide-react"

interface SearchPageProps {
  searchParams: Promise<{ q?: string; sort?: string; minPrice?: string; maxPrice?: string; category?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Search: ${q} | Bazarika` : "Search | Bazarika",
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, sort, minPrice, maxPrice, category } = await searchParams
  const supabase = await createClient()

  // Fetch categories for filter
  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name")

  // Build query for products
  let query = supabase
    .from("products")
    .select("*, images:product_images(*), category:categories(*)")
    .eq("is_active", true)

  // Apply search query
  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  }

  // Apply category filter
  if (category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", category).single()
    if (cat) {
      query = query.eq("category_id", cat.id)
    }
  }

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{q ? `Results for "${q}"` : "All Products"}</h1>
        </div>
        <p className="text-muted-foreground">{products?.length || 0} products found</p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[250px_1fr] gap-8">
        {/* Filters - collapsible on mobile */}
        <div className="order-2 lg:order-1">
          <SearchFilters categories={categories || []} />
        </div>

        {/* Products */}
        <div className="order-1 lg:order-2">
          <ProductGrid products={(products as Product[]) || []} />
        </div>
      </div>
    </div>
  )
}
