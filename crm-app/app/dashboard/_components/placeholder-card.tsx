"use client"

import type { JSX } from "react"
import { Inbox, Map, Folder, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PlaceholderIcon = "inbox" | "map" | "folder" | "sparkles"

const ICONS: Record<PlaceholderIcon, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  inbox: Inbox,
  map: Map,
  folder: Folder,
  sparkles: Sparkles,
}

interface PlaceholderCardProps {
  title: string
  description: string
  className?: string
  icon?: PlaceholderIcon
}

export function PlaceholderCard(props: PlaceholderCardProps): JSX.Element {
  const { title, description, className, icon = "inbox" } = props
  const Icon = ICONS[icon]

  return (
    <Card className={cn("border bg-white shadow-sm", className)}>
      <CardHeader className="flex items-center gap-3">
        <span className="rounded-full bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">Kommer snart</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
