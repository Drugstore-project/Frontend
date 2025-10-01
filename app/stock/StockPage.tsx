"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Pill, Shield, UserPlus } from "lucide-react"
import { createTestUser } from "@/app/actions/create-test-user"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingTestUser, setIsCreatingTestUser] = useState(false)
  const [testUserMessage, setTestUserMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTestUser = async () => {
    setIsCreatingTestUser(true)
    setTestUserMessage(null)
    setError(null)

    try {
      const result = await createTestUser()
      if (result.error) {
        setError(result.error)
      } else {
        setTestUserMessage(
          result.message || "Test admin account ready! You can now login with admin123@pharmacare.com / admin123",
        )
        // Auto-fill the form
        setEmail("admin123@pharmacare.com")
        setPassword("admin123")
      }
    } catch (error) {
      setError("Failed to create test user")
    } finally {
      setIsCreatingTestUser(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Pill className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">PharmaCare</h1>
          </div>
          <p className="text-gray-600">Professional Pharmacy Management System</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">Sign In</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to access the pharmacy system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="pharmacist@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {testUserMessage && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-600">{testUserMessage}</p>
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4">
              <Button
                onClick={handleCreateTestUser}
                disabled={isCreatingTestUser}
                variant="outline"
                className="w-full h-11 border-green-200 text-green-700 hover:bg-green-50 bg-transparent"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isCreatingTestUser ? "Creating Test Account..." : "Create Test Admin Account"}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need an account?{" "}
                <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Register Here
                </Link>
              </p>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-md border">
              <p className="text-xs font-medium text-gray-700 mb-2">Demo Credentials:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  <strong>Admin:</strong> admin123@pharmacare.com / admin123
                </div>
                <div>
                  <strong>Staff:</strong> staff@pharmacare.com / teststaff123
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Secure Healthcare System</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
