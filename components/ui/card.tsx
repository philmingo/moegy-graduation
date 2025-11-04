import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card Component Styling Breakdown:
 *
 * Location: This Card component is used throughout the app in:
 * - Admin dashboard (student cards)
 * - Mobile scan page (login form, scanner interface)
 * - Student QR portal (QR code display)
 * - Login page (form container)
 *
 * Default Styling Classes:
 * - "rounded-lg" = Large border radius (8px)
 * - "border" = 1px border using CSS custom property --border
 * - "bg-card" = Background using CSS custom property --card
 * - "text-card-foreground" = Text color using --card-foreground
 * - "shadow-sm" = Small box shadow
 *
 * CSS Custom Properties (defined in globals.css):
 * - --card: Background color of the card
 * - --card-foreground: Text color inside the card
 * - --border: Border color
 *
 * To change ONLY the styling without affecting function:
 * 1. Override via className prop: <Card className="bg-blue-500 border-red-300" />
 * 2. Modify the default classes below
 * 3. Update CSS custom properties in globals.css
 * 4. Use theme config values instead of hardcoded classes
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
))
Card.displayName = "Card"

// The CardHeader component itself doesn't have any gradient styling in its default classes.
// The gradient you're seeing is likely coming from one of these sources:

// 1. The parent Card component might have a gradient background
// 2. A className prop passed when using CardHeader (e.g., <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500">)
// 3. CSS in globals.css or another stylesheet that targets CardHeader
// 4. Theme configuration applied through context

// To help identify where exactly the gradient is coming from, you could:
// - Check where CardHeader is used in your application
// - Look for CSS that might target .card-header
// - Inspect the element in browser dev tools to see the computed styles

// The default styling for CardHeader is very minimal:
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
