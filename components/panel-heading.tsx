import type { ComponentProps } from "react"
import { cn } from "cn"

export const panelHeadingClass =
  "flex w-full items-center justify-between gap-4 border-b bg-card px-3 py-1.5 text-sm tracking-label text-muted-foreground uppercase"

export function PanelHeading({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn(panelHeadingClass, className)} {...props} />
}
