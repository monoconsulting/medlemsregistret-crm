import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Search,
  Filter,
  Download,
  Star,
  MapPin,
  Building2,
  User,
  Phone,
  Mail,
  Heart,
  X,
  Layers,
  Clock
} from "lucide-react";

interface Association {
  id: string;
  name: string;
  kommun: string;
  kategori: string;
  ansvarig: string;
  email?: string;
  phone?: string;
  contacted: boolean;
  favorite: boolean;
  notInterested: boolean;
  members?: number;
  established?: string;
  status?: string;
  pipeline?: string;
  tags?: string[];
  lastUpdated?: string;
}

const mockAssociations: Association[] = [
  {
    id: "1",
    name: "Malmö Fotbollsklubb",
    kommun: "Malmö",
    kategori: "Sport",
    ansvarig: "Lars Andersson",
    email: "lars@malmofc.se",
    phone: "040-123456",
    contacted: true,
    favorite: false,
    notInterested: false,
    members: 450,
    established: "1952",
    status: "Aktiv",
    pipeline: "Kontaktad",
    tags: ["Fotboll", "Ungdom"],
    lastUpdated: "2025-11-03"
  },
  {
    id: "2", 
    name: "Lunds Naturvänner",
    kommun: "Lund",
    kategori: "Miljö", 
    ansvarig: "Maria Svensson",
    email: "maria@lundsnatur.se",
    contacted: false,
    favorite: true,
    notInterested: false,
    members: 123,
    established: "1967",
    status: "Aktiv",
    pipeline: "Lead",
    tags: ["Natur", "Miljö"],
    lastUpdated: "2025-11-05"
  },
  {
    id: "3",
    name: "Helsingborg Teaterförening", 
    kommun: "Helsingborg",
    kategori: "Kultur",
    ansvarig: "Erik Johansson",
    email: "erik@hbgteater.se",
    phone: "042-789012",
    contacted: true,
    favorite: false,
    notInterested: false,
    members: 78,
    established: "1981",
    status: "Aktiv",
    pipeline: "Förhandling",
    tags: ["Teater", "Kultur"],
    lastUpdated: "2025-11-01"
  },
  {
    id: "4",
    name: "Växjö Ungdomscenter",
    kommun: "Växjö", 
    kategori: "Ungdom",
    ansvarig: "Anna Lindberg",
    contacted: false,
    favorite: false,
    notInterested: true,
    members: 234,
    established: "1995",
    status: "Inaktiv",
    pipeline: "Ej intresserad",
    tags: ["Ungdom"],
    lastUpdated: "2025-10-28"
  },
  {
    id: "5",
    name: "Kristianstad Handboll",
    kommun: "Kristianstad",
    kategori: "Sport", 
    ansvarig: "Per Nilsson",
    email: "per@khb.se",
    contacted: true,
    favorite: true,
    notInterested: false,
    members: 189,
    established: "1963",
    status: "Aktiv",
    pipeline: "Avslutad",
    tags: ["Handboll", "Sport"],
    lastUpdated: "2025-11-04"
  }
];

// Add more mock data to reach 50+ associations
for (let i = 6; i <= 50; i++) {
  const kommuner = ["Malmö", "Lund", "Helsingborg", "Växjö", "Kristianstad", "Karlskrona", "Ystad", "Trelleborg", "Landskrona", "Hässleholm"];
  const kategorier = ["Sport", "Kultur", "Miljö", "Ungdom", "Politik", "Religion", "Utbildning", "Hälsa"];
  const names = ["Föreningen", "Klubben", "Sällskapet", "Gruppen", "Samfundet", "Gillet", "Cirkeln", "Laget"];
  const statusOptions = ["Aktiv", "Inaktiv", "Vilande"];
  const pipelineOptions = ["Lead", "Kontaktad", "Förhandling", "Avslutad", "Ej intresserad"];
  const tagOptions = ["Sport", "Kultur", "Ungdom", "Senior", "Miljö", "Hälsa", "Utbildning"];
  
  const randomTags = [];
  const numTags = Math.floor(Math.random() * 3) + 1;
  for (let j = 0; j < numTags; j++) {
    randomTags.push(tagOptions[Math.floor(Math.random() * tagOptions.length)]);
  }
  
  const daysAgo = Math.floor(Math.random() * 30);
  const lastUpdated = new Date(2025, 10, 5 - daysAgo).toISOString().split('T')[0];
  
  mockAssociations.push({
    id: i.toString(),
    name: `${kommuner[i % kommuner.length]} ${names[i % names.length]} ${i}`,
    kommun: kommuner[i % kommuner.length],
    kategori: kategorier[i % kategorier.length],
    ansvarig: `Person ${i}`,
    email: `person${i}@example.com`,
    contacted: Math.random() > 0.5,
    favorite: Math.random() > 0.8,
    notInterested: Math.random() > 0.9,
    members: Math.floor(Math.random() * 500) + 10,
    established: (1950 + Math.floor(Math.random() * 70)).toString(),
    status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
    pipeline: pipelineOptions[Math.floor(Math.random() * pipelineOptions.length)],
    tags: randomTags,
    lastUpdated: lastUpdated
  });
}

