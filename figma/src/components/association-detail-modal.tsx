import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Users,
  Star,
  Search,
  MessageSquare,
  Clock,
  ExternalLink,
  Heart,
  UserPlus
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
}

interface Person {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

interface AssociationDetailModalProps {
  association: Association | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockPersons: Person[] = [
  {
    id: "1",
    name: "Lars Andersson", 
    role: "Ordförande",
    email: "lars@malmofc.se",
    phone: "040-123456",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    id: "2",
    name: "Anna Svensson",
    role: "Kassör", 
    email: "anna@malmofc.se",
    phone: "040-123457"
  },
  {
    id: "3",
    name: "Erik Johansson",
    role: "Sekreterare",
    email: "erik@malmofc.se"
  },
  {
    id: "4", 
    name: "Maria Lindberg",
    role: "Ledamot",
    phone: "040-123459"
  }
];

const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:30",
    user: "Admin User",
    action: "Kontakt",
    details: "Första kontakt via telefon. Intresserade av våra tjänster."
  },
  {
    id: "2", 
    timestamp: "2024-01-10 09:15",
    user: "System",
    action: "Import",
    details: "Föreningsdata importerad från kommunens register."
  },
  {
    id: "3",
    timestamp: "2024-01-08 16:45", 
    user: "Admin User",
    action: "Uppdatering",
    details: "Uppdaterade kontaktuppgifter för ansvarig person."
  },
  {
    id: "4",
    timestamp: "2024-01-05 11:20",
    user: "AI Agent",
    action: "Analys", 
    details: "Utförde utökad analys av föreningens webbplats och sociala medier."
  }
];

export function AssociationDetailModal({ 
  association, 
  open, 
  onOpenChange 
}: AssociationDetailModalProps) {
  const [newNote, setNewNote] = useState("");
  const [expandedPersons, setExpandedPersons] = useState<string[]>([]);

  if (!association) return null;

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    // In a real app, this would make an API call
    console.log("Adding note:", newNote);
    setNewNote("");
  };

  const handlePersonClick = (personId: string) => {
    console.log("Open person details for:", personId);
    // In a real app, this would open person details
  };

  const handleExtendedSearch = (type: "persons" | "organization") => {
    console.log(`Performing extended search for ${type}`);
    // In a real app, this would trigger AI search
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl sm:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-orange-600" />
            {association.name}
          </DialogTitle>
          <DialogDescription>
            Visa och hantera detaljer för {association.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Grundläggande Information</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Star className={`w-4 h-4 mr-2 ${association.favorite ? 'fill-current text-orange-500' : ''}`} />
                    {association.favorite ? 'Favorit' : 'Lägg till favorit'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4 mr-2" />
                    {association.notInterested ? 'Ej intresserad' : 'Markera ej intresserad'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Kommun:</span>
                    <span className="text-gray-900">{association.kommun}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Kategori:</span>
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
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Ansvarig:</span>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-orange-600 hover:text-orange-700"
                      onClick={() => handlePersonClick("main")}
                    >
                      {association.ansvarig}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {association.members && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Medlemmar:</span>
                      <span className="text-gray-900">{association.members}</span>
                    </div>
                  )}

                  {association.established && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Grundad:</span>
                      <span className="text-gray-900">{association.established}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge 
                      variant={association.contacted ? "default" : "secondary"}
                      className={association.contacted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
                    >
                      {association.contacted ? "Kontaktad" : "Ej kontaktad"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleExtendedSearch("organization")}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Utökad sökning - Organisation
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleExtendedSearch("persons")}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Utökad sökning - Personer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Connected Persons */}
          <Card className="border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle>Kopplade Personer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPersons.map((person) => (
                  <div 
                    key={person.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handlePersonClick(person.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={person.avatar} />
                        <AvatarFallback>{person.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-gray-900">{person.name}</p>
                        <p className="text-sm text-gray-500">{person.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {person.email && (
                        <Mail className="w-4 h-4 text-gray-400" />
                      )}
                      {person.phone && (
                        <Phone className="w-4 h-4 text-gray-400" />
                      )}
                      <ExternalLink className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Aktivitetslogg</span>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Lägg till anteckning
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Skriv en ny anteckning..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Lägg till anteckning
                  </Button>
                </div>
              </div>

              {/* Log Entries */}
              <div className="space-y-3 border-t pt-4">
                {mockLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                          <span className="text-sm text-gray-600">{log.user}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {log.timestamp}
                        </div>
                      </div>
                      <p className="text-sm text-gray-900">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}