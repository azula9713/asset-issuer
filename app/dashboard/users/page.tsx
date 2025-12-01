"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Icons } from "@/components/icons"
import { RoleBadge } from "@/components/role-badge"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"
import { format } from "date-fns"

type UserRole = "employee" | "supervisor" | "admin" | "super_admin"

interface UserProfile {
  _id: Id<"userProfiles">
  userId: string
  email: string
  name: string
  role: UserRole
  supervisorId?: string
  department?: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [newRole, setNewRole] = useState<UserRole>("employee")
  const [newSupervisorId, setNewSupervisorId] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState(false)

  const users = useQuery(api.users.list, {}) as UserProfile[] | undefined
  const supervisors = useQuery(api.users.getSupervisors) as UserProfile[] | undefined
  const updateRole = useMutation(api.users.updateRole)
  const setSupervisor = useMutation(api.users.setSupervisor)
  const seedDemoUsers = useMutation(api.users.seedDemoUsers)

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setNewSupervisorId(user.supervisorId || "")
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setIsUpdating(true)

    try {
      if (newRole !== selectedUser.role) {
        await updateRole({
          userId: selectedUser._id,
          role: newRole,
        })
      }

      if (newSupervisorId !== (selectedUser.supervisorId || "")) {
        await setSupervisor({
          userId: selectedUser._id,
          supervisorId: newSupervisorId || undefined,
        })
      }

      toast.success("User updated successfully")
      setSelectedUser(null)
    } catch (error) {
      toast.error("Failed to update user")
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSeedUsers = async () => {
    try {
      const result = await seedDemoUsers()
      toast.success(result.message)
    } catch (error) {
      toast.error("Failed to seed users")
      console.error(error)
    }
  }

  const stats = {
    total: users?.length || 0,
    employees: users?.filter((u) => u.role === "employee").length || 0,
    supervisors: users?.filter((u) => u.role === "supervisor").length || 0,
    admins: users?.filter((u) => u.role === "admin" || u.role === "super_admin").length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and hierarchy assignments.</p>
        </div>
        {(!users || users.length === 0) && (
          <Button onClick={handleSeedUsers}>
            <Icons.plus className="h-4 w-4 mr-2" />
            Seed Demo Users
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.employees}</div>
            <p className="text-sm text-muted-foreground">Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.supervisors}</div>
            <p className="text-sm text-muted-foreground">Supervisors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-sm text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!filteredUsers || filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Icons.users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No users found</p>
              {(search || roleFilter !== "all") && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch("")
                    setRoleFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const supervisor = supervisors?.find((s) => s.userId === user.supervisorId)
                    return (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>{user.department || "-"}</TableCell>
                        <TableCell>{supervisor ? supervisor.name : "-"}</TableCell>
                        <TableCell>{format(user.createdAt, "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Icons.userCog className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user role and supervisor assignment.</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{selectedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newRole === "employee" && (
                <div className="space-y-2">
                  <Label htmlFor="supervisor">Supervisor</Label>
                  <Select value={newSupervisorId} onValueChange={setNewSupervisorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Supervisor</SelectItem>
                      {supervisors?.map((sup) => (
                        <SelectItem key={sup.userId} value={sup.userId}>
                          {sup.name} ({sup.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Icons.loader className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
