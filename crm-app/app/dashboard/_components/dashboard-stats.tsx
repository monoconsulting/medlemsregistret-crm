"use client";

import type { JSX } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  MapPin,
  Phone,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DashboardMetric,
  DashboardMetricChange,
  DashboardSummaryMetrics,
  MunicipalityCoverageMetric,
} from "@/lib/api";

interface DashboardStatsProps {
  loading: boolean;
  summary: DashboardSummaryMetrics | null;
}

export function DashboardStats({ loading, summary }: DashboardStatsProps): JSX.Element {
  if (loading && !summary) {
    return <DashboardStatsSkeleton />;
  }

  if (!summary) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-100/60 p-10 text-center text-sm text-slate-500">
        Ingen statistik tillgänglig ännu. Försök igen senare.
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <MetricCard
        title="Aktiva föreningar"
        description="Organisationer i aktiva CRM-stadier."
        icon={<Building2 className="h-5 w-5 text-[#ea580b]" aria-hidden="true" />}
        metric={summary.activeAssociations}
        testId="kpi-active-associations"
      />
      <MunicipalityCoverageCard coverage={summary.municipalityCoverage} />
      <MetricCard
        title="Scannade föreningar"
        description="Totalt antal indexerade föreningar."
        icon={<Target className="h-5 w-5 text-[#ea580b]" aria-hidden="true" />}
        metric={summary.scannedAssociations}
        testId="kpi-scanned-associations"
      />
      <MetricCard
        title="Scannade personprofiler"
        description="Antal kontakter kopplade till föreningar."
        icon={<Users className="h-5 w-5 text-[#ea580b]" aria-hidden="true" />}
        metric={summary.contactProfiles}
        testId="kpi-contact-profiles"
      />
      <MetricCard
        title="Kontaktade föreningar"
        description="Föreningar där dialog är etablerad."
        icon={<Phone className="h-5 w-5 text-[#ea580b]" aria-hidden="true" />}
        metric={summary.contactedAssociations}
        testId="kpi-contacted-associations"
      />
      <MetricCard
        title="Kontakter denna vecka"
        description="Nya kontakter skapade under pågående vecka."
        icon={<Calendar className="h-5 w-5 text-[#ea580b]" aria-hidden="true" />}
        metric={summary.contactsThisWeek}
        testId="kpi-contacts-week"
      />
      <MetricCard
        title="Kontakter denna månad"
        description="Summering av kontakter i pågående månad."
        icon={<Calendar className="h-5 w-5 text-[#ea580b]" aria-hidden="true" />}
        metric={summary.contactsThisMonth}
        testId="kpi-contacts-month"
      />
      <MetricCard
        title="Nya kunder"
        description="Föreningar som blivit medlemmar denna period."
        icon={<UserCheck className="h-5 w-5 text-[#ea580b]" aria-hidden="true" />}
        metric={summary.newMembersThisMonth}
        testId="kpi-new-members"
      />
    </section>
  );
}

function DashboardStatsSkeleton(): JSX.Element {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="rounded-xl border border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

interface MetricCardProps {
  title: string;
  description: string;
  icon: JSX.Element;
  metric: DashboardMetric;
  testId: string;
}

function MetricCard({ title, description, icon, metric, testId }: MetricCardProps): JSX.Element {
  return (
    <Card
      data-testid={testId}
      className="rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ea580b]/10">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <p className="text-2xl font-semibold text-slate-900">
          {metric.value.toLocaleString("sv-SE")}
        </p>
        <p className="text-sm text-slate-500">{description}</p>
        <ChangeLabel change={metric.change} />
      </CardContent>
    </Card>
  );
}

function MunicipalityCoverageCard({ coverage }: { coverage: MunicipalityCoverageMetric }): JSX.Element {
  const coverageText = coverage.complete
    ? "Komplett"
    : `${coverage.value.toLocaleString("sv-SE")} av ${coverage.total.toLocaleString("sv-SE")} kommuner anslutna.`;

  return (
    <Card
      data-testid="kpi-municipalities"
      className="rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">Scannade kommuner</CardTitle>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ea580b]/10">
          <MapPin className="h-5 w-5 text-[#ea580b]" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <p className="text-2xl font-semibold text-slate-900">
          {coverage.value.toLocaleString("sv-SE")}
        </p>
        {coverage.complete ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span className="text-emerald-600 font-medium">{coverageText}</span>
            <span className="text-slate-500">
              av {coverage.total.toLocaleString("sv-SE")} totalt
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-[#ea580b]" aria-hidden="true" />
            <span>{coverageText}</span>
            <span>({coverage.completionRate.toLocaleString("sv-SE", { maximumFractionDigits: 1 })}%)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChangeLabel({ change }: { change: DashboardMetricChange }): JSX.Element {
  if (change.direction === "flat") {
    return (
      <span className="text-sm font-medium text-slate-500">
        Oförändrat jämfört med {change.context}.
      </span>
    );
  }

  const positive = change.direction === "up";
  const Icon = positive ? TrendingUp : TrendingDown;
  const tone = positive ? "text-emerald-600" : "text-red-600";
  const value = `${change.value > 0 ? "+" : ""}${change.value.toLocaleString("sv-SE")}`;

  return (
    <div className="flex items-center text-sm">
      <Icon className={`mr-1 h-4 w-4 ${tone}`} aria-hidden="true" />
      <span className={`${tone} font-medium`}>{value}</span>
      <span className="ml-1 text-slate-500">{change.context}</span>
    </div>
  );
}
