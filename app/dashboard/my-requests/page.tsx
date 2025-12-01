"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Icons } from "@/components/icons"
import { StatusBadge } from "@/components/status-badge"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

export default function MyRequestsPage() {
  const { data: session } = useSession()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const requests = useQuery(api.requests.list, session?.user?.id ? { requesterId: session.user.id } : "skip")

  const cancelRequest = useMutation(api.requests.cancel)

  const handleCancel = async (requestId: Id<"requests">) => {
    if (!session?.user?.id) return

    try {
      await cancelRequest({
        requestId,
        requesterId: session.user.id,
      })
      toast.success("Request cancelled")
    } catch (error) {
      toast.error("Failed to cancel request")
      console.error(error)
    }
  }

  const filteredRequests = requests?.filter((request) => {
    const matchesSearch =
      request.assetTypeName.toLowerCase().includes(search.toLowerCase()) ||
      request._id.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Requests</h1>
          <p className="text-muted-foreground">View and manage your asset requests.</p>
        </div>
        <Link href="/dashboard/new-request">
          <Button className="gap-2">
            <Icons.plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Requests ({filteredRequests?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!filteredRequests || filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Icons.clipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No requests found</p>
              {search || statusFilter !== "all" ? (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch("")
                    setStatusFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Link href="/dashboard/new-request">
                  <Button variant="link">Create your first request</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <div className="font-medium">{request.assetTypeName}</div>
                        <div className="text-sm text-muted-foreground">ID: {request._id.slice(-8)}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell>
                        {request.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${(request.currentApprovalLevel / request.totalApprovalLevels) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {request.currentApprovalLevel}/{request.totalApprovalLevels}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{format(request.createdAt, "MMM d, yyyy")}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/requests/${request._id}`}>
                            <Button variant="ghost" size="sm">
                              <Icons.eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {request.status === "pending" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Icons.x className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Request</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this request? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancel(request._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Cancel Request
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
