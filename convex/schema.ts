import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Asset types configuration (gate passes, licenses, etc.)
  assetTypes: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    fields: v.array(
      v.object({
        name: v.string(),
        label: v.string(),
        type: v.union(
          v.literal("text"),
          v.literal("number"),
          v.literal("date"),
          v.literal("select"),
          v.literal("textarea"),
        ),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
      }),
    ),
    requiresApproval: v.boolean(),
    approvalLevels: v.array(v.string()), // roles that need to approve
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["isActive"]),

  // Asset requests
  requests: defineTable({
    requesterId: v.string(),
    requesterName: v.string(),
    requesterEmail: v.string(),
    requesterDepartment: v.optional(v.string()),
    assetTypeId: v.id("assetTypes"),
    assetTypeName: v.string(),
    formData: v.any(), // Dynamic form data based on asset type
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied"), v.literal("cancelled")),
    currentApprovalLevel: v.number(),
    totalApprovalLevels: v.number(),
    issuedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_requester", ["requesterId"])
    .index("by_status", ["status"])
    .index("by_asset_type", ["assetTypeId"])
    .index("by_created", ["createdAt"]),

  // Approval history
  approvalHistory: defineTable({
    requestId: v.id("requests"),
    approverId: v.string(),
    approverName: v.string(),
    approverEmail: v.string(),
    approverRole: v.string(),
    action: v.union(v.literal("approved"), v.literal("denied"), v.literal("commented")),
    comment: v.optional(v.string()),
    level: v.number(),
    createdAt: v.number(),
  })
    .index("by_request", ["requestId"])
    .index("by_approver", ["approverId"]),

  // User profiles with hierarchy
  userProfiles: defineTable({
    userId: v.string(), // Better Auth user ID
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("employee"), v.literal("supervisor"), v.literal("admin"), v.literal("super_admin")),
    supervisorId: v.optional(v.string()),
    department: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_supervisor", ["supervisorId"])
    .index("by_department", ["department"]),

  // Role hierarchy configuration
  roleHierarchy: defineTable({
    name: v.string(),
    level: v.number(),
    canApprove: v.array(v.string()), // roles this role can approve for
    notifyOnAction: v.array(v.string()), // roles to notify when action taken
    isActive: v.boolean(),
  }).index("by_level", ["level"]),

  // Notification settings
  notificationSettings: defineTable({
    userId: v.string(),
    emailOnNewRequest: v.boolean(),
    emailOnApproval: v.boolean(),
    emailOnDenial: v.boolean(),
    emailDigest: v.boolean(),
  }).index("by_user", ["userId"]),
})
