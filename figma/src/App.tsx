import { useState } from "react";
import { CrmSidebar } from "./components/crm-sidebar";
import { DashboardOverview } from "./components/dashboard-overview";
import { AssociationsList } from "./components/associations-list";
import { MunicipalitiesList } from "./components/municipalities-list";
import { GroupsManagement } from "./components/groups-management";
import { AssociationDetailModal } from "./components/association-detail-modal";
import { AISettings } from "./components/ai-settings";
import { Settings } from "./components/settings";
import { UsersManagement } from "./components/users-management";
import { SystemLogs } from "./components/system-logs";
import { Button } from "./components/ui/button";
import { Bell, Search, User, Phone, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";

export default function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedAssociation, setSelectedAssociation] = useState<any>(null);
  const [associationModalOpen, setAssociationModalOpen] = useState(false);

  const handleAssociationSelect = (association: any) => {
    setSelectedAssociation(association);
    setAssociationModalOpen(true);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />;
      case "municipalities":
        return <MunicipalitiesList />;
      case "associations":
        return <AssociationsList onAssociationSelect={handleAssociationSelect} />;
      case "contacts":
        return (
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-gray-900 mb-2">Kontakter</h1>
              <p className="text-gray-500">Hantera kontaktpersoner för föreningar.</p>
              <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">Denna sektion är under utveckling...</p>
              </div>
            </div>
          </div>
        );
      case "groups":
        return <GroupsManagement />;
      case "users":
        return <UsersManagement />;
      case "import":
        return (
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-gray-900 mb-2">Import</h1>
              <p className="text-gray-500">Importera data från externa källor.</p>
              <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">Denna sektion är under utveckling...</p>
              </div>
            </div>
          </div>
        );
      case "admin":
        return (
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-gray-900 mb-2">Admin</h1>
              <p className="text-gray-500 mb-6">Systemadministration och avancerade inställningar.</p>
              <div className="grid gap-6">
                <div className="p-6 bg-white rounded-lg border border-gray-200">
                  <h2 className="text-gray-900 mb-4">AI-inställningar</h2>
                  <AISettings />
                </div>
                <div className="p-6 bg-white rounded-lg border border-gray-200">
                  <h2 className="text-gray-900 mb-4">Systeminställningar</h2>
                  <Settings />
                </div>
                <div className="p-6 bg-white rounded-lg border border-gray-200">
                  <h2 className="text-gray-900 mb-4">Systemloggar</h2>
                  <SystemLogs />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <CrmSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header - Slim design */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-900">Föreningssystem</span>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Sök i systemet..."
                className="w-64 pl-10 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Contact Icon */}
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4 text-gray-600" />
            </Button>
            
            {/* Login Icon */}
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Association Detail Modal */}
      <AssociationDetailModal
        association={selectedAssociation}
        open={associationModalOpen}
        onOpenChange={setAssociationModalOpen}
      />
    </div>
  );
}