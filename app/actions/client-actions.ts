"use server"

import { revalidatePath } from "next/cache"

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000';

async function getClientRoleId() {
  const rolesRes = await fetch(`${API_URL}/roles/`, { cache: 'no-store' });
  if (!rolesRes.ok) return null;
  const roles = await rolesRes.json();
  const clientRole = roles.find((r: any) => r.name.toLowerCase() === 'client');
  return clientRole ? clientRole.id : null;
}

export async function createClient(formData: {
  cpf: string
  name: string
  phone: string
  email?: string
  address?: string
  birth_date?: string
  client_type: string
}) {
  try {
    const roleId = await getClientRoleId();
    if (!roleId) return { success: false, error: "Client role not found. Please contact admin." };

    // Email is required by backend User model. If not provided, generate a placeholder.
    // In a real app, you might want to enforce email or handle this differently.
    const email = formData.email || `noemail_${formData.cpf.replace(/\D/g, "")}@pharmacare.local`;

    const payload = {
      name: formData.name,
      email: email,
      cpf: formData.cpf.replace(/\D/g, ""),
      phone: formData.phone.replace(/\D/g, ""),
      address: formData.address || null,
      birth_date: formData.birth_date || null,
      client_type: formData.client_type,
      password: "client_default_pass", // Placeholder password
      role_id: roleId
    };

    const response = await fetch(`${API_URL}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = errorText;
      try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.detail || errorText;
      } catch (e) {}
      return { success: false, error: errorDetail };
    }

    const data = await response.json();
    revalidatePath("/clients");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: `Connection error: ${error.message}` };
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
  try {
    const payload: any = {
      name: formData.name,
      phone: formData.phone.replace(/\D/g, ""),
      address: formData.address || null,
      birth_date: formData.birth_date || null,
      client_type: formData.client_type,
    };
    
    if (formData.email) {
      payload.email = formData.email;
    }

    const response = await fetch(`${API_URL}/users/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to update client" };
    }

    const data = await response.json();
    revalidatePath("/clients");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteClientLGPD(clientId: string) {
  try {
    // For now, we perform a hard delete via the API.
    // To implement true LGPD anonymization, we would need a specific endpoint 
    // or update the user with anonymized data here.
    const response = await fetch(`${API_URL}/users/${clientId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      return { success: false, error: "Failed to delete client" };
    }

    revalidatePath("/clients");
    return { success: true, message: "Client deleted successfully" };
  } catch (error: any) {
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function searchClients(searchTerm: string) {
  try {
    // Fetch all users and filter client-side for now (inefficient but works for small data)
    // Ideally backend should support ?search=...
    const response = await fetch(`${API_URL}/users/`, { cache: 'no-store' });
    if (!response.ok) return { success: false, error: "Failed to fetch clients" };

    const users = await response.json();
    const roleId = await getClientRoleId();

    const filtered = users.filter((u: any) => {
      const isClient = u.role_id === roleId;
      if (!isClient) return false;

      const term = searchTerm.toLowerCase();
      const nameMatch = u.name.toLowerCase().includes(term);
      const cpfMatch = u.cpf && u.cpf.includes(searchTerm.replace(/\D/g, ""));
      
      return nameMatch || cpfMatch;
    });

    return { success: true, data: filtered };
  } catch (error: any) {
    return { success: false, error: "An unexpected error occurred" };
  }
}
