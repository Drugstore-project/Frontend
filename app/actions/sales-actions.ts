"use server"

import { revalidatePath } from "next/cache"

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000';

export async function createSale(saleData: {
  client_id?: string | null
  seller_id: string
  payment_method_id: string
  items: any[]
  total_amount: number
  discount_amount: number
  final_amount: number
  prescription_required: boolean
  prescription_file?: File | null
}) {
  try {
    // Map frontend data to backend OrderCreate schema
    const payload = {
      user_id: saleData.client_id ? parseInt(saleData.client_id) : null, // Send null if no client selected
      seller_id: saleData.seller_id ? parseInt(saleData.seller_id) : null,
      payment_method: saleData.payment_method_id,
      status: "paid", // Assuming immediate payment
      items: saleData.items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: item.quantity,
        unit_price: item.unit_price,
        batch_id: item.batch_id ? Number(item.batch_id) : null
      }))
    };

    console.log("Sending payload to backend:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${API_URL}/orders/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log("Backend response status:", response.status);


    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = errorText;
      try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.detail || errorText;
      } catch (e) {}
      
      return { success: false, error: errorDetail || "Failed to create order" };
    }

    const data = await response.json();

    // Format receipt data for the frontend
    const receiptData = {
      invoice_number: `ORD-${data.id}`,
      total_amount: saleData.total_amount,
      discount_amount: saleData.discount_amount,
      final_amount: data.total_value, // Use backend calculated total
      items: saleData.items.map((item) => ({
        ...item,
        product_name: item.product?.name || `Product ${item.product_id}`,
      })),
    }

    revalidatePath("/sales")
    revalidatePath("/products")
    return { success: true, data: receiptData }
  } catch (error: any) {
    console.error("Sale creation error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function getSales(filters?: any) {
  // Placeholder for getSales using backend API
  return { success: true, data: [] }
}
