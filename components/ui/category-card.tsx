import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import type { Category } from "@/types/database"

interface CategoryCardProps {
  category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
  const imageUrl =
    category.image_url || `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(category.name)}`

  return (
    <Link href={`/category/${category.slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <CardContent className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-semibold text-white text-lg">{category.name}</h3>
            {category.description && <p className="text-white/80 text-sm line-clamp-1 mt-1">{category.description}</p>}
          </CardContent>
        </div>
      </Card>
    </Link>
  )
}
