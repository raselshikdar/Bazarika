import { createClient } from "@/lib/supabase/server"
import { ProductsTable } from "@/components/admin/products/products-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import type { Product, Category } from "@/types/database"

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false })

  const { data: categories } = await supabase.from("categories").select("id, name").order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductsTable
        products={(products as (Product & { category: { name: string } | null })[]) || []}
        categories={(categories as Pick<Category, "id" | "name">[]) || []}
      />
    </div>
  )
}
