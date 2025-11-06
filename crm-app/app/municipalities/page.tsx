"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { logClientEvent } from "@/lib/logging";
import { api, type Municipality } from "@/lib/api";

const MunicipalityMap = dynamic(() => import("@/components/MunicipalityMap"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-muted/40" />,
});

interface MunicipalityStats {
  total: number;
  withCodes: number;
}

export default function MunicipalitiesPage(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        logClientEvent("client.municipalities.fetch.start");
        const data = await api.getMunicipalities();
        setMunicipalities(data);
        logClientEvent("client.municipalities.fetch.success", { count: data.length });
      } catch (error) {
        console.error("Failed to load municipalities", error);
        logClientEvent("client.municipalities.fetch.error", {
          message: error instanceof Error ? error.message : "unknown",
        });
      } finally {
        setLoading(false);
      }
    };

    logClientEvent("client.municipalities.view");
    void load();
  }, []);

  const normalise = useCallback(
    (value: string) =>
      value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase(),
    [],
  );

  const filteredMunicipalities = useMemo(() => {
    if (!query) {
      return municipalities;
    }
    return municipalities.filter((municipality) => {
      const name = municipality.name ?? "";
      return normalise(name).includes(normalise(query));
    });
  }, [municipalities, query, normalise]);

  useEffect(() => {
    if (!filteredMunicipalities.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((previous) => {
      if (!previous) {
        return filteredMunicipalities[0]?.id ?? null;
      }
      return filteredMunicipalities.some((municipality) => municipality.id === previous)
        ? previous
        : filteredMunicipalities[0]?.id ?? null;
    });
  }, [filteredMunicipalities]);

  const stats = useMemo<MunicipalityStats>(() => {
    const total = municipalities.length;
    const withCodes = municipalities.filter(
      (municipality) => municipality.code && municipality.code.trim() !== "",
    ).length;
    return { total, withCodes };
  }, [municipalities]);

  const selectedMunicipality = useMemo(
    () => municipalities.find((municipality) => municipality.id === selectedId) ?? null,
    [municipalities, selectedId],
  );

  const headerActions = (
    <Button
      variant="outline"
      onClick={() => router.push("/associations")}
      className="rounded-full border border-border/60 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
    >
      Utforska föreningar
    </Button>
  );

  return (
    <AppLayout title="Kommunöversikt" description="Kommuner i medlemsregistret" actions={headerActions}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="border border-border/60 bg-white/95 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Registrerade kommuner</CardTitle>
            <CardDescription>
              Sök och filtrera kommuner. Klicka på ett namn för att visa detaljer och karta.
            </CardDescription>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sök efter kommun..."
                className="max-w-sm rounded-lg"
                aria-label="Sök kommun"
              />
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  Totalt:{" "}
                  <strong className="text-foreground">{stats.total.toLocaleString("sv-SE")}</strong>
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>
                  Med SCB-kod:{" "}
                  <strong className="text-foreground">{stats.withCodes.toLocaleString("sv-SE")}</strong>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <LoadingTableState />
            ) : filteredMunicipalities.length === 0 ? (
              <div className="p-8 text-sm text-muted-foreground">
                Inga kommuner matchar din sökning. Kontrollera stavningen eller prova ett annat filter.
              </div>
            ) : (
              <ScrollArea className="max-h-[620px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Kommun</TableHead>
                      <TableHead>Plattform</TableHead>
                      <TableHead>Registerstatus</TableHead>
                      <TableHead className="text-right">Föreningar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMunicipalities.map((municipality) => (
                      <MunicipalityRow
                        key={municipality.id}
                        municipality={municipality}
                        selected={municipality.id === selectedMunicipality?.id}
                        onSelect={() => setSelectedId(municipality.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <MunicipalityDetailPanel municipality={selectedMunicipality} loading={loading} />
      </div>
    </AppLayout>
  );
}

function MunicipalityRow({
  municipality,
  selected,
  onSelect,
}: {
  municipality: Municipality;
  selected: boolean;
  onSelect: () => void;
}): JSX.Element {
  const platformBadge = municipality.platform ? (
    <Badge variant="secondary" className="rounded-full capitalize">
      {municipality.platform.toLowerCase()}
    </Badge>
  ) : (
    <span className="text-muted-foreground">Ej angivet</span>
  );

  const statusBadge = municipality.registerStatus ? (
    <Badge
      variant={municipality.registerStatus === "ACTIVE" ? "success" : "outline"}
      className="rounded-full text-xs uppercase tracking-wide"
    >
      {municipality.registerStatus === "ACTIVE" ? "Aktiv" : municipality.registerStatus.toLowerCase()}
    </Badge>
  ) : (
    <span className="text-muted-foreground">Okänt</span>
  );

  return (
    <TableRow
      onClick={onSelect}
      className={cn(
        "cursor-pointer transition-colors",
        selected ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
      )}
    >
      <TableCell className="font-medium text-foreground">
        <div className="flex flex-col">
          <span>{municipality.name ?? "Namnlös kommun"}</span>
          {municipality.code ? (
            <span className="text-xs text-muted-foreground">SCB-kod: {municipality.code}</span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>{platformBadge}</TableCell>
      <TableCell>{statusBadge}</TableCell>
      <TableCell className="text-right text-muted-foreground">
        {municipality.associationCount !== undefined
          ? municipality.associationCount.toLocaleString("sv-SE")
          : "–"}
      </TableCell>
    </TableRow>
  );
}

function MunicipalityDetailPanel({ municipality, loading }: { municipality: Municipality | null; loading: boolean }) {
  if (loading) {
    return (
      <Card className="h-full border border-border/60 bg-white/95 shadow-sm">
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!municipality) {
    return (
      <Card className="sticky top-6 h-fit border border-dashed border-border/60 bg-muted/30 p-8 text-center shadow-none">
        <CardHeader className="items-center space-y-3">
          <CardTitle className="text-lg font-semibold text-foreground">Välj en kommun</CardTitle>
          <CardDescription>
            Klicka på ett kommunnamn i listan för att visa detaljerad information och kartposition här.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const infoItems: Array<{ label: string; value: string | null }> = [
    { label: "Region", value: municipality.region },
    { label: "Län", value: municipality.county },
    { label: "SCB-kod", value: municipality.code },
    { label: "Befolkning", value: municipality.population ? municipality.population.toLocaleString("sv-SE") : null },
    { label: "Plattform", value: municipality.platform },
    { label: "Registerstatus", value: municipality.registerStatus },
  ];

  return (
    <Card className="sticky top-6 h-fit border border-border/60 bg-white/95 shadow-sm">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-xl font-semibold text-foreground">{municipality.name}</CardTitle>
          <CardDescription>Samlad information om kommunens plattform och status.</CardDescription>
          <div className="flex flex-wrap gap-2">
            {municipality.platform ? (
              <Badge variant="secondary" className="rounded-full capitalize">
                {municipality.platform.toLowerCase()}
              </Badge>
            ) : null}
            {municipality.registerStatus ? (
              <Badge
                variant={municipality.registerStatus === "ACTIVE" ? "success" : "outline"}
                className="rounded-full text-xs uppercase tracking-wide"
              >
                {municipality.registerStatus === "ACTIVE"
                  ? "Aktiv"
                  : municipality.registerStatus.toLowerCase()}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {municipality.registerUrl ? (
            <Button asChild size="sm" className="rounded-full">
              <a href={municipality.registerUrl} target="_blank" rel="noreferrer">
                Öppna register
              </a>
            </Button>
          ) : null}
          {municipality.homepage ? (
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <a href={municipality.homepage} target="_blank" rel="noreferrer">
                Kommunens webbplats
              </a>
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <dl className="grid grid-cols-1 gap-4 text-sm">
          {infoItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-border/40 bg-muted/40 p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 text-sm text-foreground">{item.value ?? "Inte angivet"}</dd>
            </div>
          ))}
        </dl>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Kartposition</h3>
          {municipality.latitude != null && municipality.longitude != null ? (
            <div className="h-64 overflow-hidden rounded-xl border border-border/40">
              <MunicipalityMap
                latitude={municipality.latitude}
                longitude={municipality.longitude}
                municipalityName={municipality.name}
              />
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 text-sm text-muted-foreground">
              Ingen kartposition tillgänglig för den här kommunen.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingTableState(): JSX.Element {
  return (
    <div className="space-y-2 p-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}
