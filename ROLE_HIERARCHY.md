# Role Hierarchy & Permissions

## Role Levels

Your application has 4 role levels defined in `convex/auth.ts:12-17`:

| Role | Level | Description |
|------|-------|-------------|
| **employee** | 0 | Basic user - can create requests |
| **supervisor** | 1 | Can approve employee requests |
| **admin** | 2 | Can manage asset types, approve supervisor requests |
| **super_admin** | 3 | Full system access - can manage users, roles, and all settings |

## Super Admin Privileges

A **super_admin** has the following capabilities:

1. **User Management**: Can assign roles to any user
2. **Asset Type Management**: Can create/edit/delete asset types
3. **Approval Override**: Can approve any request at any level
4. **System Configuration**: Can modify role hierarchy and approval workflows
5. **Full Dashboard Access**: Access to all pages including:
   - User management (`/dashboard/users`)
   - Asset types configuration (`/dashboard/asset-types`)
   - All requests view (`/dashboard/all-requests`)
   - Approval workflows (`/dashboard/approvals`)

## Creating Your First Super Admin

### Method 1: Update a User Profile Directly

After signing up, run this in the Convex dashboard console:

```javascript
// Find your user by email
const user = await ctx.db
  .query("userProfiles")
  .withIndex("by_email", (q) => q.eq("email", "your-email@example.com"))
  .first()

// Update to super_admin
if (user) {
  await ctx.db.patch(user._id, { role: "super_admin" })
}
```

### Method 2: Use the Convex Function

1. Sign up normally (you'll be assigned "employee" role by default)
2. In Convex Dashboard, run the mutation:
   - Function: `users:updateRole`
   - Arguments:
     ```json
     {
       "userId": "<your-user-profile-_id>",
       "role": "super_admin"
     }
     ```

### Method 3: Seed Demo Users (Development Only)

Run the seed function to create test users including a super admin:

```bash
npx convex run users:seedDemoUsers
```

This creates:
- `superadmin@example.com` (super_admin)
- `admin@example.com` (admin)
- `supervisor@example.com` (supervisor)
- `employee@example.com` (employee)

**Note**: These are demo users without actual authentication credentials.

## Testing the Application

### As Super Admin

1. Sign up with your email (e.g., `abc@abc.com`)
2. Manually promote yourself to super_admin using Method 1 or 2 above
3. Log out and log back in
4. You should now have access to all dashboard features

### Creating Additional Users

Once you're a super admin:
1. Go to `/dashboard/users`
2. View all registered users
3. Assign roles and supervisors as needed

## Approval Workflow

The approval system uses the role hierarchy:

1. **Employee** submits a request
2. Request requires approval based on asset type's `approvalLevels` configuration
3. Each approval level specifies which roles can approve
4. Super admins can approve at any level

## Security Notes

- Users **cannot** set their own role during signup (security enforced in `convex/auth.ts:34-36`)
- Users **cannot** set their own supervisor during signup
- Only admins and super_admins can modify user roles
- Role changes are logged with timestamps in userProfiles table

## Current Implementation Status

✅ Role-based access control structure
✅ User profile management with roles
✅ Separate userProfiles table (not in Better Auth schema)
⏳ Frontend role checks (to be implemented)
⏳ Protected routes based on roles (to be implemented)
⏳ Admin UI for role management (to be implemented)
