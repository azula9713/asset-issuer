"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useSession } from "@/lib/auth-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { StatusBadge } from "@/components/status-badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

export default function DashboardPage() {
  const { data: session } = useSession()

  const userProfile = useQuery(api.users.getProfile, session?.user?.id ? { userId: session.user.id } : "skip")

  const stats = useQuery(api.requests.getStats)

  const myRequests = useQuery(api.requests.list, session?.user?.id ? { requesterId: session.user.id } : "skip")

  const pendingApprovals = useQuery(
    api.requests.getPendingForApprover,
    userProfile?.role ? { approverRole: userProfile.role } : "skip",
  )

  const recentRequests = myRequests?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {userProfile?.name || session?.user?.name || "User"}</h1>
          <p className="text-muted-foreground">Here's what's happening with your asset requests.</p>
        </div>
        <Link href="/dashboard/new-request">
          <Button className="gap-2">
            <Icons.plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Icons.fileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All time requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Icons.clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Icons.checkCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <Icons.xCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.denied || 0}</div>
            <p className="text-xs text-muted-foreground">Rejected requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals && pendingApprovals.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <Icons.bell className="h-5 w-5" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You have {pendingApprovals.length} request(s) waiting for your approval.
            </p>
            <Link href="/dashboard/approvals">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Icons.userCheck className="h-4 w-4" />
                Review Approvals
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Requests</CardTitle>
          <Link href="/dashboard/my-requests">
            <Button variant="ghost" size="sm" className="gap-1">
              View all
              <Icons.arrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <Icons.clipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No requests yet</p>
              <Link href="/dashboard/new-request">
                <Button variant="link" className="mt-2">
                  Create your first request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <Link
                  key={request._id}
                  href={`/dashboard/requests/${request._id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icons.fileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{request.assetTypeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={request.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
