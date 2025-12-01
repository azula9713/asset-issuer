import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { components } from "./_generated/api"
import { DataModel } from "./_generated/dataModel"
import { query } from "./_generated/server"
import { betterAuth } from "better-auth"

const siteUrl = process.env.SITE_URL!

export const authComponent = createClient<DataModel>(components.betterAuth)

// Define role hierarchy levels for approval workflow
export const ROLE_HIERARCHY = {
  employee: 0,
  supervisor: 1,
  admin: 2,
  super_admin: 3,
} as const

export type UserRole = keyof typeof ROLE_HIERARCHY

export const createAuth = (ctx: GenericCtx<DataModel>, { optionsOnly } = { optionsOnly: false }) => {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex()],
    // Note: We're using a separate userProfiles table for role, supervisorId, department
    // The Convex component has a fixed schema, so we store additional data separately
  })
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx)
  },
})

// Helper to get user with profile data
export const getUserWithProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return null

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first()

    return { user, profile }
  },
})
