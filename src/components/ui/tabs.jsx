import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root
const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn("inline-flex h-10 items-center justify-center rounded-xl bg-card2 p-1 text-inksoft", className)} {...props} />
))
TabsList.displayName = "TabsList"
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-soft",
    className
  )} {...props} />
))
TabsTrigger.displayName = "TabsTrigger"
const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("mt-3 focus-visible:outline-none", className)} {...props} />
))
TabsContent.displayName = "TabsContent"
export { Tabs, TabsList, TabsTrigger, TabsContent }
