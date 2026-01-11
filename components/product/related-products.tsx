import { ProductGrid } from "@/components/ui/product-grid"
import type { Product } from "@/types/database"

interface RelatedProductsProps {
  products: Product[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <ProductGrid products={products} />
    </div>
  )
}
