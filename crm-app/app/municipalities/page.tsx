"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import { logClientEvent } from "@/lib/logging";
import { api, type Municipality } from "@/lib/api";
import { cn } from "@/lib/utils";

const MunicipalityMap = dynamic(() => import("@/components/MunicipalityMap"), {
  ssr: false,
  loading: () => <div className="h-48 w-full animate-pulse rounded-xl bg-slate-100" />,
});

interface MunicipalityFilters {
  county: string;
  province: string;
  region: string;
}

interface MunicipalityStats {
  total: number;
  scanned: number;
  activeAssociations: number;
}

const DEFAULT_FILTERS: MunicipalityFilters = {
  county: "alla",
  province: "alla",
  region: "alla",
};

const SUMMARY_CARDS = [
  {
    key: "total",
    label: "Antal kommuner",
    description: "Totalt i systemet",
  },
  {
    key: "scanned",
    label: "Antal scannade kommuner",
    description: "Med föreningsdata",
  },
  {
    key: "activeAssociations",
    label: "Aktiva föreningar",
    description: "Senaste synken",
  },
] as const;

export default function MunicipalitiesPage(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [filters, setFilters] = useState<MunicipalityFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Municipality | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        logClientEvent("client.municipalities.fetch.start");
        const data = await api.getMunicipalities();
        setMunicipalities(data);
        logClientEvent("client.municipalities.fetch.success", { count: data.length });
      } catch (error) {
        logClientEvent("client.municipalities.fetch.error", {
          message: error instanceof Error ? error.message : "unknown",
        });
        console.error("Failed to load municipalities", error);
      } finally {
        setLoading(false);
      }
    };

    logClientEvent("client.municipalities.view");
    void load();
  }, []);

  const stats = useMemo<MunicipalityStats>(() => {
    const total = municipalities.length;
    const scanned = municipalities.filter((municipality) => municipality.registerStatus === "ACTIVE").length;
    const activeAssociations = municipalities.reduce((sum, municipality) => {
      const value = (municipality as any)?.activeAssociations ?? (municipality as any)?.extras?.activeAssociations;
      if (typeof value === "number" && value >= 0) {
        return sum + value;
      }
      if (typeof municipality.associationCount === "number") {
        return sum + municipality.associationCount;
      }
      return sum;
    }, 0);
    return { total, scanned, activeAssociations };
  }, [municipalities]);

  const counties = useMemo(
    () => [
      "alla",
      ...Array.from(new Set(municipalities.map((municipality) => municipality.county?.trim()).filter(Boolean))).sort(),
    ],
    [municipalities],
  );

  const provinces = useMemo(
    () => [
      "alla",
      ...Array.from(new Set(municipalities.map((municipality) => municipality.province?.trim()).filter(Boolean))).sort(),
    ],
    [municipalities],
  );

  const regions = useMemo(
    () => [
      "alla",
      ...Array.from(new Set(municipalities.map((municipality) => municipality.region?.trim()).filter(Boolean))).sort(),
    ],
    [municipalities],
  );

  const normalise = useCallback(
    (value: string) =>
      value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase(),
    [],
  );

  const filteredMunicipalities = useMemo(() => {
    const query = search.trim();
    return municipalities.filter((municipality) => {
      if (filters.county !== "alla" && municipality.county !== filters.county) {
        return false;
      }
      if (filters.province !== "alla" && municipality.province !== filters.province) {
        return false;
      }
      if (filters.region !== "alla" && municipality.region !== filters.region) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [municipality.name, municipality.county, municipality.region, municipality.province]
        .filter(Boolean)
        .map((value) => normalise(String(value)));
      const needle = normalise(query);
      return haystack.some((value) => value.includes(needle));
    });
  }, [filters, municipalities, normalise, search]);

  const handleSelectMunicipality = useCallback(
    (municipality: Municipality) => {
      setSelected(municipality);
      setSheetOpen(true);
      logClientEvent("client.municipalities.select", { municipalityId: municipality.id });
    },
    [],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelected(null);
    }
  }, []);

  return (
    <AppLayout
      title="Kommuner"
      description="Översikt över svenska kommuner och deras föreningsdata."
      actions={<HeaderActions />}
    >
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-3">
          {SUMMARY_CARDS.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              description={card.description}
              value={formatNumber(stats[card.key])}
            />
          ))}
        </section>

        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
          counties={counties}
          provinces={provinces}
          regions={regions}
        />

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-semibold text-slate-900">Kommunlista</CardTitle>
            <CardDescription>Visar {filteredMunicipalities.length} av {municipalities.length} kommuner.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <LoadingState />
            ) : (
              <ScrollArea className="max-h-[720px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Kommun</TableHead>
                      <TableHead>Kommunkod</TableHead>
                      <TableHead>Landskap</TableHead>
                      <TableHead>Län</TableHead>
                      <TableHead>Länskod</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-right">Befolkning</TableHead>
                      <TableHead className="text-right">Antal föreningar</TableHead>
                      <TableHead className="text-right">Aktiva föreningar</TableHead>
                      <TableHead className="text-right">Föreningsregister</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMunicipalities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="py-12 text-center text-sm text-slate-500">
                          Inga kommuner matchar din filtrering.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMunicipalities.map((municipality) => (
                        <MunicipalityRow
                          key={municipality.id}
                          municipality={municipality}
                          onSelect={() => handleSelectMunicipality(municipality)}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full max-w-xl border-l border-slate-200 bg-white px-0">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-2xl font-semibold text-slate-900">
              {selected?.name ?? "Ingen kommun vald"}
            </SheetTitle>
            {selected?.province ? (
              <SheetDescription className="text-sm text-slate-500">
                {selected.province} · {selected.county}
              </SheetDescription>
            ) : null}
          </SheetHeader>
          <ScrollArea className="h-full px-6 pb-8">
            {selected ? (
              <MunicipalityDetail municipality={selected} />
            ) : (
              <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Välj en kommun i listan för att se detaljer här.
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

function HeaderActions(): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="rounded-lg">
        Skapa grupp
      </Button>
      <Button className="rounded-lg bg-[#ea580b] text-white hover:bg-[#d94f0a]">
        Exportera
      </Button>
    </div>
  );
}

interface StatCardProps {
  label: string;
  description: string;
  value: string;
}

function StatCard({ label, description, value }: StatCardProps): JSX.Element {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
      </CardHeader>
    </Card>
  );
}

interface FiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: MunicipalityFilters;
  onFiltersChange: (value: MunicipalityFilters) => void;
  counties: string[];
  provinces: string[];
  regions: string[];
}

function FiltersBar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  counties,
  provinces,
  regions,
}: FiltersBarProps): JSX.Element {
  const handleFilterChange = useCallback(
    (key: keyof MunicipalityFilters, value: string) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange],
  );

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,220px))] md:items-center md:gap-4">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Sök efter kommun..."
        aria-label="Sök kommun"
        className="h-11 rounded-lg border-slate-200"
      />
      <Select value={filters.county} onValueChange={(value) => handleFilterChange("county", value)}>
        <SelectTrigger className="h-11 rounded-lg border-slate-200">
          <SelectValue placeholder="Alla län" />
        </SelectTrigger>
        <SelectContent>
          {counties.map((county) => (
            <SelectItem key={county} value={county}>
              {formatFilterOption(county)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.province} onValueChange={(value) => handleFilterChange("province", value)}>
        <SelectTrigger className="h-11 rounded-lg border-slate-200">
          <SelectValue placeholder="Alla landskap" />
        </SelectTrigger>
        <SelectContent>
          {provinces.map((province) => (
            <SelectItem key={province} value={province}>
              {formatFilterOption(province)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.region} onValueChange={(value) => handleFilterChange("region", value)}>
        <SelectTrigger className="h-11 rounded-lg border-slate-200">
          <SelectValue placeholder="Alla regioner" />
        </SelectTrigger>
        <SelectContent>
          {regions.map((region) => (
            <SelectItem key={region} value={region}>
              {formatFilterOption(region)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MunicipalityRow({
  municipality,
  onSelect,
}: {
  municipality: Municipality;
  onSelect: () => void;
}): JSX.Element {
  const associationCount = municipality.associationCount ?? (municipality as any)?.associations ?? null;
  const activeAssociations =
    (municipality as any)?.activeAssociations ??
    (municipality as any)?.extras?.activeAssociations ??
    null;

  return (
    <TableRow
      className="cursor-pointer transition-colors hover:bg-orange-50/60"
      onClick={onSelect}
    >
      <TableCell className="font-medium text-slate-900">{municipality.name ?? "Namn saknas"}</TableCell>
      <TableCell className="text-slate-600">{municipality.code ?? "–"}</TableCell>
      <TableCell>
        {municipality.province ? (
          <Badge variant="secondary" className="rounded-full bg-blue-50 text-blue-700">
            {municipality.province}
          </Badge>
        ) : (
          <span className="text-slate-400">–</span>
        )}
      </TableCell>
      <TableCell className="text-slate-600">{municipality.county ?? "–"}</TableCell>
      <TableCell className="text-slate-600">{municipality.countyCode ?? "–"}</TableCell>
      <TableCell className="text-slate-600">{municipality.region ?? "–"}</TableCell>
      <TableCell className="text-right text-slate-600">
        {municipality.population != null ? formatNumber(municipality.population) : "–"}
      </TableCell>
      <TableCell className="text-right text-slate-600">
        {associationCount != null ? formatNumber(associationCount) : "–"}
      </TableCell>
      <TableCell className="text-right text-slate-600">
        {activeAssociations != null ? formatNumber(activeAssociations) : "–"}
      </TableCell>
      <TableCell className="text-right">
        {municipality.registerUrl ? (
          <a
            href={municipality.registerUrl}
            className="text-sm font-medium text-[#ea580b] hover:underline"
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            Öppna
          </a>
        ) : (
          <span className="text-slate-400">–</span>
        )}
      </TableCell>
    </TableRow>
  );
}

interface MunicipalityDetailProps {
  municipality: Municipality;
}

function MunicipalityDetail({ municipality }: MunicipalityDetailProps): JSX.Element {
  const associationCount = municipality.associationCount ?? (municipality as any)?.associations ?? null;
  const activeAssociations =
    (municipality as any)?.activeAssociations ??
    (municipality as any)?.extras?.activeAssociations ??
    null;
  const activityRate =
    associationCount && activeAssociations
      ? `${((activeAssociations / associationCount) * 100).toFixed(1)}%`
      : "–";

  const infoItems: Array<{ label: string; value: string | null }> = [
    { label: "Region", value: municipality.region ?? "Ej angivet" },
    { label: "Län", value: municipality.county ?? "Ej angivet" },
    { label: "Landskap", value: municipality.province ?? "Ej angivet" },
    { label: "SCB-kod", value: municipality.code ?? "Ej angivet" },
    {
      label: "Befolkning",
      value: municipality.population != null ? formatNumber(municipality.population) : "Ej angivet",
    },
    { label: "Plattform", value: municipality.platform ?? "Ej angivet" },
    {
      label: "Registerstatus",
      value:
        municipality.registerStatus === "ACTIVE"
          ? "Aktiv"
          : municipality.registerStatus?.toLowerCase() ?? "Ej angivet",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <DetailStat label="Befolkning" value={municipality.population != null ? formatNumber(municipality.population) : "–"} />
        <DetailStat label="Föreningar" value={associationCount != null ? formatNumber(associationCount) : "–"} />
        <DetailStat label="Aktiva föreningar" value={activeAssociations != null ? formatNumber(activeAssociations) : "–"} />
        <DetailStat label="Aktivitetsgrad" value={activityRate} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Kommuninformation</h3>
        <div className="grid gap-3">
          {infoItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-1 text-sm text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Karta</h3>
        {municipality.latitude != null && municipality.longitude != null ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <MunicipalityMap
              latitude={municipality.latitude}
              longitude={municipality.longitude}
              municipalityName={municipality.name}
            />
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            Ingen kartposition tillgänglig för den här kommunen.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Länkar</h3>
        <div className="grid gap-2">
          <LinkButton href={municipality.homepage}>Kommunens webbplats</LinkButton>
          <LinkButton href={municipality.registerUrl}>Föreningsregister</LinkButton>
        </div>
      </section>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function LinkButton({ href, children }: { href: string | null | undefined; children: React.ReactNode }): JSX.Element {
  if (!href) {
    return (
      <span className="inline-flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#ea580b] transition-colors hover:border-[#ea580b]/40 hover:bg-orange-50"
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function LoadingState(): JSX.Element {
  return (
    <div className="space-y-2 p-6">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("sv-SE").format(value);
}

function formatFilterOption(value: string): string {
  if (value === "alla") {
    return "Alla";
  }
  return value;
}