interface AssociationsListProps {
  onAssociationSelect: (association: Association) => void;
}

export function AssociationsList({ onAssociationSelect }: AssociationsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKommun, setSelectedKommun] = useState("all");
  const [selectedKategori, setSelectedKategori] = useState("all");
  const [pageSize, setPageSize] = useState(50);
  const [selectedAssociations, setSelectedAssociations] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyContacted, setShowOnlyContacted] = useState(false);

  // Get unique values for filters
  const uniqueKommuner = [...new Set(mockAssociations.map(a => a.kommun))].sort();
  const uniqueKategorier = [...new Set(mockAssociations.map(a => a.kategori))].sort();

  // Filter associations
  const filteredAssociations = mockAssociations.filter(association => {
    const matchesSearch = association.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         association.ansvarig.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKommun = selectedKommun === "all" || association.kommun === selectedKommun;
    const matchesKategori = selectedKategori === "all" || association.kategori === selectedKategori;
    const matchesFavorites = !showOnlyFavorites || association.favorite;
    const matchesContacted = !showOnlyContacted || association.contacted;
    
    return matchesSearch && matchesKommun && matchesKategori && matchesFavorites && matchesContacted;
  });

  const displayedAssociations = filteredAssociations.slice(0, pageSize);

  const handleSelectAll = () => {
    if (selectedAssociations.length === filteredAssociations.length) {
      setSelectedAssociations([]);
    } else {
      setSelectedAssociations(filteredAssociations.map(a => a.id));
    }
  };

  const handleSelectAssociation = (id: string) => {
    setSelectedAssociations(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would make an API call
    console.log(`Toggle favorite for association ${id}`);
  };

  const toggleNotInterested = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would make an API call
    console.log(`Toggle not interested for association ${id}`);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl text-gray-900 mb-2">Föreningar</h1>
          <p className="text-gray-600">
            Visar {displayedAssociations.length} av {filteredAssociations.length} föreningar
            {selectedAssociations.length > 0 && (
              <span className="ml-2 text-orange-600">
                ({selectedAssociations.length} valda)
              </span>
            )}
          </p>
        </div>

        {/* Group Management Card - Shows when associations are selected */}
        {selectedAssociations.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 rounded-xl w-80 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-600" />
                Hantera gruppering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                {selectedAssociations.length} förening{selectedAssociations.length !== 1 ? 'ar' : ''} vald{selectedAssociations.length !== 1 ? 'a' : ''}
              </div>
              
              <Select>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Lägg till i befintlig grupp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idrottsforeningar">Idrottsföreningar</SelectItem>
                  <SelectItem value="svealand">Svealand</SelectItem>
                  <SelectItem value="kulturforeningar">Kulturföreningar</SelectItem>
                  <SelectItem value="gotaland">Götaland</SelectItem>
                  <SelectItem value="ungdomsforeningar">Ungdomsföreningar</SelectItem>
                  <SelectItem value="norrland">Norrland</SelectItem>
                  <SelectItem value="miljo">Miljö & Natur</SelectItem>
                  <SelectItem value="sociala">Sociala föreningar</SelectItem>
                  <SelectItem value="bildning">Bildningsföreningar</SelectItem>
                  <SelectItem value="hantverk">Hantverksföreningar</SelectItem>
                  <SelectItem value="religiosa">Religiösa föreningar</SelectItem>
                  <SelectItem value="tekniska">Tekniska föreningar</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                  <Layers className="w-4 h-4 mr-2" />
                  Skapa ny grupp
                </Button>
              </div>

              <div className="pt-2 border-t border-orange-200">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <Download className="w-3 h-3 mr-1" />
                    Exportera
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <Mail className="w-3 h-3 mr-1" />
                    Skicka mail
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card className="border-gray-200 rounded-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Sök föreningar eller ansvariga..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedKommun} onValueChange={setSelectedKommun}>
              <SelectTrigger>
                <SelectValue placeholder="Välj kommun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla kommuner</SelectItem>
                {uniqueKommuner.map(kommun => (
                  <SelectItem key={kommun} value={kommun}>{kommun}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedKategori} onValueChange={setSelectedKategori}>
              <SelectTrigger>
                <SelectValue placeholder="Välj kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla kategorier</SelectItem>
                {uniqueKategorier.map(kategori => (
                  <SelectItem key={kategori} value={kategori}>{kategori}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 per sida</SelectItem>
                <SelectItem value="50">50 per sida</SelectItem>
                <SelectItem value="100">100 per sida</SelectItem>
                <SelectItem value="250">250 per sida</SelectItem>
                <SelectItem value="500">500 per sida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="favorites"
                checked={showOnlyFavorites}
                onCheckedChange={setShowOnlyFavorites}
              />
              <label htmlFor="favorites" className="text-sm">Visa endast favoriter</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="contacted"
                checked={showOnlyContacted}
                onCheckedChange={setShowOnlyContacted}
              />
              <label htmlFor="contacted" className="text-sm">Visa endast kontaktade</label>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAll}
              className="ml-auto"
            >
              {selectedAssociations.length === filteredAssociations.length 
                ? "Avmarkera alla" 
                : `Markera alla (${filteredAssociations.length})`
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Association List */}
      <Card className="border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="text-gray-900">Föreningslista</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox 
                      checked={selectedAssociations.length === filteredAssociations.length && filteredAssociations.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Kommun</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Förening</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Pipeline</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Kontakt</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Föreningstyp</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Taggar</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Uppdaterad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedAssociations.map((association) => (
                  <tr 
                    key={association.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onAssociationSelect(association)}
                  >
                    <td className="px-6 py-4">
                      <Checkbox 
                        checked={selectedAssociations.includes(association.id)}
                        onCheckedChange={() => handleSelectAssociation(association.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{association.kommun}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 hover:text-orange-600 transition-colors">
                          {association.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className={
                          association.status === 'Aktiv' ? 'border-green-200 text-green-700 bg-green-50' :
                          association.status === 'Inaktiv' ? 'border-gray-200 text-gray-700 bg-gray-50' :
                          'border-yellow-200 text-yellow-700 bg-yellow-50'
                        }
                      >
                        {association.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className={
                          association.pipeline === 'Lead' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                          association.pipeline === 'Kontaktad' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                          association.pipeline === 'Förhandling' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                          association.pipeline === 'Avslutad' ? 'border-green-200 text-green-700 bg-green-50' :
                          'border-red-200 text-red-700 bg-red-50'
                        }
                      >
                        {association.pipeline}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 hover:text-orange-600 transition-colors">
                          {association.ansvarig}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className={
                          association.kategori === 'Sport' ? 'border-blue-200 text-blue-700' :
                          association.kategori === 'Kultur' ? 'border-purple-200 text-purple-700' :
                          association.kategori === 'Miljö' ? 'border-green-200 text-green-700' :
                          association.kategori === 'Ungdom' ? 'border-orange-200 text-orange-700' :
                          'border-gray-200 text-gray-700'
                        }
                      >
                        {association.kategori}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {association.tags?.slice(0, 2).map((tag, index) => (
                          <Badge 
                            key={index}
                            variant="secondary"
                            className="text-xs bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {association.tags && association.tags.length > 2 && (
                          <Badge 
                            variant="secondary"
                            className="text-xs bg-gray-100 text-gray-700"
                          >
                            +{association.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{association.lastUpdated}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredAssociations.length > pageSize && (
        <div className="flex justify-center">
          <Button 
            variant="outline"
            onClick={() => setPageSize(prev => Math.min(prev + 50, filteredAssociations.length))}
          >
            Visa fler ({Math.min(pageSize + 50, filteredAssociations.length)} av {filteredAssociations.length})
          </Button>
        </div>
      )}
    </div>
  );
}