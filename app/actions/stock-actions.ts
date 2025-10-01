"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function adjustStock(productId: string, newQuantity: number, reason: string) {
  const supabase = await createClient()

  try {
    // Get current stock
    const { data: currentProduct } = await supabase
      .from("products")
      .select("stock_quantity, name")
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
    const { error: movementError } = await supabase.from("stock_movements").insert([
      {
        product_id: productId,
        movement_type: "adjustment",
        quantity: difference,
        notes: reason,
      },
    ])

    if (movementError) {
      console.error("Failed to record stock movement:", movementError)
      // Don't fail the entire operation if movement recording fails
    }

    revalidatePath("/products")
    revalidatePath("/stock")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Stock adjustment error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getStockMovements(filters?: {
  product_id?: string
  movement_type?: string
  start_date?: string
  end_date?: string
}) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from("stock_movements")
      .select(`
        *,
        products (name, barcode),
        profiles (full_name)
      `)
      .order("created_at", { ascending: false })

    if (filters?.product_id) {
      query = query.eq("product_id", filters.product_id)
    }
    if (filters?.movement_type) {
      query = query.eq("movement_type", filters.movement_type)
    }
    if (filters?.start_date) {
      query = query.gte("created_at", filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte("created_at", filters.end_date)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function bulkStockAdjustment(
  adjustments: Array<{
    product_id: string
    new_quantity: number
    reason: string
  }>,
) {
  const supabase = await createClient()

  try {
    const results = []

    for (const adjustment of adjustments) {
      const result = await adjustStock(adjustment.product_id, adjustment.new_quantity, adjustment.reason)
      results.push({ product_id: adjustment.product_id, ...result })
    }

    const failed = results.filter((r) => !r.success)
    if (failed.length > 0) {
      return {
        success: false,
        error: `${failed.length} adjustments failed`,
        details: failed,
      }
    }

    return { success: true, message: `${results.length} stock adjustments completed successfully` }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred during bulk adjustment" }
  }
}
