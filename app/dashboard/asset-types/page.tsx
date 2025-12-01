"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Icons, getAssetIcon } from "@/components/icons"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

type FieldType = "text" | "number" | "date" | "select" | "textarea"

interface FormField {
  name: string
  label: string
  type: FieldType
  required: boolean
  options?: string[]
}

export default function AssetTypesPage() {
  const assetTypes = useQuery(api.assetTypes.list, {})
  const createAssetType = useMutation(api.assetTypes.create)
  const updateAssetType = useMutation(api.assetTypes.update)
  const seedDefaults = useMutation(api.assetTypes.seedDefaultTypes)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("file-text")
  const [fields, setFields] = useState<FormField[]>([])
  const [approvalLevels, setApprovalLevels] = useState<string[]>(["supervisor"])

  // Field form state
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldType, setNewFieldType] = useState<FieldType>("text")
  const [newFieldRequired, setNewFieldRequired] = useState(true)
  const [newFieldOptions, setNewFieldOptions] = useState("")

  const resetForm = () => {
    setName("")
    setDescription("")
    setIcon("file-text")
    setFields([])
    setApprovalLevels(["supervisor"])
    setNewFieldName("")
    setNewFieldLabel("")
    setNewFieldType("text")
    setNewFieldRequired(true)
    setNewFieldOptions("")
  }

  const handleAddField = () => {
    if (!newFieldName || !newFieldLabel) {
      toast.error("Field name and label are required")
      return
    }

    const fieldName = newFieldName.toLowerCase().replace(/\s+/g, "_")

    if (fields.some((f) => f.name === fieldName)) {
      toast.error("Field name already exists")
      return
    }

    const newField: FormField = {
      name: fieldName,
      label: newFieldLabel,
      type: newFieldType,
      required: newFieldRequired,
    }

    if (newFieldType === "select" && newFieldOptions) {
      newField.options = newFieldOptions
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    }

    setFields([...fields, newField])
    setNewFieldName("")
    setNewFieldLabel("")
    setNewFieldType("text")
    setNewFieldRequired(true)
    setNewFieldOptions("")
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!name || !description) {
      toast.error("Name and description are required")
      return
    }

    if (fields.length === 0) {
      toast.error("At least one field is required")
      return
    }

    setIsLoading(true)

    try {
      await createAssetType({
        name,
        description,
        icon,
        fields,
        requiresApproval: true,
        approvalLevels,
      })

      toast.success("Asset type created")
      setIsCreateOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create asset type")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    try {
      const result = await seedDefaults()
      toast.success(result.message)
    } catch (error) {
      toast.error("Failed to seed default types")
      console.error(error)
    }
  }

  const toggleAssetTypeActive = async (id: Id<"assetTypes">, isActive: boolean) => {
    try {
      await updateAssetType({ id, isActive: !isActive })
      toast.success(`Asset type ${!isActive ? "enabled" : "disabled"}`)
    } catch (error) {
      toast.error("Failed to update asset type")
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Asset Types</h1>
          <p className="text-muted-foreground">Configure the types of assets that can be requested.</p>
        </div>
        <div className="flex gap-2">
          {(!assetTypes || assetTypes.length === 0) && (
            <Button variant="outline" onClick={handleSeedDefaults}>
              <Icons.plus className="h-4 w-4 mr-2" />
              Seed Defaults
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Icons.plus className="h-4 w-4" />
                Create Asset Type
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Asset Type</DialogTitle>
                <DialogDescription>Define a new type of asset that users can request.</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Gate Pass, Software License"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this asset type..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select value={icon} onValueChange={setIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="door-open">Door (Gate Pass)</SelectItem>
                        <SelectItem value="key">Key (License)</SelectItem>
                        <SelectItem value="laptop">Laptop (Hardware)</SelectItem>
                        <SelectItem value="credit-card">Card (Access)</SelectItem>
                        <SelectItem value="file-text">Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Approval Levels */}
                <div className="space-y-2">
                  <Label>Approval Levels</Label>
                  <p className="text-sm text-muted-foreground">Select roles that must approve in order.</p>
                  <div className="flex flex-wrap gap-2">
                    {["supervisor", "admin", "super_admin"].map((role) => (
                      <Button
                        key={role}
                        type="button"
                        variant={approvalLevels.includes(role) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (approvalLevels.includes(role)) {
                            setApprovalLevels(approvalLevels.filter((r) => r !== role))
                          } else {
                            setApprovalLevels([...approvalLevels, role])
                          }
                        }}
                        className="capitalize"
                      >
                        {role.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                  {approvalLevels.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <span>Order:</span>
                      {approvalLevels.map((level, index) => (
                        <span key={level} className="flex items-center gap-1">
                          <Badge variant="secondary" className="capitalize">
                            {level.replace("_", " ")}
                          </Badge>
                          {index < approvalLevels.length - 1 && <Icons.arrowRight className="h-3 w-3" />}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Form Fields</Label>
                    <Badge variant="secondary">{fields.length} fields</Badge>
                  </div>

                  {/* Existing Fields */}
                  {fields.length > 0 && (
                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <div
                          key={field.name}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div>
                            <p className="font-medium">{field.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {field.type} • {field.required ? "Required" : "Optional"}
                              {field.options && ` • ${field.options.length} options`}
                            </p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveField(index)}>
                            <Icons.x className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Field Form */}
                  <div className="p-4 rounded-lg border border-dashed border-border space-y-4">
                    <p className="text-sm font-medium">Add New Field</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fieldLabel">Label</Label>
                        <Input
                          id="fieldLabel"
                          value={newFieldLabel}
                          onChange={(e) => {
                            setNewFieldLabel(e.target.value)
                            setNewFieldName(e.target.value.toLowerCase().replace(/\s+/g, "_"))
                          }}
                          placeholder="e.g., Visitor Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fieldType">Type</Label>
                        <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as FieldType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="textarea">Text Area</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {newFieldType === "select" && (
                      <div className="space-y-2">
                        <Label htmlFor="fieldOptions">Options (comma-separated)</Label>
                        <Input
                          id="fieldOptions"
                          value={newFieldOptions}
                          onChange={(e) => setNewFieldOptions(e.target.value)}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch id="fieldRequired" checked={newFieldRequired} onCheckedChange={setNewFieldRequired} />
                        <Label htmlFor="fieldRequired">Required</Label>
                      </div>
                      <Button type="button" size="sm" onClick={handleAddField}>
                        <Icons.plus className="h-4 w-4 mr-1" />
                        Add Field
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Icons.loader className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Asset Type"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Asset Types List */}
      <div className="grid gap-4 md:grid-cols-2">
        {assetTypes?.map((type) => {
          const TypeIcon = getAssetIcon(type.icon)
          return (
            <Card key={type._id} className={!type.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TypeIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription className="line-clamp-1">{type.description}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={type.isActive}
                    onCheckedChange={() => toggleAssetTypeActive(type._id, type.isActive)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Icons.fileText className="h-4 w-4 text-muted-foreground" />
                    <span>{type.fields.length} fields</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Icons.userCheck className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {type.approvalLevels.length} approval level
                      {type.approvalLevels.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {type.approvalLevels.map((level) => (
                      <Badge key={level} variant="outline" className="capitalize text-xs">
                        {level.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {(!assetTypes || assetTypes.length === 0) && (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center">
              <Icons.settings className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No asset types configured</p>
              <Button onClick={handleSeedDefaults}>
                <Icons.plus className="h-4 w-4 mr-2" />
                Create Default Asset Types
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
