"use client";

import type { JSX } from "react";
import { Inbox, Map, Folder, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PlaceholderIcon = "inbox" | "map" | "folder" | "sparkles";

const ICONS: Record<PlaceholderIcon, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  inbox: Inbox,
  map: Map,
  folder: Folder,
  sparkles: Sparkles,
};

interface PlaceholderCardProps {
  title: string;
  description: string;
  className?: string;
  icon?: PlaceholderIcon;
}

export function PlaceholderCard({
  title,
  description,
  className,
  icon = "inbox",
}: PlaceholderCardProps): JSX.Element {
  const Icon = ICONS[icon];

  return (
    <Card
      className={cn(
        "border border-dashed border-primary/30 bg-gradient-to-br from-white via-white to-primary/5 shadow-none",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-0">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
            <CardDescription>Kommer snart</CardDescription>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full text-xs uppercase tracking-wide text-primary">
          Planerad
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
