import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/admin/products/product-form"
import type { Category } from "@/types/database"

export default async function NewProductPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("categories").select("id, name").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground">Create a new product for your store</p>
      </div>

      <ProductForm categories={(categories as Pick<Category, "id" | "name">[]) || []} />
    </div>
  )
}
