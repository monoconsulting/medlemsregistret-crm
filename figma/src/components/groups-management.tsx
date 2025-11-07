import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Search,
  Plus,
  Layers,
  Users,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  Copy
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Group {
  id: string;
  name: string;
  description: string;
  tags: string[];
  associationCount: number;
  color: string;
}

// Mock data för grupperingar
const mockGroups: Group[] = [
  {
    id: "1",
    name: "Idrottsföreningar",
    description: "Föreningar inom sport och idrott",
    tags: ["Hockey", "Fotboll", "Basket", "Friidrott", "Simning"],
    associationCount: 234,
    color: "blue"
  },
  {
    id: "2",
    name: "Svealand",
    description: "Föreningar i Svealand",
    tags: ["Stockholm", "Uppsala", "Västmanland", "Dalarna", "Gävleborg"],
    associationCount: 456,
    color: "green"
  },
  {
    id: "3",
    name: "Kulturföreningar",
    description: "Föreningar inom kultur och konst",
    tags: ["Teater", "Musik", "Dans", "Konst", "Litteratur"],
    associationCount: 187,
    color: "purple"
  },
  {
    id: "4",
    name: "Götaland",
    description: "Föreningar i Götaland",
    tags: ["Göteborg", "Skåne", "Halland", "Blekinge", "Småland"],
    associationCount: 523,
    color: "orange"
  },
  {
    id: "5",
    name: "Ungdomsföreningar",
    description: "Föreningar för barn och unga",
    tags: ["Scouterna", "Ungdomsgård", "Fritidsklubb", "Ferieklubbar", "Lägerverksamhet"],
    associationCount: 145,
    color: "pink"
  },
  {
    id: "6",
    name: "Norrland",
    description: "Föreningar i Norrland",
    tags: ["Västerbotten", "Norrbotten", "Jämtland", "Västernorrland"],
    associationCount: 289,
    color: "indigo"
  },
  {
    id: "7",
    name: "Miljö & Natur",
    description: "Föreningar för miljö och naturvård",
    tags: ["Miljöskydd", "Naturvård", "Djurskydd", "Återvinning", "Klimat"],
    associationCount: 98,
    color: "emerald"
  },
  {
    id: "8",
    name: "Sociala föreningar",
    description: "Föreningar för social gemenskap",
    tags: ["Pensionärer", "Kvinnogrupper", "Studiecirklar", "Byalag", "Grannsamverkan"],
    associationCount: 312,
    color: "amber"
  },
  {
    id: "9",
    name: "Bildningsföreningar",
    description: "Föreningar för studier och bildning",
    tags: ["Studieförbund", "Folkbildning", "Kurser", "Seminarier", "Workshops"],
    associationCount: 156,
    color: "teal"
  },
  {
    id: "10",
    name: "Hantverksföreningar",
    description: "Föreningar för hantverk och slöjd",
    tags: ["Slöjd", "Snickeri", "Textil", "Keramik", "Smide"],
    associationCount: 76,
    color: "rose"
  },
  {
    id: "11",
    name: "Religiösa föreningar",
    description: "Föreningar med religiös inriktning",
    tags: ["Församling", "Bön", "Mission", "Kör", "Diakonala"],
    associationCount: 203,
    color: "violet"
  },
  {
    id: "12",
    name: "Tekniska föreningar",
    description: "Föreningar inom teknik och innovation",
    tags: ["IT", "Robotik", "Elektronik", "Programmering", "Maker"],
    associationCount: 89,
    color: "cyan"
  }
];

const colorClasses: Record<string, { border: string; text: string; bg: string }> = {
  blue: { border: "border-blue-200", text: "text-blue-700", bg: "bg-blue-50" },
  green: { border: "border-green-200", text: "text-green-700", bg: "bg-green-50" },
  purple: { border: "border-purple-200", text: "text-purple-700", bg: "bg-purple-50" },
  orange: { border: "border-orange-200", text: "text-orange-700", bg: "bg-orange-50" },
  pink: { border: "border-pink-200", text: "text-pink-700", bg: "bg-pink-50" },
  indigo: { border: "border-indigo-200", text: "text-indigo-700", bg: "bg-indigo-50" },
  emerald: { border: "border-emerald-200", text: "text-emerald-700", bg: "bg-emerald-50" },
  amber: { border: "border-amber-200", text: "text-amber-700", bg: "bg-amber-50" },
  teal: { border: "border-teal-200", text: "text-teal-700", bg: "bg-teal-50" },
  rose: { border: "border-rose-200", text: "text-rose-700", bg: "bg-rose-50" },
  violet: { border: "border-violet-200", text: "text-violet-700", bg: "bg-violet-50" },
  cyan: { border: "border-cyan-200", text: "text-cyan-700", bg: "bg-cyan-50" },
};

export function GroupsManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGroups = mockGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Grupperingar</h1>
          <p className="text-gray-600">
            Skapa och hantera grupperingar av föreningar baserat på kategorier och taggar
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Skapa ny gruppering
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-3 border-gray-200 rounded-xl">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Sök efter grupperingar, taggar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Totalt grupperingar</CardTitle>
            <Layers className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900">{mockGroups.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => {
          const colors = colorClasses[group.color] || colorClasses.blue;
          
          return (
            <Card key={group.id} className="border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className={`w-4 h-4 ${colors.text}`} />
                      <CardTitle className="text-lg text-gray-900">{group.name}</CardTitle>
                    </div>
                    <CardDescription className="text-sm text-gray-500">
                      {group.description}
                    </CardDescription>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Redigera
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicera
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={`${colors.border} ${colors.text} ${colors.bg}`}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{group.associationCount} föreningar</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    Visa detaljer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No results */}
      {filteredGroups.length === 0 && (
        <Card className="border-gray-200 rounded-xl">
          <CardContent className="p-12 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Inga grupperingar hittades</p>
            <p className="text-sm text-gray-400 mt-1">Prova att ändra sökkriterierna</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
