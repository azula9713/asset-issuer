"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useSession } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Icons, getAssetIcon } from "@/components/icons"
import { toast } from "sonner"

export default function NewRequestPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userProfile = useQuery(api.users.getProfile, session?.user?.id ? { userId: session.user.id } : "skip")

  const assetTypes = useQuery(api.assetTypes.list, { activeOnly: true })
  const createRequest = useMutation(api.requests.create)

  const selectedType = assetTypes?.find((t) => t._id === selectedAssetType)

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !session?.user || !userProfile) return

    // Validate required fields
    const missingFields = selectedType.fields.filter((f) => f.required && !formData[f.name]).map((f) => f.label)

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(", ")}`)
      return
    }

    setIsSubmitting(true)

    try {
      await createRequest({
        requesterId: session.user.id,
        requesterName: userProfile.name,
        requesterEmail: userProfile.email,
        requesterDepartment: userProfile.department,
        assetTypeId: selectedType._id,
        formData,
      })

      // Send notification email to supervisors (we'll implement this API)
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "request_submitted",
            to: "supervisor@example.com", // In production, fetch actual supervisor emails
            subject: `New ${selectedType.name} Request from ${userProfile.name}`,
            data: {
              requesterName: userProfile.name,
              assetTypeName: selectedType.name,
              createdAt: Date.now(),
            },
          }),
        })
      } catch {
        // Email sending is optional, don't block on failure
        console.log("Email notification skipped")
      }

      toast.success("Request submitted successfully")
      router.push("/dashboard/my-requests")
    } catch (error) {
      toast.error("Failed to submit request")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: {
    name: string
    label: string
    type: string
    required: boolean
    options?: string[]
  }) => {
    const value = formData[field.name] || ""

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
          />
        )
      case "select":
        return (
          <Select value={value} onValueChange={(v) => handleFieldChange(field.name, v)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "number":
        return (
          <Input
            id={field.name}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )
      case "date":
        return (
          <Input
            id={field.name}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        )
      default:
        return (
          <Input
            id={field.name}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Asset Request</h1>
        <p className="text-muted-foreground">Select an asset type and fill in the required information.</p>
      </div>

      {!selectedAssetType ? (
        <div className="grid gap-4 md:grid-cols-2">
          {assetTypes?.map((type) => {
            const Icon = getAssetIcon(type.icon)
            return (
              <Card
                key={type._id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  setSelectedAssetType(type._id)
                  setFormData({})
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription className="line-clamp-1">{type.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icons.userCheck className="h-4 w-4" />
                    <span>
                      {type.approvalLevels.length} approval level
                      {type.approvalLevels.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {(!assetTypes || assetTypes.length === 0) && (
            <Card className="md:col-span-2">
              <CardContent className="py-8 text-center">
                <Icons.alertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No asset types available.</p>
                <p className="text-sm text-muted-foreground">Contact your administrator to set up asset types.</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedType && (
                  <>
                    {(() => {
                      const Icon = getAssetIcon(selectedType.icon)
                      return (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      )
                    })()}
                    <div>
                      <CardTitle>{selectedType.name}</CardTitle>
                      <CardDescription>{selectedType.description}</CardDescription>
                    </div>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAssetType(null)
                  setFormData({})
                }}
              >
                <Icons.arrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {selectedType?.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}

              {selectedType && selectedType.approvalLevels.length > 0 && (
                <div className="rounded-lg border border-border p-4 bg-muted/30">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Icons.userCheck className="h-4 w-4" />
                    Approval Workflow
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {selectedType.approvalLevels.map((level, index) => (
                      <div key={level} className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-background border border-border capitalize">
                          {level.replace("_", " ")}
                        </span>
                        {index < selectedType.approvalLevels.length - 1 && <Icons.arrowRight className="h-4 w-4" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedAssetType(null)
                    setFormData({})
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <Icons.loader className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Icons.check className="h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
