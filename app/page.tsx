"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && session) {
      router.push("/dashboard")
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Icons.loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Icons.shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">AssetFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Icons.shield className="h-4 w-4" />
            Enterprise Asset Management
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
            Digital Asset Issuing System
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
            Streamline your organization's asset management with customizable approval workflows, hierarchical
            permissions, and complete audit trails.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/auth/register">
              <Button size="lg" className="gap-2">
                Start Free Trial
                <Icons.arrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Icons.doorOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Gate Passes</h3>
              <p className="text-muted-foreground text-sm">
                Issue temporary access passes for visitors and contractors with customizable approval flows.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 mx-auto">
                <Icons.key className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Software Licenses</h3>
              <p className="text-muted-foreground text-sm">
                Manage software license requests with multi-level approval and cost tracking.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4 mx-auto">
                <Icons.laptop className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Hardware Assets</h3>
              <p className="text-muted-foreground text-sm">
                Track equipment requests from submission to delivery with full audit trails.
              </p>
            </div>
          </div>

          {/* Role Hierarchy */}
          <div className="mt-20 p-8 rounded-2xl border border-border bg-card">
            <h2 className="text-2xl font-bold mb-8">Flexible Role Hierarchy</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary">
                <Icons.user className="h-5 w-5 text-secondary-foreground" />
                <span className="font-medium">Employee</span>
              </div>
              <Icons.arrowRight className="h-5 w-5 text-muted-foreground self-center" />
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-info/10 border border-info/30">
                <Icons.userCheck className="h-5 w-5 text-info" />
                <span className="font-medium">Supervisor</span>
              </div>
              <Icons.arrowRight className="h-5 w-5 text-muted-foreground self-center" />
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30">
                <Icons.userCog className="h-5 w-5 text-accent" />
                <span className="font-medium">Admin</span>
              </div>
              <Icons.arrowRight className="h-5 w-5 text-muted-foreground self-center" />
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                <Icons.shield className="h-5 w-5 text-primary" />
                <span className="font-medium">Super Admin</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-6 text-sm">
              Customize approval chains and notification recipients based on your organization's structure.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>AssetFlow - Enterprise Digital Asset Management System</p>
        </div>
      </footer>
    </div>
  )
}
