import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  FileText,
  Search,
  Download,
  Filter,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Activity,
  Shield,
  LogIn,
  UserX
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  userId?: string;
  action: string;
  category: 'system' | 'user' | 'security' | 'api' | 'error';
  level: 'info' | 'warning' | 'error' | 'success';
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

interface LoginAttempt {
  id: string;
  timestamp: string;
  email: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  reason?: string;
}

const mockSystemLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:30:25",
    user: "John Doe",
    userId: "1",
    action: "Skapade ny förening",
    category: "user",
    level: "info",
    details: "Skapade förening 'Malmö Fotbollsklubb' i systemet",
    ipAddress: "192.168.1.100"
  },
  {
    id: "2",
    timestamp: "2024-01-15 14:25:10",
    user: "Anna Svensson", 
    userId: "2",
    action: "Exporterade föreningslista",
    category: "user",
    level: "info",
    details: "Exporterade 2847 föreningar till Excel-fil",
    ipAddress: "192.168.1.101"
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:20:15",
    user: "System",
    action: "AI-sökning utförd",
    category: "api",
    level: "success",
    details: "OpenAI API-anrop för utökad föreningssökning genomförd framgångsrikt",
    ipAddress: "10.0.0.1"
  },
  {
    id: "4",
    timestamp: "2024-01-15 14:15:33",
    user: "Erik Johansson",
    userId: "3",
    action: "Uppdaterade användarroll",
    category: "security",
    level: "warning",
    details: "Ändrade roll för användare Maria Lindberg från 'user' till 'admin'",
    ipAddress: "192.168.1.102"
  },
  {
    id: "5",
    timestamp: "2024-01-15 14:10:45",
    user: "System",
    action: "Backup genomförd",
    category: "system",
    level: "success",
    details: "Automatisk databassäkerhetskopiering genomförd framgångsrikt",
    ipAddress: "10.0.0.1"
  },
  {
    id: "6",
    timestamp: "2024-01-15 14:05:20",
    user: "System",
    action: "API-fel",
    category: "error",
    level: "error",
    details: "Perplexity API-anrop misslyckades: Rate limit exceeded",
    ipAddress: "10.0.0.1"
  },
  {
    id: "7",
    timestamp: "2024-01-15 13:55:10",
    user: "Maria Lindberg",
    userId: "4",
    action: "Tog bort användare",
    category: "security",
    level: "warning",
    details: "Tog bort användaren 'test.user@company.com' från systemet",
    ipAddress: "192.168.1.103"
  }
];

const mockLoginAttempts: LoginAttempt[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:30:00",
    email: "john.doe@company.com",
    success: true,
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  {
    id: "2", 
    timestamp: "2024-01-15 14:25:15",
    email: "anna.svensson@company.com",
    success: true,
    ipAddress: "192.168.1.101", 
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:20:30",
    email: "hacker@badsite.com",
    success: false,
    ipAddress: "203.0.113.195",
    userAgent: "curl/7.68.0",
    reason: "Okänd e-postadress"
  },
  {
    id: "4",
    timestamp: "2024-01-15 14:15:45",
    email: "erik.johansson@company.com", 
    success: false,
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    reason: "Felaktigt lösenord"
  },
  {
    id: "5",
    timestamp: "2024-01-15 14:10:20",
    email: "maria.lindberg@company.com",
    success: true,
    ipAddress: "192.168.1.103",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
  },
  {
    id: "6",
    timestamp: "2024-01-15 14:05:10",
    email: "admin@company.com",
    success: false,
    ipAddress: "203.0.113.200",
    userAgent: "Python/3.9 requests/2.28.1",
    reason: "För många misslyckade försök"
  }
];

