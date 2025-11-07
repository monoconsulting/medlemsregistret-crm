"use client";

import type { JSX } from "react";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardMemberEntry } from "@/lib/api";

interface RecentMembersProps {
  loading: boolean;
  members: DashboardMemberEntry[] | null;
  rangeLabel: string;
}

export function RecentMembers({ loading, members, rangeLabel }: RecentMembersProps): JSX.Element {
  if (loading && !members) {
    return <RecentMembersSkeleton />;
  }

  return (
    <Card data-testid="recent-members" className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Nya kunder ({rangeLabel})
          </CardTitle>
          <p className="text-sm text-slate-500">Föreningar som nyligen blivit medlemmar.</p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-lg px-3 py-2 text-sm font-medium text-[#ea580b] hover:bg-orange-50"
        >
          <Link href="/associations">
            Visa alla
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {members && members.length > 0 ? (
          members.map((member) => (
            <article
              key={member.id}
              className="flex flex-col gap-3 rounded-lg border border-transparent bg-slate-50 p-4 transition-colors hover:border-[#ea580b]/20 hover:bg-orange-50/30 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900">{member.name}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {member.municipality ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {member.municipality}
                    </span>
                  ) : null}
                  {member.tag ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      {member.tag}
                    </Badge>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {formatMemberSince(member.memberSince)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 md:justify-end">
                <ContactedBadge contacted={member.contacted} />
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[#ea580b] hover:bg-orange-50"
                >
                  <Link href={`/associations`}>
                    Öppna
                    <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Inga nya kunder registrerade för vald period.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentMembersSkeleton(): JSX.Element {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-lg bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-2">
              <Skeleton className="h-5 w-56" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ContactedBadge({ contacted }: { contacted: boolean }): JSX.Element {
  if (contacted) {
    return (
      <Badge className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
        Kontaktad
      </Badge>
    );
  }
  return (
    <Badge className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
      Ej kontaktad
    </Badge>
  );
}

function formatMemberSince(value: string | null): string {
  if (!value) {
    return "Datum saknas";
  }
  try {
    return format(new Date(value), "PPP", { locale: sv });
  } catch {
    return value;
  }
}
