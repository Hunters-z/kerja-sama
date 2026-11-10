import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close
const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-ink/40 animate-overlay-in", className)} {...props} />
))
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content ref={ref} className={cn(
      "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-line bg-card p-5 shadow-pop animate-content-in",
      className
    )} {...props}>
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-dim hover:bg-card2 hover:text-ink focus:outline-none">
        ✕
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-left", className)} {...props} />
)
const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
)
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("font-disp text-lg font-bold", className)} {...props} />
))
DialogTitle.displayName = "DialogTitle"
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-inksoft", className)} {...props} />
))
DialogDescription.displayName = "DialogDescription"

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
