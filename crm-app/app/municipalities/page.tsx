"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  Building2,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Download,
  Layers,
  Search as SearchIcon,
  Maximize2
} from "lucide-react";
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

type SortField = keyof Municipality;
type SortDirection = 'asc' | 'desc' | null;

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
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
    const scanned = municipalities.filter((municipality) => (municipality.associationCount ?? 0) > 0).length;
    const activeAssociations = municipalities.reduce((sum, municipality) => {
      return sum + (municipality.activeAssociations ?? 0);
    }, 0);
    return { total, scanned, activeAssociations };
  }, [municipalities]);

  const counties = useMemo(
    () => [
      "alla",
      ...Array.from(new Set(municipalities.map((municipality) => municipality.county?.trim()).filter((v): v is string => Boolean(v)))).sort(),
    ],
    [municipalities],
  );

  const provinces = useMemo(
    () => [
      "alla",
      ...Array.from(new Set(municipalities.map((municipality) => municipality.province?.trim()).filter((v): v is string => Boolean(v)))).sort(),
    ],
    [municipalities],
  );

  const regions = useMemo(
    () => [
      "alla",
      ...Array.from(new Set(municipalities.map((municipality) => municipality.region?.trim()).filter((v): v is string => Boolean(v)))).sort(),
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
    let filtered = municipalities.filter((municipality) => {
      // Filter by selected municipalities if "show selected only" is enabled
      if (showSelectedOnly && !selectedMunicipalities.includes(municipality.id)) {
        return false;
      }

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

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue, 'sv')
            : bValue.localeCompare(aValue, 'sv');
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    } else {
      // Default alphabetical sort by name
      filtered.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", 'sv'));
    }

    return filtered;
  }, [filters, municipalities, normalise, search, sortField, sortDirection, showSelectedOnly, selectedMunicipalities]);

  const handleViewMunicipalityDetails = useCallback(
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

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 text-orange-600" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="w-4 h-4 text-orange-600" />;
    }
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  }, [sortField, sortDirection]);

  const handleSelectAll = useCallback(() => {
    if (selectedMunicipalities.length === filteredMunicipalities.length) {
      setSelectedMunicipalities([]);
    } else {
      setSelectedMunicipalities(filteredMunicipalities.map(m => m.id));
    }
  }, [selectedMunicipalities.length, filteredMunicipalities]);

  const handleToggleMunicipalitySelection = useCallback((id: string) => {
    setSelectedMunicipalities(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
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

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-gray-900">Kommunlista</CardTitle>
              {selectedMunicipalities.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <Checkbox
                    checked={showSelectedOnly}
                    onCheckedChange={(checked) => setShowSelectedOnly(Boolean(checked))}
                  />
                  <span>Visa valda kommuner</span>
                </label>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Visar {filteredMunicipalities.length} av {municipalities.length} kommuner
              {selectedMunicipalities.length > 0 && (
                <span className="ml-2 text-orange-600">
                  ({selectedMunicipalities.length} valda)
                </span>
              )}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <LoadingState />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="px-6 py-3 text-left">
                        <Checkbox
                          checked={selectedMunicipalities.length === filteredMunicipalities.length && filteredMunicipalities.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Kommunnamn
                          {getSortIcon('name')}
                        </button>
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('code')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Kommunkod
                          {getSortIcon('code')}
                        </button>
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('province')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Landskap
                          {getSortIcon('province')}
                        </button>
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('county')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Län
                          {getSortIcon('county')}
                        </button>
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('countyCode')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Länskod
                          {getSortIcon('countyCode')}
                        </button>
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('region')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Region
                          {getSortIcon('region')}
                        </button>
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('population')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Befolkning
                          {getSortIcon('population')}
                        </button>
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('associationCount')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Antal föreningar
                          {getSortIcon('associationCount')}
                        </button>
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left">
                        <span className="text-sm text-gray-600">Aktiva föreningar</span>
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">
                        Föreningsregister
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200">
                    {filteredMunicipalities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="py-12 text-center text-sm text-slate-500">
                          Inga kommuner matchar din filtrering.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMunicipalities.map((municipality) => (
                        <MunicipalityRow
                          key={municipality.id}
                          municipality={municipality}
                          isSelected={selectedMunicipalities.includes(municipality.id)}
                          onCheck={() => handleToggleMunicipalitySelection(municipality.id)}
                          onOpenSheet={() => handleViewMunicipalityDetails(municipality)}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
    <div className="flex items-center gap-3">
      <Button variant="outline" className="rounded-lg">
        <Layers className="w-4 h-4 mr-2" />
        Skapa grupp
      </Button>
      <Button className="rounded-lg bg-[#ea580b] text-white hover:bg-[#d94f0a]">
        <Download className="w-4 h-4 mr-2" />
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
  const getIcon = () => {
    if (label.includes("Antal kommuner")) {
      return <MapPin className="h-4 w-4 text-orange-600" />;
    }
    if (label.includes("scannade")) {
      return <Building2 className="h-4 w-4 text-orange-600" />;
    }
    return <Building2 className="h-4 w-4 text-orange-600" />;
  };

  return (
    <Card className="border-gray-200 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm text-gray-600">{label}</CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl text-gray-900 mb-1">{value}</div>
        <p className="text-sm text-gray-500">{description}</p>
      </CardContent>
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
    <Card className="border-gray-200 rounded-xl">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Sök efter kommun..."
              aria-label="Sök kommun"
              className="pl-10"
            />
          </div>

          <Select value={filters.county} onValueChange={(value) => handleFilterChange("county", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Län" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">Alla län</SelectItem>
              {counties.filter(c => c !== "alla").map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.province} onValueChange={(value) => handleFilterChange("province", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Landskap" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">Alla landskap</SelectItem>
              {provinces.filter(p => p !== "alla").map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.region} onValueChange={(value) => handleFilterChange("region", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">Alla regioner</SelectItem>
              {regions.filter(r => r !== "alla").map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function MunicipalityRow({
  municipality,
  isSelected,
  onCheck,
  onOpenSheet,
}: {
  municipality: Municipality;
  isSelected: boolean;
  onCheck: () => void;
  onOpenSheet: () => void;
}): JSX.Element {
  const associationCount = municipality.associationCount ?? null;
  const activeAssociations = municipality.activeAssociations ?? null;

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't open sheet if clicking on a link, button, or checkbox
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'A' ||
      target.closest('a') ||
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.getAttribute('role') === 'checkbox' ||
      target.closest('[role="checkbox"]')
    ) {
      return;
    }
    onOpenSheet();
  };

  return (
    <TableRow
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={handleRowClick}
    >
      <TableCell className="px-6 py-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onCheck}
        />
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">{municipality.name ?? "Namn saknas"}</span>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <span className="text-sm text-gray-600">{municipality.code ?? "–"}</span>
      </TableCell>
      <TableCell className="px-6 py-4">
        {municipality.province ? (
          <Badge variant="outline" className="border-blue-200 text-blue-700">
            {municipality.province}
          </Badge>
        ) : (
          <span className="text-gray-400">–</span>
        )}
      </TableCell>
      <TableCell className="px-6 py-4">
        <span className="text-sm text-gray-900">{municipality.county ?? "–"}</span>
      </TableCell>
      <TableCell className="px-6 py-4">
        <span className="text-sm text-gray-600">{municipality.countyCode ?? "–"}</span>
      </TableCell>
      <TableCell className="px-6 py-4">
        <span className="text-sm text-gray-900">{municipality.region ?? "–"}</span>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {municipality.population != null ? formatNumber(municipality.population) : "–"}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {associationCount != null ? formatNumber(associationCount) : "–"}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        {activeAssociations != null ? (
          <Badge
            variant="outline"
            className="border-green-200 text-green-700 bg-green-50"
          >
            {formatNumber(activeAssociations)}
          </Badge>
        ) : (
          <span className="text-gray-400">–</span>
        )}
      </TableCell>
      <TableCell className="px-6 py-4">
        {municipality.registerUrl && municipality.platform ? (
          <a
            href={municipality.registerUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
            onClick={(e) => e.stopPropagation()}
          >
            {municipality.platform}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-gray-400">–</span>
        )}
      </TableCell>
    </TableRow>
  );
}

interface MunicipalityDetailProps {
  municipality: Municipality;
}

function MunicipalityDetail({ municipality }: MunicipalityDetailProps): JSX.Element {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const associationCount = municipality.associationCount ?? null;
  const activeAssociations = municipality.activeAssociations ?? null;
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Karta</h3>
          {municipality.latitude != null && municipality.longitude != null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMapModalOpen(true)}
              className="text-xs"
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              Förstora
            </Button>
          )}
        </div>
        {municipality.latitude != null && municipality.longitude != null ? (
          <div className="h-64 overflow-hidden rounded-xl border border-slate-200">
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

      <Dialog open={mapModalOpen} onOpenChange={setMapModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-slate-200">
            <DialogTitle>{municipality.name} - Karta</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {municipality.latitude != null && municipality.longitude != null && (
              <MunicipalityMap
                latitude={municipality.latitude}
                longitude={municipality.longitude}
                municipalityName={municipality.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
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
