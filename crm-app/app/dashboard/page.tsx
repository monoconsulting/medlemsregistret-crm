"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";
import { api, type Association, type Municipality } from "@/lib/api";
import { logClientEvent } from "@/lib/logging";
import { DashboardStats } from "./_components/dashboard-stats";
import { RecentlyUpdatedAssociations } from "./_components/recently-updated";
import { MunicipalityLeaderboard } from "./_components/municipality-leaderboard";
import { PlaceholderCard } from "./_components/placeholder-card";

interface DashboardState {
  loading: boolean;
  error: string | null;
  associations: Association[];
  totalAssociations: number;
  municipalities: Municipality[];
}

const INITIAL_STATE: DashboardState = {
  loading: true,
  error: null,
  associations: [],
  totalAssociations: 0,
  municipalities: [],
};

export default function DashboardPage(): JSX.Element {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        logClientEvent("client.dashboard.fetch.start");
        const [associationResult, municipalityList] = await Promise.all([
          api.getAssociations({ page: 1, pageSize: 20, sort: "updated_desc" }),
          api.getMunicipalities(),
        ]);

        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          error: null,
          associations: associationResult.items,
          totalAssociations: associationResult.total,
          municipalities: municipalityList,
        });

        const firstUpdated = associationResult.items[0]?.updated_at ?? null;
        logClientEvent("client.dashboard.fetch.success", {
          associations: associationResult.items.length,
          municipalities: municipalityList.length,
          lastUpdated: firstUpdated,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Kunde inte hämta dashboardsdata";
        logClientEvent("client.dashboard.fetch.error", { message });
        setState({
          loading: false,
          error: message,
          associations: [],
          totalAssociations: 0,
          municipalities: [],
        });
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const lastUpdatedAt = useMemo<string | null>(() => {
    if (!state.associations.length) {
      return null;
    }
    return state.associations[0]?.updated_at ?? null;
  }, [state.associations]);

  const headerActions = (
    <Button
      onClick={() => router.push("/associations")}
      variant="outline"
      className="rounded-full border border-border/60 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
    >
      <ArrowRight className="mr-2 h-4 w-4" aria-hidden="true" />
      Gå till föreningar
    </Button>
  );

  return (
    <AppLayout title="Dashboard" description="Översikt över CRM-aktivitet" actions={headerActions}>
      <div className="flex flex-col gap-6">
        <DashboardStats
          loading={state.loading}
          totalAssociations={state.totalAssociations}
          totalMunicipalities={state.municipalities.length}
          lastUpdatedAt={lastUpdatedAt}
          error={state.error}
        />

        <div className="grid gap-6 lg:grid-cols-7">
          <RecentlyUpdatedAssociations
            loading={state.loading}
            associations={state.associations}
            className="lg:col-span-4"
          />
          <MunicipalityLeaderboard
            loading={state.loading}
            associations={state.associations}
            className="lg:col-span-3"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          <PlaceholderCard
            title="Aktivitetsflöde"
            description="Historiska åtgärder från redaktörer visas här när API-flödet från PHP-backenden är på plats."
            className="lg:col-span-4"
            icon="inbox"
          />
          <PlaceholderCard
            title="Kommunöversikt"
            description="Detaljerade trendgrafer och kartvisualisering återkommer när migrationsfas 2 är klar."
            className="lg:col-span-3"
            icon="map"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          <PlaceholderCard
            title="AI-assistent"
            description="Generativa förslag återkopplas när vi aktiverar OpenAI-integrationen."
            className="lg:col-span-4"
            icon="sparkles"
          />
          <PlaceholderCard
            title="Sparade grupper"
            description="Favoritlistor och segment visas här när TRPC-grupperna är portade till PHP."
            className="lg:col-span-3"
            icon="folder"
          />
        </div>
      </div>
    </AppLayout>
  );
}
