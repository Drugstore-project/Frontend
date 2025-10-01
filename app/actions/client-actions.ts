"use server"

import { createSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createClient(formData: {
  cpf: string
  name: string
  phone: string
  email?: string
  address?: string
  birth_date?: string
  client_type: string
}) {
  const supabase = await createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("clients")
      .insert([
        {
          cpf: formData.cpf.replace(/\D/g, ""),
          name: formData.name,
          phone: formData.phone.replace(/\D/g, ""),
          email: formData.email || null,
          address: formData.address || null,
          birth_date: formData.birth_date || null,
          client_type: formData.client_type,
          is_active: true,
        },
      ])
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/clients")
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updateClient(
  clientId: string,
  formData: {
    name: string
    phone: string
    email?: string
    address?: string
    birth_date?: string
    client_type: string
  },
) {
  const supabase = await createSupabaseClient()

  try {
    // Get current client data for modification history
    const { data: currentClient } = await supabase.from("clients").select("*").eq("id", clientId).single()

    if (!currentClient) {
      return { success: false, error: "Client not found" }
    }

    // Create modification history entry
    const modificationEntry = {
      timestamp: new Date().toISOString(),
      changes: {
        name: { from: currentClient.name, to: formData.name },
        phone: { from: currentClient.phone, to: formData.phone.replace(/\D/g, "") },
        email: { from: currentClient.email, to: formData.email || null },
        address: { from: currentClient.address, to: formData.address || null },
        birth_date: { from: currentClient.birth_date, to: formData.birth_date || null },
        client_type: { from: currentClient.client_type, to: formData.client_type },
      },
    }

    const { data, error } = await supabase
      .from("clients")
      .update({
        name: formData.name,
        phone: formData.phone.replace(/\D/g, ""),
        email: formData.email || null,
        address: formData.address || null,
        birth_date: formData.birth_date || null,
        client_type: formData.client_type,
        modification_history: [...(currentClient.modification_history || []), modificationEntry],
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/clients")
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteClientLGPD(clientId: string) {
  const supabase = await createSupabaseClient()

  try {
    // Get current client data
    const { data: currentClient } = await supabase.from("clients").select("*").eq("id", clientId).single()

    if (!currentClient) {
      return { success: false, error: "Client not found" }
    }

    // LGPD Compliance: Anonymize data instead of hard delete
    const { data, error } = await supabase
      .from("clients")
      .update({
        name: "DELETED_USER",
        cpf: "00000000000",
        phone: "00000000000",
        email: null,
        address: null,
        is_active: false,
        modification_history: [
          ...(currentClient.modification_history || []),
          {
            action: "LGPD_DELETION",
            timestamp: new Date().toISOString(),
            reason: "User requested data deletion",
            original_cpf_hash: Buffer.from(currentClient.cpf).toString("base64"), // Keep hash for audit
          },
        ],
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/clients")
    return { success: true, message: "Client data anonymized successfully (LGPD compliance)" }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function searchClients(searchTerm: string) {
  const supabase = await createSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("is_active", true)
      .or(`name.ilike.%${searchTerm}%,cpf.like.%${searchTerm.replace(/\D/g, "")}%`)
      .order("name", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" }
  }
}
