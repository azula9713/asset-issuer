import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const create = mutation({
  args: {
    requesterId: v.string(),
    requesterName: v.string(),
    requesterEmail: v.string(),
    requesterDepartment: v.optional(v.string()),
    assetTypeId: v.id("assetTypes"),
    formData: v.any(),
  },
  handler: async (ctx, args) => {
    const assetType = await ctx.db.get(args.assetTypeId)
    if (!assetType) throw new Error("Asset type not found")

    const now = Date.now()
    const requestId = await ctx.db.insert("requests", {
      ...args,
      assetTypeName: assetType.name,
      status: "pending",
      currentApprovalLevel: 0,
      totalApprovalLevels: assetType.approvalLevels.length,
      createdAt: now,
      updatedAt: now,
    })

    return requestId
  },
})

export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("denied"), v.literal("cancelled")),
    ),
    requesterId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let requests
    if (args.status) {
      requests = await ctx.db
        .query("requests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect()
    } else if (args.requesterId) {
      requests = await ctx.db
        .query("requests")
        .withIndex("by_requester", (q) => q.eq("requesterId", args.requesterId!))
        .order("desc")
        .collect()
    } else {
      requests = await ctx.db.query("requests").order("desc").collect()
    }
    return requests
  },
})

export const get = query({
  args: { id: v.id("requests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getWithHistory = query({
  args: { id: v.id("requests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id)
    if (!request) return null

    const history = await ctx.db
      .query("approvalHistory")
      .withIndex("by_request", (q) => q.eq("requestId", args.id))
      .order("asc")
      .collect()

    const assetType = await ctx.db.get(request.assetTypeId)

    return {
      ...request,
      history,
      assetType,
    }
  },
})

export const getPendingForApprover = query({
  args: {
    approverRole: v.string(),
  },
  handler: async (ctx, args) => {
    const ROLE_LEVELS: Record<string, number> = {
      employee: 0,
      supervisor: 1,
      admin: 2,
      super_admin: 3,
    }

    const approverLevel = ROLE_LEVELS[args.approverRole] || 0

    const pendingRequests = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()

    // Filter requests where current approval level matches the approver's role
    const filteredRequests = []
    for (const request of pendingRequests) {
      const assetType = await ctx.db.get(request.assetTypeId)
      if (!assetType) continue

      const currentLevelRole = assetType.approvalLevels[request.currentApprovalLevel]
      const currentLevelRoleLevel = ROLE_LEVELS[currentLevelRole] || 0

      // Approver can approve if their role level is >= the required role level for current approval
      if (approverLevel >= currentLevelRoleLevel && approverLevel > 0) {
        filteredRequests.push({
          ...request,
          assetType,
          requiredRole: currentLevelRole,
        })
      }
    }

    return filteredRequests
  },
})

export const approve = mutation({
  args: {
    requestId: v.id("requests"),
    approverId: v.string(),
    approverName: v.string(),
    approverEmail: v.string(),
    approverRole: v.string(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) throw new Error("Request not found")
    if (request.status !== "pending") throw new Error("Request is not pending")

    const assetType = await ctx.db.get(request.assetTypeId)
    if (!assetType) throw new Error("Asset type not found")

    const now = Date.now()

    // Add to approval history
    await ctx.db.insert("approvalHistory", {
      requestId: args.requestId,
      approverId: args.approverId,
      approverName: args.approverName,
      approverEmail: args.approverEmail,
      approverRole: args.approverRole,
      action: "approved",
      comment: args.comment,
      level: request.currentApprovalLevel,
      createdAt: now,
    })

    const newLevel = request.currentApprovalLevel + 1
    const isFullyApproved = newLevel >= request.totalApprovalLevels

    await ctx.db.patch(args.requestId, {
      currentApprovalLevel: newLevel,
      status: isFullyApproved ? "approved" : "pending",
      issuedAt: isFullyApproved ? now : undefined,
      updatedAt: now,
    })

    return {
      isFullyApproved,
      newStatus: isFullyApproved ? "approved" : "pending",
    }
  },
})

export const deny = mutation({
  args: {
    requestId: v.id("requests"),
    approverId: v.string(),
    approverName: v.string(),
    approverEmail: v.string(),
    approverRole: v.string(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) throw new Error("Request not found")
    if (request.status !== "pending") throw new Error("Request is not pending")

    const now = Date.now()

    // Add to approval history
    await ctx.db.insert("approvalHistory", {
      requestId: args.requestId,
      approverId: args.approverId,
      approverName: args.approverName,
      approverEmail: args.approverEmail,
      approverRole: args.approverRole,
      action: "denied",
      comment: args.comment,
      level: request.currentApprovalLevel,
      createdAt: now,
    })

    await ctx.db.patch(args.requestId, {
      status: "denied",
      updatedAt: now,
    })

    return { status: "denied" }
  },
})

export const cancel = mutation({
  args: {
    requestId: v.id("requests"),
    requesterId: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) throw new Error("Request not found")
    if (request.requesterId !== args.requesterId) {
      throw new Error("Only the requester can cancel this request")
    }
    if (request.status !== "pending") {
      throw new Error("Only pending requests can be cancelled")
    }

    await ctx.db.patch(args.requestId, {
      status: "cancelled",
      updatedAt: Date.now(),
    })

    return { status: "cancelled" }
  },
})

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allRequests = await ctx.db.query("requests").collect()

    const stats = {
      total: allRequests.length,
      pending: allRequests.filter((r) => r.status === "pending").length,
      approved: allRequests.filter((r) => r.status === "approved").length,
      denied: allRequests.filter((r) => r.status === "denied").length,
      cancelled: allRequests.filter((r) => r.status === "cancelled").length,
    }

    return stats
  },
})
