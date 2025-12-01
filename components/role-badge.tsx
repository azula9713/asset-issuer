import { cn } from "@/lib/utils"
import { Icons } from "./icons"

type Role = "employee" | "supervisor" | "admin" | "super_admin"

const roleConfig: Record<Role, { label: string; className: string; icon: keyof typeof Icons }> = {
  employee: {
    label: "Employee",
    className: "bg-secondary text-secondary-foreground",
    icon: "user",
  },
  supervisor: {
    label: "Supervisor",
    className: "bg-info/10 text-info border-info/30",
    icon: "userCheck",
  },
  admin: {
    label: "Admin",
    className: "bg-accent/10 text-accent border-accent/30",
    icon: "userCog",
  },
  super_admin: {
    label: "Super Admin",
    className: "bg-primary/10 text-primary border-primary/30",
    icon: "shield",
  },
}

export function RoleBadge({ role }: { role: Role }) {
  const config = roleConfig[role]
  const Icon = Icons[config.icon]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
