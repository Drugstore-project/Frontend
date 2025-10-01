"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function createTestUser() {
  const supabase = createAdminClient()

  try {
    console.log("[v0] Starting test user creation...")

    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers.users.find((user) => user.email === "admin123@pharmacare.com")

    if (existingUser) {
      console.log("[v0] Found existing user, deleting user and profile...")
      await supabase.from("profiles").delete().eq("id", existingUser.id)
      await supabase.auth.admin.deleteUser(existingUser.id)
    }

    await supabase.from("profiles").delete().eq("email", "admin123@pharmacare.com")

    console.log("[v0] Creating new confirmed user...")
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin123@pharmacare.com",
      password: "admin123",
      email_confirm: true, // This should bypass email confirmation
      user_metadata: {
        full_name: "Admin User",
      },
    })

    if (authError) {
      console.error("[v0] Auth error:", authError)
      return { error: authError.message }
    }

    console.log("[v0] User created, adding profile...")

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      email: "admin123@pharmacare.com",
      full_name: "Admin User",
      role: "admin",
    })

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
      return { error: profileError.message }
    }

    console.log("[v0] Test user created successfully!")
    return { success: true, message: "Fresh test account created and confirmed!" }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { error: "Failed to create test user" }
  }
}
