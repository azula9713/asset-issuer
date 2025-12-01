"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "@/lib/auth-client"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Icons } from "@/components/icons"
import { RoleBadge } from "@/components/role-badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: "layoutDashboard" as const },
  { name: "New Request", href: "/dashboard/new-request", icon: "plus" as const },
  { name: "My Requests", href: "/dashboard/my-requests", icon: "clipboardList" as const },
  {
    name: "Approvals",
    href: "/dashboard/approvals",
    icon: "userCheck" as const,
    roles: ["supervisor", "admin", "super_admin"],
  },
  { name: "All Requests", href: "/dashboard/all-requests", icon: "fileText" as const, roles: ["admin", "super_admin"] },
  { name: "Users", href: "/dashboard/users", icon: "users" as const, roles: ["admin", "super_admin"] },
  { name: "Asset Types", href: "/dashboard/asset-types", icon: "settings" as const, roles: ["super_admin"] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const userProfile = useQuery(api.users.getProfile, session?.user?.id ? { userId: session.user.id } : "skip")

  const createProfile = useMutation(api.users.createOrUpdateProfile)

  // Create user profile if it doesn't exist
  useEffect(() => {
    if (session?.user && userProfile === null) {
      createProfile({
        userId: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "User",
        role: "employee",
      })
    }
  }, [session, userProfile, createProfile])

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login")
    }
  }, [session, isPending, router])

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Icons.loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const userRole = userProfile?.role || "employee"

  const filteredNavItems = navigationItems.filter((item) => !item.roles || item.roles.includes(userRole))

  const handleSignOut = async () => {
    await signOut()
    toast.success("Signed out successfully")
    router.push("/")
  }

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="space-y-1">
      {filteredNavItems.map((item) => {
        const Icon = Icons[item.icon]
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 h-16 px-4 border-b border-sidebar-border">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Icons.shield className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">AssetFlow</span>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 py-4">
            <NavLinks />
          </div>

          {/* User Info */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                  {(userProfile?.name || session.user.name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userProfile?.name || session.user.name}
                </p>
                <RoleBadge role={userRole as "employee" | "supervisor" | "admin" | "super_admin"} />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card px-4">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Icons.menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar">
            <div className="flex items-center gap-2 h-16 px-4 border-b border-sidebar-border">
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Icons.shield className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-semibold text-lg text-sidebar-foreground">AssetFlow</span>
            </div>
            <div className="px-3 py-4">
              <NavLinks mobile />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1">
          <span className="font-semibold text-sidebar-foreground">AssetFlow</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {(userProfile?.name || session.user.name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userProfile?.name || session.user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <Icons.logOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 h-16 items-center justify-between border-b border-border bg-card px-6">
          <div />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {(userProfile?.name || session.user.name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{userProfile?.name || session.user.name}</span>
                <Icons.chevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span>{userProfile?.name || session.user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{session.user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <Icons.logOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
