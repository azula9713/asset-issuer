"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Icons, getAssetIcon } from "@/components/icons"
import { StatusBadge } from "@/components/status-badge"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

interface PendingRequest {
  _id: Id<"requests">
  _creationTime: number
  requesterId: string
  requesterName: string
  requesterEmail: string
  requesterDepartment?: string
  assetTypeId: Id<"assetTypes">
  assetTypeName: string
  formData: Record<string, unknown>
  status: "pending" | "approved" | "denied" | "cancelled"
  currentApprovalLevel: number
  totalApprovalLevels: number
  createdAt: number
  updatedAt: number
  assetType: {
    _id: Id<"assetTypes">
    name: string
    icon?: string
    fields: Array<{ name: string; label: string; type: string; required: boolean }>
    approvalLevels: string[]
  } | null
  requiredRole: string
}

export default function ApprovalsPage() {
  const { data: session } = useSession()

  const userProfile = useQuery(api.users.getProfile, session?.user?.id ? { userId: session.user.id } : "skip")

  const pendingApprovals = useQuery(
    api.requests.getPendingForApprover,
    userProfile?.role ? { approverRole: userProfile.role } : "skip",
  ) as PendingRequest[] | undefined

  const approveRequest = useMutation(api.requests.approve)
  const denyRequest = useMutation(api.requests.deny)

  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [actionType, setActionType] = useState<"approve" | "deny" | null>(null)
  const [comment, setComment] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async () => {
    if (!selectedRequest || !actionType || !session?.user || !userProfile) return

    if (actionType === "deny" && !comment.trim()) {
      toast.error("Please provide a reason for denial")
      return
    }

    setIsProcessing(true)

    try {
      if (actionType === "approve") {
        const result = await approveRequest({
          requestId: selectedRequest._id,
          approverId: session.user.id,
          approverName: userProfile.name,
          approverEmail: userProfile.email,
          approverRole: userProfile.role,
          comment: comment.trim() || undefined,
        })

        // Send email notification
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "request_approved",
              to: selectedRequest.requesterEmail,
              subject: `Your ${selectedRequest.assetTypeName} Request has been ${result.isFullyApproved ? "Approved" : "Partially Approved"}`,
              data: {
                assetTypeName: selectedRequest.assetTypeName,
                approverName: userProfile.name,
                comment: comment.trim(),
                isFullyApproved: result.isFullyApproved,
              },
            }),
          })
        } catch {
          console.log("Email notification skipped")
        }

        toast.success(
          result.isFullyApproved ? "Request fully approved and issued" : "Request approved, awaiting next level",
        )
      } else {
        await denyRequest({
          requestId: selectedRequest._id,
          approverId: session.user.id,
          approverName: userProfile.name,
          approverEmail: userProfile.email,
          approverRole: userProfile.role,
          comment: comment.trim(),
        })

        // Send email notification
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "request_denied",
              to: selectedRequest.requesterEmail,
              subject: `Your ${selectedRequest.assetTypeName} Request has been Denied`,
              data: {
                assetTypeName: selectedRequest.assetTypeName,
                approverName: userProfile.name,
                comment: comment.trim(),
              },
            }),
          })
        } catch {
          console.log("Email notification skipped")
        }

        toast.success("Request denied")
      }

      setSelectedRequest(null)
      setActionType(null)
      setComment("")
    } catch (error) {
      toast.error(`Failed to ${actionType} request`)
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const openActionDialog = (request: PendingRequest, action: "approve" | "deny") => {
    setSelectedRequest(request)
    setActionType(action)
    setComment("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground">Review and approve or deny asset requests awaiting your action.</p>
      </div>

      {!pendingApprovals || pendingApprovals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icons.checkCircle className="h-12 w-12 mx-auto text-success/50 mb-4" />
            <p className="text-muted-foreground">No pending approvals</p>
            <p className="text-sm text-muted-foreground">All requests are up to date. Check back later!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map((request) => {
            const Icon = getAssetIcon(request.assetType?.icon)
            return (
              <Card key={request._id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{request.assetTypeName}</CardTitle>
                        <CardDescription>
                          From {request.requesterName} • {request.requesterDepartment || "No department"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        Level {request.currentApprovalLevel + 1} of {request.totalApprovalLevels}
                      </Badge>
                      <StatusBadge status={request.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Form Data Preview */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {request.assetType?.fields.slice(0, 4).map((field) => (
                      <div key={field.name}>
                        <span className="text-sm text-muted-foreground">{field.label}</span>
                        <p className="font-medium truncate">{String(request.formData[field.name] || "-")}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icons.clock className="h-4 w-4" />
                        {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icons.mail className="h-4 w-4" />
                        {request.requesterEmail}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/requests/${request._id}`}>
                        <Button variant="outline" size="sm">
                          <Icons.eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive bg-transparent"
                        onClick={() => openActionDialog(request, "deny")}
                      >
                        <Icons.x className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/90"
                        onClick={() => openActionDialog(request, "approve")}
                      >
                        <Icons.check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog
        open={!!selectedRequest && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null)
            setActionType(null)
            setComment("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Approve Request" : "Deny Request"}</DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Add an optional comment to this approval."
                : "Please provide a reason for denying this request."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">{selectedRequest.assetTypeName}</p>
                <p className="text-sm text-muted-foreground">Requested by {selectedRequest.requesterName}</p>
                <p className="text-xs text-muted-foreground">
                  {format(selectedRequest.createdAt, "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comment {actionType === "deny" && <span className="text-destructive">*</span>}
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Add a comment (optional)..."
                      : "Please explain why this request is being denied..."
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null)
                setActionType(null)
                setComment("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing || (actionType === "deny" && !comment.trim())}
              className={actionType === "approve" ? "bg-success hover:bg-success/90" : ""}
              variant={actionType === "deny" ? "destructive" : "default"}
            >
              {isProcessing ? (
                <>
                  <Icons.loader className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionType === "approve" ? (
                <>
                  <Icons.check className="h-4 w-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <Icons.x className="h-4 w-4 mr-2" />
                  Deny
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
