"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { trpc } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type MemberGrowthPoint = {
  label: string
  value: number
}

export function MemberGrowthChart() {
  const { data, isLoading } = trpc.association.getMemberGrowth.useQuery({ months: 12 })

  const chartData: MemberGrowthPoint[] = (data?.labels ?? []).map((label, index) => ({
    label,
    value: data?.series[index] ?? 0,
  }))

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Medlemsutveckling (12 mån)</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-48 w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Ingen medlemsdata än. Markera föreningar som medlemmar för att följa utvecklingen.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={12} width={36} />
              <Tooltip
                contentStyle={{ borderRadius: 8, backgroundColor: 'hsl(var(--card))' }}
                formatter={(value: number) => [`${value} medlemmar`, 'Totalt']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#memberGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
