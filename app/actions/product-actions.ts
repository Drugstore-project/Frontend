"use server"

import { revalidatePath } from "next/cache"

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000';

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
  try {
    // Map frontend form data to backend ProductCreate schema
    const payload = {
      name: formData.name,
      description: formData.description,
      barcode: formData.barcode,
      price: formData.price,
      stock_quantity: formData.stock_quantity,
      validity: formData.expiration_date, // Map expiration_date to validity
      stripe: formData.anvisa_label, // Map anvisa_label to stripe
      requires_prescription: formData.requires_prescription,
      category: formData.category_id // Assuming category_id is just a string name for now, or backend needs update
    };

    const response = await fetch(`${API_URL}/products/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = errorText;
      try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.detail || errorText;
      } catch (e) {}
      
      return { success: false, error: errorDetail || "Failed to create product" };
    }

    const data = await response.json();

    revalidatePath("/products")
    return { success: true, data }
  } catch (error: any) {
    console.error("Product creation error:", error)
    return { success: false, error: `Connection error: ${error.message}` }
  }
}

export async function updateProductStock(productId: string, newQuantity: number, reason: string) {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stock_quantity: newQuantity
      }),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to update stock" }
    }

    revalidatePath("/products")
    return { success: true }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" }
  }
}
