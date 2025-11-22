"use client"

import { useState } from "react"
import { authService } from "@/lib/auth-service"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pill, LogOut, Settings, User, Menu, X, ShoppingCart } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  user: {
    full_name?: string
    email?: string
    role?: string
  } | null
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    authService.logout()
    router.push("/auth/login")
  }

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/products", label: "Products" },
    ...(user?.role && ["manager", "owner"].includes(user.role)
      ? [{ href: "/clients", label: "Clients" }]
      : []),
    ...(user?.role === "owner" ? [{ href: "/admin", label: "Admin" }] : []),
  ]

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">PharmaCare</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user?.full_name || "User"}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || "Staff"}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-blue-100 transition-all">
                  <Avatar className="h-10 w-10 border border-gray-200">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2 bg-gray-50 rounded-t-md">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.full_name}</p>
                    <p className="w-[200px] truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="space-y-1 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
