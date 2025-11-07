"use client";

import type { JSX } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardPieSlice, DashboardTrendPoint } from "@/lib/api";

interface DashboardChartsProps {
  loading: boolean;
  trend: DashboardTrendPoint[] | null;
  slices: DashboardPieSlice[] | null;
}

export function DashboardCharts({ loading, trend, slices }: DashboardChartsProps): JSX.Element {
  if (loading && (!trend || !slices)) {
    return <DashboardChartsSkeleton />;
  }

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card
        data-testid="chart-trend"
        className="rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Nya kunder – veckovis trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] px-2 pb-6">
          {trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trend}
                margin={{ top: 24, right: 24, bottom: 8, left: 12 }}
              >
                <defs>
                  <linearGradient id="membersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580b" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#ea580b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="contactsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="contacts"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#contactsGradient)"
                  name="Kontakter"
                />
                <Area
                  type="monotone"
                  dataKey="members"
                  stroke="#ea580b"
                  strokeWidth={2}
                  fill="url(#membersGradient)"
                  name="Medlemmar"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Ingen trenddata tillgänglig för vald period." />
          )}
        </CardContent>
      </Card>

      <Card
        data-testid="chart-distribution"
        className="rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Kontakt vs. kund-fördelning
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[320px] flex-col items-center justify-center gap-6 px-2 pb-6">
          {slices && slices.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie
                    data={slices}
                    innerRadius={60}
                    outerRadius={95}
                    dataKey="value"
                    stroke="none"
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString("sv-SE")}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                {slices.map((slice) => (
                  <div key={slice.name} className="flex items-center gap-2">
                    <span
                      className="inline-flex h-3 w-3 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span>
                      {slice.name}: {slice.value.toLocaleString("sv-SE")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState message="Ingen fördelningsdata tillgänglig just nu." />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function DashboardChartsSkeleton(): JSX.Element {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {[0, 1].map((index) => (
        <Card key={index} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="h-[320px] space-y-4">
            <Skeleton className="h-full w-full rounded-xl" />
            {index === 1 ? <Skeleton className="h-4 w-48 self-center" /> : null}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function EmptyState({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-100/60 p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
