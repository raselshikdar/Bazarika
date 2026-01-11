"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, ArrowLeft, Upload, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Product, Category } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { slugify } from "@/lib/utils/format"
import Link from "next/link"
import Image from "next/image"

interface ProductFormProps {
  product?: Product
  categories: Pick<Category, "id" | "name">[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    compare_at_price: product?.compare_at_price?.toString() || "",
    category_id: product?.category_id || "",
    stock_quantity: product?.stock_quantity?.toString() || "0",
    sku: product?.sku || "",
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
  })

  const [existingImages, setExistingImages] = useState<{ id: string; url: string; position: number }[]>(
    product?.images?.map((img) => ({ id: img.id, url: img.url, position: img.position || 0 })) || [],
  )
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      if (message.includes("row-level security") || message.includes("rls") || message.includes("policy")) {
        return "You don't have permission to perform this action. Admin access required."
      }
      if (message.includes("duplicate") || message.includes("unique")) {
        return "A product with this name or slug already exists."
      }
      return error.message
    }
    return "An unexpected error occurred"
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: product ? formData.slug : slugify(name),
    })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter((file) => {
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image file`,
          variant: "destructive",
        })
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewImagePreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })

    setNewImageFiles((prev) => [...prev, ...validFiles])
  }

  const handleRemoveNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index))
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (imageId: string) => {
    setImagesToDelete((prev) => [...prev, imageId])
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const uploadImages = async (productId: string): Promise<void> => {
    if (newImageFiles.length === 0) return

    setIsUploadingImages(true)

    try {
      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i]
        const fileExt = file.name.split(".").pop()
        const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file, { upsert: true })

        if (uploadError) {
          console.error("[v0] Storage upload error:", uploadError)
          throw uploadError
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(fileName)

        console.log("[v0] Image uploaded, public URL:", publicUrlData.publicUrl)

        const { error: dbError } = await supabase.from("product_images").insert({
          product_id: productId,
          url: publicUrlData.publicUrl,
          alt_text: formData.name,
          position: existingImages.length + i, // Use position instead of display_order
          // Removed is_primary - column doesn't exist in schema
        })

        if (dbError) {
          console.error("[v0] DB insert error:", dbError)
          throw dbError
        }

        console.log("[v0] Image record inserted successfully")
      }

      toast({
        title: "Images uploaded",
        description: `${newImageFiles.length} image(s) uploaded successfully`,
      })
    } catch (error) {
      console.error("[v0] Image upload error:", error)
      toast({
        title: "Image upload failed",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsUploadingImages(false)
    }
  }

  const deleteMarkedImages = async (): Promise<void> => {
    if (imagesToDelete.length === 0) return

    try {
      for (const imageId of imagesToDelete) {
        await supabase.from("product_images").delete().eq("id", imageId)
      }
    } catch (error) {
      console.error("[v0] Delete images error:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = {
        name: formData.name,
        slug: formData.slug || slugify(formData.name),
        description: formData.description || null,
        price: Number.parseFloat(formData.price) || 0,
        compare_at_price: formData.compare_at_price ? Number.parseFloat(formData.compare_at_price) : null,
        category_id: formData.category_id || null,
        stock_quantity: Number.parseInt(formData.stock_quantity) || 0,
        sku: formData.sku || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Submitting product data:", data)

      let productId = product?.id

      if (product) {
        const { error } = await supabase.from("products").update(data).eq("id", product.id)
        if (error) {
          console.error("[v0] Product update error:", error.message, error.details, error.hint, error.code)
          throw error
        }
      } else {
        const { data: newProduct, error } = await supabase.from("products").insert(data).select("id").single()
        if (error) {
          console.error("[v0] Product insert error:", error.message, error.details, error.hint, error.code)
          throw error
        }
        productId = newProduct.id
        console.log("[v0] Product created with ID:", productId)
      }

      await deleteMarkedImages()
      if (productId && newImageFiles.length > 0) {
        await uploadImages(productId)
      }

      toast({
        title: product ? "Product updated" : "Product created",
        description: product
          ? "The product has been updated successfully"
          : "The product has been created successfully",
      })

      router.push("/admin/products")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Full product save error:", error)
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1" />
        <Button type="submit" disabled={isSubmitting || isUploadingImages}>
          {isSubmitting || isUploadingImages ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isUploadingImages ? "Uploading images..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Product
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="product-url-slug"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to auto-generate from name</p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Images</Label>
                  <div className="grid grid-cols-4 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={image.url || "/placeholder.svg"}
                            alt="Product image"
                            fill
                            className="object-cover"
                            sizes="150px"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveExistingImage(image.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Image Previews */}
              {newImagePreviews.length > 0 && (
                <div className="space-y-2">
                  <Label>New Images (will be uploaded on save)</Label>
                  <div className="grid grid-cols-4 gap-4">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={preview || "/placeholder.svg"}
                            alt={`New image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="150px"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveNewImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div>
                <Label htmlFor="images">Add Images</Label>
                <div className="mt-2">
                  <label
                    htmlFor="images"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 5MB</p>
                    </div>
                    <Input
                      id="images"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                </div>
              </div>

              {existingImages.length === 0 && newImagePreviews.length === 0 && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mr-2" />
                  <span>No images added yet</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="price">Price (৳)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="compare_at_price">Compare at Price (৳)</Label>
                  <Input
                    id="compare_at_price"
                    type="number"
                    value={formData.compare_at_price}
                    onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Original price for showing discount</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PROD-001"
                  />
                </div>
                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-xs text-muted-foreground">Product is visible in store</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_featured">Featured</Label>
                  <p className="text-xs text-muted-foreground">Show on homepage</p>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
