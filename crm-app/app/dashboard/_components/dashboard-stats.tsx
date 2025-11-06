"use client";

import type { JSX } from "react";
import { useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert, Users2, MapPin, Clock3 } from "lucide-react";

interface DashboardStatsProps {
  loading: boolean;
  totalAssociations: number;
  totalMunicipalities: number;
  lastUpdatedAt: string | null;
  error: string | null;
}

export function DashboardStats({
  loading,
  totalAssociations,
  totalMunicipalities,
  lastUpdatedAt,
  error,
}: DashboardStatsProps): JSX.Element {
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return "Ingen aktivitet registrerad";
    }
    try {
      return format(new Date(lastUpdatedAt), "PPP HH:mm", { locale: sv });
    } catch {
      return lastUpdatedAt;
    }
  }, [lastUpdatedAt]);

  const lastUpdatedRelative = useMemo(() => {
    if (!lastUpdatedAt) {
      return null;
    }
    try {
      return formatDistanceToNow(new Date(lastUpdatedAt), { locale: sv, addSuffix: true });
    } catch {
      return null;
    }
  }, [lastUpdatedAt]);

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
          <TriangleAlert className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Kunde inte läsa dashboardsdata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          loading={loading}
          title="Registrerade föreningar"
          value={totalAssociations.toLocaleString("sv-SE")}
          description="Aktiva poster i CRM efter senaste synk."
          icon={<Users2 className="h-9 w-9 text-primary" aria-hidden="true" />}
        />
        <StatCard
          loading={loading}
          title="Kommuner i registret"
          value={totalMunicipalities.toLocaleString("sv-SE")}
          description="Kommuner med etablerad dataanslutning."
          icon={<MapPin className="h-9 w-9 text-primary" aria-hidden="true" />}
        />
        <StatCard
          loading={loading}
          title="Senast uppdaterad"
          value={lastUpdatedLabel}
          description={lastUpdatedRelative ?? "Ingen ny uppdatering under pågående period."}
          icon={<Clock3 className="h-9 w-9 text-primary" aria-hidden="true" />}
        />
      </section>
    </div>
  );
}

interface StatCardProps {
  loading: boolean;
  title: string;
  value: string;
  description: string;
  icon: JSX.Element;
}

function StatCard({ loading, title, value, description, icon }: StatCardProps): JSX.Element {
  return (
    <Card className="border border-border/60 bg-white/95 p-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-0">
        <div className="space-y-2">
          <CardDescription>{title}</CardDescription>
          {loading ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            <CardTitle className="text-3xl font-semibold text-foreground">{value}</CardTitle>
          )}
        </div>
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
