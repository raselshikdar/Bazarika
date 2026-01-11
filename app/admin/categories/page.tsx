import { createClient } from "@/lib/supabase/server"
import { CategoriesManager } from "@/components/admin/categories/categories-manager"
import type { Category } from "@/types/database"

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground">Manage product categories</p>
      </div>

      <CategoriesManager categories={(categories as Category[]) || []} />
    </div>
  )
}
