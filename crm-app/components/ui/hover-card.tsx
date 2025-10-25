"use client"

import * as React from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface HoverCardContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null)

interface HoverCardProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function HoverCard({ children, open: controlledOpen, onOpenChange }: HoverCardProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(next)
      }
      onOpenChange?.(next)
    },
    [controlledOpen, onOpenChange]
  )

  const contextValue = React.useMemo<HoverCardContextValue>(() => ({ open, setOpen }), [open, setOpen])

  return (
    <HoverCardContext.Provider value={contextValue}>
      <Popover open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
    </HoverCardContext.Provider>
  )
}

const HoverCardTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverTrigger>,
  React.ComponentPropsWithoutRef<typeof PopoverTrigger>
>((props, ref) => {
  const { setOpen } = React.useContext(HoverCardContext) ?? { open: false, setOpen: () => {} }

  return (
    <PopoverTrigger
      ref={ref}
      {...props}
      onMouseEnter={(event) => {
        props.onMouseEnter?.(event)
        setOpen(true)
      }}
      onMouseLeave={(event) => {
        props.onMouseLeave?.(event)
        setOpen(false)
      }}
      onFocus={(event) => {
        props.onFocus?.(event)
        setOpen(true)
      }}
      onBlur={(event) => {
        props.onBlur?.(event)
        setOpen(false)
      }}
    />
  )
})
HoverCardTrigger.displayName = PopoverTrigger.displayName

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof PopoverContent>,
  React.ComponentPropsWithoutRef<typeof PopoverContent>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <PopoverContent
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
      className,
    )}
    {...props}
  />
))
HoverCardContent.displayName = PopoverContent.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