export function SystemLogs() {
  const [systemSearchTerm, setSystemSearchTerm] = useState("");
  const [loginSearchTerm, setLoginSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedLoginStatus, setSelectedLoginStatus] = useState("all");

  // Filter system logs
  const filteredSystemLogs = mockSystemLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(systemSearchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(systemSearchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(systemSearchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || log.category === selectedCategory;
    const matchesLevel = selectedLevel === "all" || log.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Filter login attempts  
  const filteredLoginAttempts = mockLoginAttempts.filter(attempt => {
    const matchesSearch = 
      attempt.email.toLowerCase().includes(loginSearchTerm.toLowerCase()) ||
      attempt.ipAddress.includes(loginSearchTerm);
    const matchesStatus = selectedLoginStatus === "all" || 
                         (selectedLoginStatus === "success" && attempt.success) ||
                         (selectedLoginStatus === "failed" && !attempt.success);
    
    return matchesSearch && matchesStatus;
  });

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getLevelBadge = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700">Framgång</Badge>;
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-700">Varning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700">Fel</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-700">Info</Badge>;
    }
  };

  const getCategoryBadge = (category: LogEntry['category']) => {
    switch (category) {
      case 'system':
        return <Badge variant="outline" className="border-gray-300">System</Badge>;
      case 'user':
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Användare</Badge>;
      case 'security':
        return <Badge variant="outline" className="border-red-300 text-red-700">Säkerhet</Badge>;
      case 'api':
        return <Badge variant="outline" className="border-purple-300 text-purple-700">API</Badge>;
      case 'error':
        return <Badge variant="outline" className="border-orange-300 text-orange-700">Fel</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Systemloggar</h1>
          <p className="text-gray-600">Övervaka systemaktivitet, användaråtgärder och säkerhetshändelser.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            Exportera loggar
          </Button>
          <Button variant="outline" className="rounded-lg">
            <Filter className="w-4 h-4 mr-2" />
            Avancerade filter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Totalt antal händelser</p>
                <p className="text-2xl text-gray-900">{mockSystemLogs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Säkerhetshändelser</p>
                <p className="text-2xl text-gray-900">{mockSystemLogs.filter(l => l.category === 'security').length}</p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inloggningar idag</p>
                <p className="text-2xl text-gray-900">{mockLoginAttempts.filter(l => l.success).length}</p>
              </div>
              <LogIn className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Misslyckade försök</p>
                <p className="text-2xl text-gray-900">{mockLoginAttempts.filter(l => !l.success).length}</p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Systemloggar
          </TabsTrigger>
          <TabsTrigger value="logins" className="flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Inloggningar
          </TabsTrigger>
          <TabsTrigger value="failed-logins" className="flex items-center gap-2">
            <UserX className="w-4 h-4" />
            Misslyckade försök
          </TabsTrigger>
        </TabsList>

        {/* System Logs Tab */}
        <TabsContent value="system" className="space-y-6">
          {/* System Logs Filters */}
          <Card className="border-gray-200 rounded-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Sök i systemloggar..."
                    value={systemSearchTerm}
                    onChange={(e) => setSystemSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrera på kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla kategorier</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="user">Användare</SelectItem>
                    <SelectItem value="security">Säkerhet</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="error">Fel</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrera på nivå" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla nivåer</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Framgång</SelectItem>
                    <SelectItem value="warning">Varning</SelectItem>
                    <SelectItem value="error">Fel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* System Logs List */}
          <Card className="border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle>Systemloggar ({filteredSystemLogs.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {filteredSystemLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                    <div className="flex-shrink-0 mt-1">
                      {getLevelIcon(log.level)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{log.action}</span>
                          {getLevelBadge(log.level)}
                          {getCategoryBadge(log.category)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {log.timestamp}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user}
                        </div>
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Attempts Tab */}
        <TabsContent value="logins" className="space-y-6">
          {/* Login Filters */}
          <Card className="border-gray-200 rounded-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Sök e-post eller IP-adress..."
                    value={loginSearchTerm}
                    onChange={(e) => setLoginSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedLoginStatus} onValueChange={setSelectedLoginStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrera på status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla försök</SelectItem>
                    <SelectItem value="success">Lyckade</SelectItem>
                    <SelectItem value="failed">Misslyckade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Login Attempts List */}
          <Card className="border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle>Inloggningsförsök ({filteredLoginAttempts.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm text-gray-600">Status</th>
                      <th className="px-6 py-3 text-left text-sm text-gray-600">E-postadress</th>
                      <th className="px-6 py-3 text-left text-sm text-gray-600">IP-adress</th>
                      <th className="px-6 py-3 text-left text-sm text-gray-600">Tidpunkt</th>
                      <th className="px-6 py-3 text-left text-sm text-gray-600">Orsak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLoginAttempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <Badge 
                            className={attempt.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                          >
                            {attempt.success ? "Lyckades" : "Misslyckades"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900">{attempt.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 font-mono text-sm">{attempt.ipAddress}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{attempt.timestamp}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{attempt.reason || "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failed Login Attempts Tab */}
        <TabsContent value="failed-logins" className="space-y-6">
          <Card className="border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <UserX className="w-5 h-5" />
                Misslyckade inloggningsförsök ({mockLoginAttempts.filter(l => !l.success).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {mockLoginAttempts.filter(attempt => !attempt.success).map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-4 hover:bg-red-50 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-gray-900">{attempt.email}</p>
                        <p className="text-sm text-gray-500">
                          {attempt.reason} • IP: {attempt.ipAddress}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{attempt.timestamp}</p>
                      <Badge className="bg-red-100 text-red-700 mt-1">
                        Säkerhetsrisk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}