import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import {
  MapPin,
  Users,
  Building2,
  Phone,
  Mail,
  Globe,
  Calendar,
  TrendingUp,
  ExternalLink,
  Navigation,
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

interface MunicipalityDetailSheetProps {
  municipality: Municipality | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MunicipalityDetailSheet({
  municipality,
  open,
  onOpenChange,
}: MunicipalityDetailSheetProps) {
  if (!municipality) return null;

  // Calculate some demo statistics
  const associationGrowth = ((municipality.activeAssociations / municipality.totalAssociations) * 100).toFixed(1);
  const populationPerAssociation = Math.round(municipality.population / municipality.totalAssociations);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-orange-600" />
                {municipality.name}
              </SheetTitle>
              <p className="text-sm text-gray-500 mt-1">
                Kommunkod: {municipality.code}
              </p>
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              {municipality.landscape}
            </Badge>
          </div>
        </SheetHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Upper half - Information */}
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-gray-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-gray-500">Befolkning</span>
                  </div>
                  <p className="text-xl text-gray-900">
                    {municipality.population.toLocaleString('sv-SE')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-gray-500">Föreningar</span>
                  </div>
                  <p className="text-xl text-gray-900">
                    {municipality.totalAssociations}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-500">Aktiva</span>
                  </div>
                  <p className="text-xl text-gray-900">
                    {municipality.activeAssociations}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Map */}
            <Card className="border-gray-200 rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  Karta över {municipality.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full h-96 bg-gray-100">
                  {/* Map iframe */}
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(municipality.name + ' kommun, Sverige')}&zoom=10`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Association Statistics */}
            <Card className="border-gray-200 rounded-xl">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-600" />
                  Föreningsstatistik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Totalt antal föreningar</span>
                  <span className="text-sm text-gray-900">{municipality.totalAssociations}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Aktiva i systemet</span>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    {municipality.activeAssociations}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Aktivitetsgrad</span>
                  <span className="text-sm text-green-600">{associationGrowth}%</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Invånare per förening</span>
                  <span className="text-sm text-gray-900">{populationPerAssociation}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Links */}
            <Card className="border-gray-200 rounded-xl">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-600" />
                  Länkar och kontakt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href={`https://www.${municipality.name.toLowerCase()}.se`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-900">Kommunens webbplats</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
                
                <a
                  href={municipality.registryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-900">Föreningsregister</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-900">Växel: 0{municipality.countyCode}-XXX XX XX</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-900">info@{municipality.name.toLowerCase()}.se</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                <Building2 className="w-4 h-4 mr-2" />
                Visa föreningar
              </Button>
              <Button variant="outline" className="flex-1">
                <Layers className="w-4 h-4 mr-2" />
                Lägg till i grupp
              </Button>
            </div>

            {/* Geographic Information */}
            <Card className="border-gray-200 rounded-xl">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-orange-600" />
                  Geografisk information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Landskap</span>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {municipality.landscape}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Län</span>
                  <span className="text-sm text-gray-900">{municipality.county}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Länskod</span>
                  <span className="text-sm text-gray-900">{municipality.countyCode}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Region</span>
                  <span className="text-sm text-gray-900">{municipality.region}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
