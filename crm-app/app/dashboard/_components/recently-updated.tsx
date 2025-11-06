"use client";

import type { JSX } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Association } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RecentlyUpdatedAssociationsProps {
  loading: boolean;
  associations: Association[];
  className?: string;
}

export function RecentlyUpdatedAssociations({
  loading,
  associations,
  className,
}: RecentlyUpdatedAssociationsProps): JSX.Element {
  const items = useMemo(() => associations.slice(0, 6), [associations]);

  return (
    <Card className={cn("border border-border/60 bg-white/95 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-0">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground">Senast uppdaterade föreningar</CardTitle>
          <CardDescription>Snabb vy över de senaste ändringarna i registret.</CardDescription>
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href="/associations">Visa alla</Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-xl border border-border/60 bg-white/90">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Förening</TableHead>
                  <TableHead>Kommun</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Senast ändrad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((association) => (
                  <TableRow key={association.id}>
                    <TableCell className="font-medium text-foreground">
                      {association.name ?? "Namnlös förening"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {association.municipality_name ?? "Okänd kommun"}
                    </TableCell>
                    <TableCell>
                      {association.type ? (
                        <Badge variant="secondary" className="capitalize">
                          {association.type.toLowerCase()}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Ej angivet</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {association.updated_at
                        ? format(new Date(association.updated_at), "PPP HH:mm", { locale: sv })
                        : "Ingen uppdatering"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState(): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-3"
        >
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-32" />
        </div>
      ))}
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        Inga föreningar har uppdaterats under den valda perioden.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Följ upp importköer eller planerade uppdateringar i integrationspanelen.
      </p>
    </div>
  );
}
