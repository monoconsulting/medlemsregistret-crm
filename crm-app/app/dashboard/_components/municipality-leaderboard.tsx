"use client";

import type { JSX } from "react";
import { useMemo } from "react";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Association } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MunicipalityLeaderboardProps {
  loading: boolean;
  associations: Association[];
  className?: string;
}

interface MunicipalityEntry {
  name: string;
  count: number;
}

export function MunicipalityLeaderboard({
  loading,
  associations,
  className,
}: MunicipalityLeaderboardProps): JSX.Element {
  const leaderboard = useMemo<MunicipalityEntry[]>(() => {
    const map = new Map<string, number>();
    associations.forEach((association) => {
      const key = association.municipality_name ?? "Okänd kommun";
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [associations]);

  const total = leaderboard.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card className={cn("border border-border/60 bg-white/95 shadow-sm", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-semibold text-foreground">Aktivitet per kommun</CardTitle>
        <CardDescription>
          Kommuner med flest nyligen uppdaterade föreningar visas här.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <LeaderboardSkeleton />
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Det finns inga uppdaterade föreningar att summera ännu.
          </p>
        ) : (
          <ul className="space-y-3">
            {leaderboard.map((entry, index) => {
              const percent = total > 0 ? Math.round((entry.count / total) * 100) : 0;
              return (
                <li key={entry.name} className="rounded-xl border border-border/40 bg-white/90 p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Plats {index + 1} \u2013 {percent}% av senaste uppdateringar
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-full text-xs font-semibold">
                      {entry.count}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted/60">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${percent}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LeaderboardSkeleton(): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border/40 bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="mt-3 h-2 w-full" />
        </div>
      ))}
    </div>
  );
}
