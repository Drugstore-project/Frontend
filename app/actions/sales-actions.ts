"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface SaleItem {
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  discount_applied: number
}

export async function createSale(saleData: {
  client_id?: string | null
  seller_id: string
  payment_method_id: string
  items: SaleItem[]
  total_amount: number
  discount_amount: number
  final_amount: number
  prescription_required: boolean
  prescription_file?: File | null
}) {
  const supabase = await createClient()

  try {
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Upload prescription file if provided
    let prescriptionUrl = null
    if (saleData.prescription_file) {
      const fileName = `prescriptions/${invoiceNumber}-${saleData.prescription_file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(fileName, saleData.prescription_file)

      if (uploadError) {
        return { success: false, error: "Failed to upload prescription" }
      }

      const { data: urlData } = supabase.storage.from("prescriptions").getPublicUrl(uploadData.path)

      prescriptionUrl = urlData.publicUrl
    }

    // Create the sale record
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          client_id: saleData.client_id,
          seller_id: saleData.seller_id,
          total_amount: saleData.total_amount,
          discount_amount: saleData.discount_amount,
          final_amount: saleData.final_amount,
          payment_method_id: saleData.payment_method_id,
          prescription_required: saleData.prescription_required,
          prescription_file_url: prescriptionUrl,
          invoice_number: invoiceNumber,
        },
      ])
      .select()
      .single()

    if (saleError) {
      return { success: false, error: saleError.message }
    }

    // Create sale items
    const saleItemsData = saleData.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      discount_applied: item.discount_applied,
    }))

    const { error: itemsError } = await supabase.from("sale_items").insert(saleItemsData)

    if (itemsError) {
      // Rollback sale if items creation fails
      await supabase.from("sales").delete().eq("id", sale.id)
      return { success: false, error: itemsError.message }
    }

    // Create prescription record if required
    if (saleData.prescription_required && saleData.client_id) {
      await supabase.from("prescriptions").insert([
        {
          sale_id: sale.id,
          client_id: saleData.client_id,
          doctor_name: "To be filled", // This would come from prescription parsing
          doctor_crm: "To be filled",
          prescription_date: new Date().toISOString().split("T")[0],
          file_url: prescriptionUrl,
          is_digitized: true,
        },
      ])
    }

    // Get sale with items for receipt
    const { data: saleWithItems } = await supabase
      .from("sales")
      .select(`
        *,
        sale_items (
          *,
          products (name)
        ),
        clients (name, cpf),
        payment_methods (name)
      `)
      .eq("id", sale.id)
      .single()

    // Format receipt data
    const receiptData = {
      ...saleWithItems,
      items: saleWithItems.sale_items.map((item: any) => ({
        ...item,
        product_name: item.products.name,
      })),
    }

    revalidatePath("/sales")
    revalidatePath("/products")
    return { success: true, data: receiptData }
  } catch (error) {
    console.error("Sale creation error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getSales(filters?: {
  start_date?: string
  end_date?: string
  seller_id?: string
  client_id?: string
}) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from("sales")
      .select(`
        *,
        clients (name, cpf),
        profiles!sales_seller_id_fkey (full_name),
        payment_methods (name),
        sale_items (
          *,
          products (name, anvisa_label)
        )
      `)
      .order("sale_date", { ascending: false })

    if (filters?.start_date) {
      query = query.gte("sale_date", filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte("sale_date", filters.end_date)
    }
    if (filters?.seller_id) {
      query = query.eq("seller_id", filters.seller_id)
    }
    if (filters?.client_id) {
      query = query.eq("client_id", filters.client_id)
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
