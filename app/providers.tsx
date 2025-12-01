"use client"

import type { ReactNode } from "react"
import { Toaster } from "sonner"
import { ConvexClientProvider } from "./ConvexClientProvider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexClientProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </ConvexClientProvider>
  )
}
