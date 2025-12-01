import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("assetTypes")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect()
    }
    return await ctx.db.query("assetTypes").collect()
  },
})

export const get = query({
  args: { id: v.id("assetTypes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
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
    approvalLevels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("assetTypes", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("assetTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    fields: v.optional(
      v.array(
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
    ),
    requiresApproval: v.optional(v.boolean()),
    approvalLevels: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const seedDefaultTypes = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("assetTypes").collect()
    if (existing.length > 0) return { message: "Asset types already exist" }

    const now = Date.now()

    // Gate Pass
    await ctx.db.insert("assetTypes", {
      name: "Gate Pass",
      description: "Temporary access pass for visitors or contractors",
      icon: "door-open",
      fields: [
        { name: "visitorName", label: "Visitor Name", type: "text", required: true },
        { name: "company", label: "Company/Organization", type: "text", required: true },
        { name: "purpose", label: "Purpose of Visit", type: "textarea", required: true },
        { name: "validFrom", label: "Valid From", type: "date", required: true },
        { name: "validUntil", label: "Valid Until", type: "date", required: true },
        {
          name: "accessAreas",
          label: "Access Areas",
          type: "select",
          required: true,
          options: ["Lobby Only", "General Office", "All Areas", "Restricted"],
        },
      ],
      requiresApproval: true,
      approvalLevels: ["supervisor"],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    // Software License
    await ctx.db.insert("assetTypes", {
      name: "Software License",
      description: "Request for software licenses and subscriptions",
      icon: "key",
      fields: [
        { name: "softwareName", label: "Software Name", type: "text", required: true },
        { name: "version", label: "Version", type: "text", required: false },
        {
          name: "licenseType",
          label: "License Type",
          type: "select",
          required: true,
          options: ["Single User", "Team", "Enterprise", "Floating"],
        },
        { name: "seats", label: "Number of Seats", type: "number", required: true },
        { name: "justification", label: "Business Justification", type: "textarea", required: true },
        {
          name: "duration",
          label: "License Duration",
          type: "select",
          required: true,
          options: ["Monthly", "Annual", "Perpetual"],
        },
      ],
      requiresApproval: true,
      approvalLevels: ["supervisor", "admin"],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    // Hardware Asset
    await ctx.db.insert("assetTypes", {
      name: "Hardware Asset",
      description: "Request for computer equipment and hardware",
      icon: "laptop",
      fields: [
        {
          name: "assetCategory",
          label: "Asset Category",
          type: "select",
          required: true,
          options: ["Laptop", "Desktop", "Monitor", "Keyboard/Mouse", "Mobile Device", "Other"],
        },
        { name: "specifications", label: "Specifications", type: "textarea", required: true },
        { name: "justification", label: "Business Justification", type: "textarea", required: true },
        {
          name: "urgency",
          label: "Urgency",
          type: "select",
          required: true,
          options: ["Low", "Medium", "High", "Critical"],
        },
      ],
      requiresApproval: true,
      approvalLevels: ["supervisor", "admin"],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    // Access Card
    await ctx.db.insert("assetTypes", {
      name: "Access Card",
      description: "Building access card or badge",
      icon: "credit-card",
      fields: [
        {
          name: "cardType",
          label: "Card Type",
          type: "select",
          required: true,
          options: ["Permanent", "Temporary", "Replacement"],
        },
        {
          name: "accessLevel",
          label: "Access Level",
          type: "select",
          required: true,
          options: ["Basic", "Standard", "Enhanced", "Full Access"],
        },
        { name: "buildings", label: "Buildings", type: "text", required: true },
        { name: "reason", label: "Reason for Request", type: "textarea", required: true },
      ],
      requiresApproval: true,
      approvalLevels: ["supervisor"],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    return { message: "Default asset types created" }
  },
})
