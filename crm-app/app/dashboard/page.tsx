"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  api,
  type DashboardOverviewResponse,
  type DashboardRangeKey,
} from "@/lib/api";
import { logClientEvent } from "@/lib/logging";
import { DashboardStats } from "./_components/dashboard-stats";
import { DashboardCharts } from "./_components/dashboard-charts";
import { RecentMembers } from "./_components/recent-members";

interface DashboardState {
  loading: boolean;
  error: string | null;
  data: DashboardOverviewResponse | null;
}

const RANGE_OPTIONS: Array<{ key: DashboardRangeKey; label: string }> = [
  { key: "this_month", label: "Denna månad" },
  { key: "last_30_days", label: "Senaste 30 dagarna" },
  { key: "this_quarter", label: "Detta kvartal" },
  { key: "this_year", label: "Detta år" },
];

const DEFAULT_RANGE: DashboardRangeKey = "this_month";

export default function DashboardPage(): JSX.Element {
  const [range, setRange] = useState<DashboardRangeKey>(DEFAULT_RANGE);
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        logClientEvent("client.dashboard.fetch.start", { range });
        const result = await api.getDashboardOverview(range);
        if (cancelled) {
          return;
        }
        setState({ loading: false, error: null, data: result });
        logClientEvent("client.dashboard.fetch.success", {
          range,
          trendPoints: result.charts.newMembersTrend.length,
          recentMembers: result.recentMembers.length,
          lastUpdated: result.lastUpdated ?? null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Kunde inte hämta dashboardsdata";
        setState({ loading: false, error: message, data: null });
        logClientEvent("client.dashboard.fetch.error", { range, message });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [range]);

  const rangeLabel = useMemo(() => {
    if (state.data?.range.label) {
      return state.data.range.label;
    }
    return RANGE_OPTIONS.find((option) => option.key === range)?.label ?? "";
  }, [range, state.data?.range.label]);

  const lastUpdatedLabel = useMemo(() => {
    if (!state.data?.lastUpdated) {
      return null;
    }
    try {
      return format(new Date(state.data.lastUpdated), "PPP HH:mm", { locale: sv });
    } catch {
      return state.data.lastUpdated;
    }
  }, [state.data?.lastUpdated]);

  const handleRangeSelect = useCallback((value: string) => {
    setRange(value as DashboardRangeKey);
  }, []);

  const handleExport = useCallback(() => {
    if (!state.data) {
      return;
    }
    try {
      logClientEvent("client.dashboard.export.start", { range });
      const payload = {
        generatedAt: new Date().toISOString(),
        range: state.data.range,
        summary: state.data.summary,
        charts: state.data.charts,
        recentMembers: state.data.recentMembers,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-rapport-${range}-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      logClientEvent("client.dashboard.export.success", { range });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Okänt exportfel";
      logClientEvent("client.dashboard.export.error", { range, message });
      console.error("Misslyckades att exportera dashboardrapport:", error);
    }
  }, [range, state.data]);

  return (
    <AppLayout title="" description="">
      <div className="space-y-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">
              Översikt av föreningsdata och systemaktivitet.
            </p>
            {lastUpdatedLabel ? (
              <p className="text-xs text-slate-400">
                Senast uppdaterad {lastUpdatedLabel}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={range} onValueChange={handleRangeSelect}>
              <SelectTrigger className="flex w-48 items-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-[#ea580b]/40 focus:ring-0">
                <Calendar className="h-4 w-4 text-[#ea580b]" aria-hidden="true" />
                <SelectValue placeholder="Denna månad" />
              </SelectTrigger>
              <SelectContent align="end">
                {RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              className="rounded-lg bg-[#ea580b] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d94f0a]"
            >
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Exportera rapport
            </Button>
          </div>
        </section>

        {state.error ? (
          <Alert
            variant="destructive"
            className="rounded-xl border border-red-200 bg-red-50 text-red-700"
          >
            <AlertTitle>Kunde inte ladda dashboarden</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <DashboardStats loading={state.loading} summary={state.data?.summary ?? null} />

        <DashboardCharts
          loading={state.loading}
          trend={state.data?.charts.newMembersTrend ?? null}
          slices={state.data?.charts.contactsVsMembers ?? null}
        />

        <RecentMembers
          loading={state.loading}
          members={state.data?.recentMembers ?? null}
          rangeLabel={rangeLabel}
        />
      </div>
    </AppLayout>
  );
}
