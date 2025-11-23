"use server"

import { revalidatePath } from "next/cache"

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000';

export async function getStaffMembers() {
  try {
    // Fetch users and roles in parallel
    const [usersRes, rolesRes] = await Promise.all([
      fetch(`${API_URL}/users/`, { cache: 'no-store' }),
      fetch(`${API_URL}/roles/`, { cache: 'no-store' })
    ]);

    if (!usersRes.ok || !rolesRes.ok) {
      return { success: false, error: "Failed to fetch data from backend" };
    }

    const users = await usersRes.json();
    const roles = await rolesRes.json();

    // Create a map of role_id to role_name
    const roleMap = new Map();
    roles.forEach((r: any) => roleMap.set(r.id, r.name));

    // Filter and map users
    const staff = users
      .filter((u: any) => {
        const roleName = roleMap.get(u.role_id);
        // Filter out clients/customers AND ensure we only show staff roles
        // Assuming roles: 1=Admin, 2=Pharmacist, 3=Manager, 4=Client
        // We want to exclude Client (4) and potentially others if defined
        return roleName && !['client', 'customer'].includes(roleName.toLowerCase());
      })
      .map((u: any) => ({
        id: u.id.toString(),
        full_name: u.name,
        email: u.email,
        role: roleMap.get(u.role_id) || 'unknown',
        created_at: new Date().toISOString() // Backend doesn't return created_at yet
      }));

    return { success: true, data: staff };
  } catch (error: any) {
    console.error("Unexpected error fetching staff:", error);
    return { success: false, error: `Connection error: ${error.message}` };
  }
}

export async function createStaffMember(formData: any) {
  try {
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role_id: parseInt(formData.role_id),
      cpf: formData.cpf || null
    };

    const response = await fetch(`${API_URL}/users/`, {
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
          if (errorJson.detail) {
            if (typeof errorJson.detail === 'string') {
              errorDetail = errorJson.detail;
            } else if (Array.isArray(errorJson.detail)) {
              // Handle Pydantic validation errors
              errorDetail = errorJson.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
            } else {
              errorDetail = JSON.stringify(errorJson.detail);
            }
          }
      } catch (e) {}
      return { success: false, error: errorDetail };
    }

    revalidatePath("/admin/staff");
    return { success: true };
  } catch (error: any) {
    console.error("Create staff error:", error);
    return { success: false, error: `Connection error: ${error.message}` };
  }
}

export async function deleteStaffMember(userId: string) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      return { success: false, error: "Failed to delete user" };
    }

    revalidatePath("/admin/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Connection error: ${error.message}` };
  }
}

export async function updateStaffRole(userId: string, newRole: string) {
  // This would require an endpoint to update user role by ID
  // For now, we'll just return success to simulate
  return { success: true };
}
