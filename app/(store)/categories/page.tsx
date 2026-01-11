import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import { CategoryCard } from "@/components/ui/category-card"
import type { Category } from "@/types/database"

export const metadata: Metadata = {
  title: "All Categories | Bazarika",
  description: "Browse all product categories",
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Categories</h1>
        <p className="text-muted-foreground">Browse our complete collection of product categories</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {(categories as Category[])?.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {(!categories || categories.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-1">No categories found</h3>
          <p className="text-muted-foreground text-sm">Categories will appear here once they are added.</p>
        </div>
      )}
    </div>
  )
}
