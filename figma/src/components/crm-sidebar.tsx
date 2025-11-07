import { useState } from "react";
import {
  BarChart3,
  Users,
  Building2,
  Settings,
  User,
  FileText,
  Bot,
  Home,
  MapPin,
  UserCircle,
  Layers,
  UserCog,
  Upload,
  Shield
} from "lucide-react";
import { Badge } from "./ui/badge";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isAdmin?: boolean;
}

export function CrmSidebar({ activeSection, onSectionChange, isAdmin = true }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "municipalities", label: "Kommuner", icon: MapPin },
    { id: "associations", label: "Föreningar", icon: Building2, count: 2847 },
    { id: "contacts", label: "Kontakter", icon: UserCircle },
    { id: "groups", label: "Grupperingar", icon: Layers },
    { id: "users", label: "Systemanvändare", icon: UserCog },
    { id: "import", label: "Import", icon: Upload },
    ...(isAdmin ? [
      { id: "admin", label: "Admin", icon: Shield, adminOnly: true },
    ] : []),
  ];

  return (
    <div 
      className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          {isExpanded && (
            <h1 className="text-xl text-gray-900 whitespace-nowrap">Föreningssystem</h1>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-2">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors relative group ${
                  isActive
                    ? "bg-orange-50 text-orange-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                title={!isExpanded ? item.label : ""}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isExpanded && (
                  <>
                    <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                    {item.count && (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          isActive ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.count}
                      </Badge>
                    )}
                    {item.adminOnly && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Admin
                      </Badge>
                    )}
                  </>
                )}
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    {item.adminOnly && " (Admin)"}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200">
        <div className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer ${
          !isExpanded ? "justify-center" : ""
        }`}>
          <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
          {isExpanded && (
            <div className="flex-1">
              <p className="text-sm text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">System Administrator</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}