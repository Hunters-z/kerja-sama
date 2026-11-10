import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
  { variants: { variant: {
    default: "bg-blue-soft text-blue",
    secondary: "bg-card2 text-inksoft",
    success: "bg-green-soft text-green",
    warning: "bg-gold-soft text-gold",
    destructive: "bg-red-soft text-red",
    violet: "bg-violet-soft text-violet",
    outline: "border border-line text-inksoft",
  } }, defaultVariants: { variant: "default" } }
)
function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
export { Badge, badgeVariants }
