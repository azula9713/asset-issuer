"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons, getAssetIcon } from "@/components/icons"
import { StatusBadge } from "@/components/status-badge"
import { RoleBadge } from "@/components/role-badge"
import { format } from "date-fns"
import { useRef } from "react"

export default function RequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  const requestId = params.id as Id<"requests">
  const requestData = useQuery(api.requests.getWithHistory, { id: requestId })

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = async () => {
    // Use browser's print to PDF functionality
    window.print()
  }

  if (!requestData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icons.loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const Icon = getAssetIcon(requestData.assetType?.icon)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <Icons.arrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 bg-transparent">
            <Icons.printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2 bg-transparent">
            <Icons.download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="print-container space-y-6">
        {/* Request Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{requestData.assetTypeName}</CardTitle>
                  <CardDescription>Request ID: {requestData._id}</CardDescription>
                </div>
              </div>
              <StatusBadge status={requestData.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Requester</span>
                <p className="font-medium">{requestData.requesterName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="font-medium">{requestData.requesterEmail}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Department</span>
                <p className="font-medium">{requestData.requesterDepartment || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted</span>
                <p className="font-medium">{format(requestData.createdAt, "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated</span>
                <p className="font-medium">{format(requestData.updatedAt, "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              {requestData.issuedAt && (
                <div>
                  <span className="text-muted-foreground">Issued</span>
                  <p className="font-medium">{format(requestData.issuedAt, "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {requestData.status === "pending" && (
              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Approval Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {requestData.currentApprovalLevel} of {requestData.totalApprovalLevels} approvals
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${(requestData.currentApprovalLevel / requestData.totalApprovalLevels) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.fileText className="h-5 w-5" />
              Request Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {requestData.assetType?.fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">{field.label}</span>
                  <p className="font-medium">{(requestData.formData as Record<string, string>)?.[field.name] || "-"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Approval History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.history className="h-5 w-5" />
              Approval History
            </CardTitle>
            <CardDescription>Complete audit trail of all actions taken on this request.</CardDescription>
          </CardHeader>
          <CardContent>
            {requestData.history.length === 0 ? (
              <div className="text-center py-8">
                <Icons.clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {requestData.status === "pending" ? "Waiting for approval" : "No approval history"}
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-6">
                  {/* Creation Event */}
                  <div className="relative flex gap-4 items-start">
                    <div className="relative z-10 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <Icons.plus className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-medium">Request Created</p>
                      <p className="text-sm text-muted-foreground">
                        {requestData.requesterName} submitted this request
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(requestData.createdAt, "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>

                  {/* Approval Events */}
                  {requestData.history.map((event, index) => (
                    <div key={index} className="relative flex gap-4 items-start">
                      <div
                        className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center ${
                          event.action === "approved"
                            ? "bg-success"
                            : event.action === "denied"
                              ? "bg-destructive"
                              : "bg-muted"
                        }`}
                      >
                        {event.action === "approved" ? (
                          <Icons.check className="h-4 w-4 text-success-foreground" />
                        ) : event.action === "denied" ? (
                          <Icons.x className="h-4 w-4 text-destructive-foreground" />
                        ) : (
                          <Icons.fileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium capitalize">{event.action}</p>
                          <RoleBadge role={event.approverRole as "employee" | "supervisor" | "admin" | "super_admin"} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.approverName} ({event.approverEmail})
                        </p>
                        {event.comment && (
                          <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm">
                            <span className="font-medium">Comment: </span>
                            {event.comment}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(event.createdAt, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Final Status */}
                  {requestData.status !== "pending" && (
                    <div className="relative flex gap-4 items-start">
                      <div
                        className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center ${
                          requestData.status === "approved"
                            ? "bg-success"
                            : requestData.status === "denied"
                              ? "bg-destructive"
                              : "bg-muted"
                        }`}
                      >
                        {requestData.status === "approved" ? (
                          <Icons.checkCircle className="h-4 w-4 text-success-foreground" />
                        ) : requestData.status === "denied" ? (
                          <Icons.xCircle className="h-4 w-4 text-destructive-foreground" />
                        ) : (
                          <Icons.x className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-medium">
                          Request{" "}
                          {requestData.status === "approved"
                            ? "Fully Approved"
                            : requestData.status === "denied"
                              ? "Denied"
                              : "Cancelled"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(requestData.updatedAt, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
