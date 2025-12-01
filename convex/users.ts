import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first()
  },
})

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()
  },
})

export const createOrUpdateProfile = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.optional(
      v.union(v.literal("employee"), v.literal("supervisor"), v.literal("admin"), v.literal("super_admin")),
    ),
    supervisorId: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first()

    const now = Date.now()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        role: args.role || existing.role,
        supervisorId: args.supervisorId ?? existing.supervisorId,
        department: args.department ?? existing.department,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert("userProfiles", {
      userId: args.userId,
      email: args.email,
      name: args.name,
      role: args.role || "employee",
      supervisorId: args.supervisorId,
      department: args.department,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateRole = mutation({
  args: {
    userId: v.id("userProfiles"),
    role: v.union(v.literal("employee"), v.literal("supervisor"), v.literal("admin"), v.literal("super_admin")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    })
  },
})

export const setSupervisor = mutation({
  args: {
    userId: v.id("userProfiles"),
    supervisorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      supervisorId: args.supervisorId,
      updatedAt: Date.now(),
    })
  },
})

export const list = query({
  args: {
    role: v.optional(
      v.union(v.literal("employee"), v.literal("supervisor"), v.literal("admin"), v.literal("super_admin")),
    ),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.role) {
      return await ctx.db
        .query("userProfiles")
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .collect()
    }
    if (args.department) {
      return await ctx.db
        .query("userProfiles")
        .withIndex("by_department", (q) => q.eq("department", args.department!))
        .collect()
    }
    return await ctx.db.query("userProfiles").collect()
  },
})

export const getSubordinates = query({
  args: { supervisorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .collect()
  },
})

export const getSupervisors = query({
  args: {},
  handler: async (ctx) => {
    const supervisors = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "supervisor"))
      .collect()

    const admins = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect()

    const superAdmins = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "super_admin"))
      .collect()

    return [...supervisors, ...admins, ...superAdmins]
  },
})

export const seedDemoUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("userProfiles").collect()
    if (existing.length > 0) return { message: "Users already exist" }

    const now = Date.now()

    // Create super admin
    await ctx.db.insert("userProfiles", {
      userId: "demo_super_admin",
      email: "superadmin@example.com",
      name: "Super Admin",
      role: "super_admin",
      department: "Executive",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    // Create admin
    await ctx.db.insert("userProfiles", {
      userId: "demo_admin",
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
      department: "IT",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    // Create supervisor
    await ctx.db.insert("userProfiles", {
      userId: "demo_supervisor",
      email: "supervisor@example.com",
      name: "Supervisor User",
      role: "supervisor",
      department: "Engineering",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    // Create employee
    await ctx.db.insert("userProfiles", {
      userId: "demo_employee",
      email: "employee@example.com",
      name: "Employee User",
      role: "employee",
      supervisorId: "demo_supervisor",
      department: "Engineering",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    return { message: "Demo users created" }
  },
})
