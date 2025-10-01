"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createProduct(formData: {
  name: string
  description?: string
  barcode: string
  price: number
  stock_quantity: number
  min_stock_level: number
  category_id?: string
  supplier_id?: string
  expiration_date: string
  batch_number?: string
  anvisa_label: string
  requires_prescription: boolean
  max_quantity_per_sale?: number | null
}) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: formData.name,
          description: formData.description || null,
          barcode: formData.barcode,
          price: formData.price,
          stock_quantity: formData.stock_quantity,
          min_stock_level: formData.min_stock_level,
          category_id: formData.category_id || null,
          supplier_id: formData.supplier_id || null,
          expiration_date: formData.expiration_date,
          batch_number: formData.batch_number || null,
          anvisa_label: formData.anvisa_label,
          requires_prescription: formData.requires_prescription,
          max_quantity_per_sale: formData.max_quantity_per_sale,
          is_active: true,
        },
      ])
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Create initial stock movement record
    if (formData.stock_quantity > 0) {
      await supabase.from("stock_movements").insert([
        {
          product_id: data.id,
          movement_type: "adjustment",
          quantity: formData.stock_quantity,
          notes: "Initial stock entry",
        },
      ])
    }

    revalidatePath("/products")
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updateProductStock(productId: string, newQuantity: number, reason: string) {
  const supabase = await createClient()

  try {
    // Get current stock
    const { data: currentProduct } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single()

    if (!currentProduct) {
      return { success: false, error: "Product not found" }
    }

    const difference = newQuantity - currentProduct.stock_quantity

    // Update product stock
    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Record stock movement
    await supabase.from("stock_movements").insert([
      {
        product_id: productId,
        movement_type: "adjustment",
        quantity: difference,
        notes: reason,
      },
    ])

    revalidatePath("/products")
    return { success: true }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" }
  }
}
