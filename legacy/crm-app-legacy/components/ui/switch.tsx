"use client"

import { useCallback } from "react"
import type { ChangeEvent, InputHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type SwitchProps = InputHTMLAttributes<HTMLInputElement>

export function Switch({ className, onChange, checked, ...props }: SwitchProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
    },
    [onChange]
  )

  return (
    <label className={cn("relative inline-flex h-5 w-9 cursor-pointer items-center", className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        onChange={handleChange}
        checked={checked}
        {...props}
      />
      <div className="h-5 w-9 rounded-full bg-muted transition peer-checked:bg-primary" />
      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition peer-checked:translate-x-4" />
    </label>
  )
}
