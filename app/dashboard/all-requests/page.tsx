"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Icons } from "@/components/icons"
import { StatusBadge } from "@/components/status-badge"
import { formatDistanceToNow, format } from "date-fns"

export default function AllRequestsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const requests = useQuery(api.requests.list, {})
  const assetTypes = useQuery(api.assetTypes.list, {})
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all")

  const filteredRequests = requests?.filter((request) => {
    const matchesSearch =
      request.assetTypeName.toLowerCase().includes(search.toLowerCase()) ||
      request.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      request.requesterEmail.toLowerCase().includes(search.toLowerCase()) ||
      request._id.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || request.status === statusFilter

    const matchesAssetType = assetTypeFilter === "all" || request.assetTypeId === assetTypeFilter

    return matchesSearch && matchesStatus && matchesAssetType
  })

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === "pending").length || 0,
    approved: requests?.filter((r) => r.status === "approved").length || 0,
    denied: requests?.filter((r) => r.status === "denied").length || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Requests</h1>
        <p className="text-muted-foreground">View and manage all asset requests across the organization.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{stats.denied}</div>
            <p className="text-sm text-muted-foreground">Denied</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
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
            <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {assetTypes?.map((type) => (
                  <SelectItem key={type._id} value={type._id}>
                    {type.name}
                  </SelectItem>
                ))}
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
              <Icons.fileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No requests found</p>
              {(search || statusFilter !== "all" || assetTypeFilter !== "all") && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch("")
                    setStatusFilter("all")
                    setAssetTypeFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requester</TableHead>
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
                        <div className="font-medium">{request.requesterName}</div>
                        <div className="text-sm text-muted-foreground">{request.requesterEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{request.assetTypeName}</div>
                        <div className="text-xs text-muted-foreground">{request.requesterDepartment || "-"}</div>
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
                        <Link href={`/dashboard/requests/${request._id}`}>
                          <Button variant="ghost" size="sm">
                            <Icons.eye className="h-4 w-4" />
                          </Button>
                        </Link>
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
