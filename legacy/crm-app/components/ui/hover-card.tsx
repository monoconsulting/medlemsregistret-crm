"use client"

import * as React from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface HoverCardProps {
  trigger: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  className?: string
  openDelay?: number
  closeDelay?: number
}

export function HoverCard({
  trigger,
  children,
  side = "top",
  align = "center",
  className,
  openDelay = 80,
  closeDelay = 80,
}: HoverCardProps) {
  const [open, setOpen] = React.useState(false)
  const openTimer = React.useRef<NodeJS.Timeout | null>(null)
  const closeTimer = React.useRef<NodeJS.Timeout | null>(null)

  const handleOpen = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    if (!openTimer.current) {
      openTimer.current = setTimeout(() => {
        setOpen(true)
        openTimer.current = null
      }, openDelay)
    }
  }

  const handleClose = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (!closeTimer.current) {
      closeTimer.current = setTimeout(() => {
        setOpen(false)
        closeTimer.current = null
      }, closeDelay)
    }
  }

  React.useEffect(() => {
    return () => {
      if (openTimer.current) {
        clearTimeout(openTimer.current)
      }
      if (closeTimer.current) {
        clearTimeout(closeTimer.current)
      }
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        className={cn(
          "z-50 max-w-sm rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md",
          className,
        )}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}