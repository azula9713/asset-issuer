import { cn } from "@/lib/utils"

type Status = "pending" | "approved" | "denied" | "cancelled"

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning-foreground border-warning/30",
  },
  approved: {
    label: "Approved",
    className: "bg-success/10 text-success border-success/30",
  },
  denied: {
    label: "Denied",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-muted",
  },
}

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status]

  return (
    <span
      className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.className)}
    >
      {config.label}
    </span>
  )
}
