import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { MunicipalityDetailSheet } from "./municipality-detail-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Search,
  Download,
  MapPin,
  Building2,
  Users,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers
} from "lucide-react";

interface Municipality {
  id: string;
  name: string;
  code: string;
  landscape: string;
  county: string;
  countyCode: string;
  region: string;
  population: number;
  totalAssociations: number;
  activeAssociations: number;
  registryUrl: string;
}

// Mock data för svenska kommuner
const mockMunicipalities: Municipality[] = [
  {
    id: "1",
    name: "Malmö",
    code: "1280",
    landscape: "Skåne",
    county: "Skåne län",
    countyCode: "12",
    region: "Region Skåne",
    population: 360000,
    totalAssociations: 1247,
    activeAssociations: 856,
    registryUrl: "https://foreningsregistret.se/malmo"
  },
  {
    id: "2",
    name: "Lund",
    code: "1281",
    landscape: "Skåne",
    county: "Skåne län",
    countyCode: "12",
    region: "Region Skåne",
    population: 127000,
    totalAssociations: 432,
    activeAssociations: 289,
    registryUrl: "https://foreningsregistret.se/lund"
  },
  {
    id: "3",
    name: "Helsingborg",
    code: "1283",
    landscape: "Skåne",
    county: "Skåne län",
    countyCode: "12",
    region: "Region Skåne",
    population: 149000,
    totalAssociations: 567,
    activeAssociations: 398,
    registryUrl: "https://foreningsregistret.se/helsingborg"
  },
  {
    id: "4",
    name: "Stockholm",
    code: "0180",
    landscape: "Uppland",
    county: "Stockholms län",
    countyCode: "01",
    region: "Region Stockholm",
    population: 978000,
    totalAssociations: 2847,
    activeAssociations: 1923,
    registryUrl: "https://foreningsregistret.se/stockholm"
  },
  {
    id: "5",
    name: "Göteborg",
    code: "1480",
    landscape: "Västergötland",
    county: "Västra Götalands län",
    countyCode: "14",
    region: "Västra Götalandsregionen",
    population: 583000,
    totalAssociations: 1654,
    activeAssociations: 1123,
    registryUrl: "https://foreningsregistret.se/goteborg"
  },
  {
    id: "6",
    name: "Uppsala",
    code: "0380",
    landscape: "Uppland",
    county: "Uppsala län",
    countyCode: "03",
    region: "Region Uppsala",
    population: 233000,
    totalAssociations: 789,
    activeAssociations: 534,
    registryUrl: "https://foreningsregistret.se/uppsala"
  },
  {
    id: "7",
    name: "Växjö",
    code: "0780",
    landscape: "Småland",
    county: "Kronobergs län",
    countyCode: "07",
    region: "Region Kronoberg",
    population: 95000,
    totalAssociations: 345,
    activeAssociations: 234,
    registryUrl: "https://foreningsregistret.se/vaxjo"
  },
  {
    id: "8",
    name: "Kristianstad",
    code: "1290",
    landscape: "Skåne",
    county: "Skåne län",
    countyCode: "12",
    region: "Region Skåne",
    population: 85000,
    totalAssociations: 298,
    activeAssociations: 189,
    registryUrl: "https://foreningsregistret.se/kristianstad"
  },
  {
    id: "9",
    name: "Karlskrona",
    code: "0880",
    landscape: "Blekinge",
    county: "Blekinge län",
    countyCode: "08",
    region: "Region Blekinge",
    population: 66000,
    totalAssociations: 234,
    activeAssociations: 167,
    registryUrl: "https://foreningsregistret.se/karlskrona"
  },
  {
    id: "10",
    name: "Ystad",
    code: "1286",
    landscape: "Skåne",
    county: "Skåne län",
    countyCode: "12",
    region: "Region Skåne",
    population: 31000,
    totalAssociations: 156,
    activeAssociations: 98,
    registryUrl: "https://foreningsregistret.se/ystad"
  },
];

type SortField = keyof Municipality;
type SortDirection = 'asc' | 'desc' | null;

export function MunicipalitiesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("all");
  const [selectedLandscape, setSelectedLandscape] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Get unique values for filters
  const uniqueCounties = [...new Set(mockMunicipalities.map(m => m.county))].sort();
  const uniqueLandscapes = [...new Set(mockMunicipalities.map(m => m.landscape))].sort();
  const uniqueRegions = [...new Set(mockMunicipalities.map(m => m.region))].sort();

  // Calculate KPIs
  const scannedMunicipalities = mockMunicipalities.filter(m => m.totalAssociations > 0).length;

  // Filter and sort municipalities
  const filteredMunicipalities = useMemo(() => {
    let filtered = mockMunicipalities.filter(municipality => {
      const matchesSearch = municipality.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           municipality.code.includes(searchTerm);
      const matchesCounty = selectedCounty === "all" || municipality.county === selectedCounty;
      const matchesLandscape = selectedLandscape === "all" || municipality.landscape === selectedLandscape;
      const matchesRegion = selectedRegion === "all" || municipality.region === selectedRegion;
      
      return matchesSearch && matchesCounty && matchesLandscape && matchesRegion;
    });

    // Sort
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
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    }

    return filtered;
  }, [searchTerm, selectedCounty, selectedLandscape, selectedRegion, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
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
  };

  const getSortIcon = (field: SortField) => {
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
  };

  const handleSelectAll = () => {
    if (selectedMunicipalities.length === filteredMunicipalities.length) {
      setSelectedMunicipalities([]);
    } else {
      setSelectedMunicipalities(filteredMunicipalities.map(m => m.id));
    }
  };

  const handleSelectMunicipality = (id: string) => {
    setSelectedMunicipalities(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleMunicipalityClick = (municipality: Municipality) => {
    setSelectedMunicipality(municipality);
    setSheetOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Kommuner</h1>
          <p className="text-gray-600">
            Översikt över svenska kommuner och deras föreningsdata
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-lg">
            <Layers className="w-4 h-4 mr-2" />
            Skapa grupp
          </Button>
          <Button variant="outline" className="rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Antal kommuner</CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">{mockMunicipalities.length}</div>
            <p className="text-sm text-gray-500">Totalt i systemet</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Antal scannade kommuner</CardTitle>
            <Building2 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">{scannedMunicipalities}</div>
            <p className="text-sm text-gray-500">Med föreningsdata</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-gray-200 rounded-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Sök efter kommun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger>
                <SelectValue placeholder="Län" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla län</SelectItem>
                {uniqueCounties.map(county => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLandscape} onValueChange={setSelectedLandscape}>
              <SelectTrigger>
                <SelectValue placeholder="Landskap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla landskap</SelectItem>
                {uniqueLandscapes.map(landscape => (
                  <SelectItem key={landscape} value={landscape}>{landscape}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla regioner</SelectItem>
                {uniqueRegions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Municipalities Table */}
      <Card className="border-gray-200 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900">Kommunlista</CardTitle>
          <p className="text-sm text-gray-600">
            Visar {filteredMunicipalities.length} av {mockMunicipalities.length} kommuner
            {selectedMunicipalities.length > 0 && (
              <span className="ml-2 text-orange-600">
                ({selectedMunicipalities.length} valda)
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox 
                      checked={selectedMunicipalities.length === filteredMunicipalities.length && filteredMunicipalities.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Kommunnamn
                      {getSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('code')}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Kommunkod
                      {getSortIcon('code')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('landscape')}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Landskap
                      {getSortIcon('landscape')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('county')}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Län
                      {getSortIcon('county')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('countyCode')}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Länskod
                      {getSortIcon('countyCode')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('region')}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Region
                      {getSortIcon('region')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('population')}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Befolkning
                      {getSortIcon('population')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('totalAssociations')}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Antal föreningar
                      {getSortIcon('totalAssociations')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('activeAssociations')}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Aktiva föreningar
                      {getSortIcon('activeAssociations')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">
                    Föreningsregister
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMunicipalities.map((municipality) => (
                  <tr 
                    key={municipality.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Checkbox 
                        checked={selectedMunicipalities.includes(municipality.id)}
                        onCheckedChange={() => handleSelectMunicipality(municipality.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleMunicipalityClick(municipality)}
                        className="flex items-center gap-2 hover:text-orange-600 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 hover:text-orange-600">{municipality.name}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{municipality.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        {municipality.landscape}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{municipality.county}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{municipality.countyCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{municipality.region}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {municipality.population.toLocaleString('sv-SE')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{municipality.totalAssociations}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className="border-green-200 text-green-700 bg-green-50"
                      >
                        {municipality.activeAssociations}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={municipality.registryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
                      >
                        Öppna
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Municipality Detail Sheet */}
      <MunicipalityDetailSheet
        municipality={selectedMunicipality}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
