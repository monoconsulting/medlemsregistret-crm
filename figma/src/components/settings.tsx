import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
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
  Settings as SettingsIcon,
  Globe,
  Database,
  Shield,
  Bell,
  Mail,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search
} from "lucide-react";

interface WebscrapingAgent {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency: string;
  lastRun?: string;
  status: 'running' | 'stopped' | 'error' | 'scheduled';
  targetUrl?: string;
  maxPages?: number;
}

export function Settings() {
  const [webscrapingAgents, setWebscrapingAgents] = useState<WebscrapingAgent[]>([
    {
      id: "kommun-scraper",
      name: "Kommunföreningar Scraper",
      description: "Scannar kommunernas officiella föreningsregister",
      enabled: true,
      frequency: "daily",
      lastRun: "2024-01-15 02:00",
      status: "scheduled",
      targetUrl: "https://kommun.se/foreningar",
      maxPages: 100
    },
    {
      id: "social-media-scraper", 
      name: "Sociala Medier Scraper",
      description: "Söker föreningsaktivitet på sociala medier",
      enabled: false,
      frequency: "weekly",
      lastRun: "2024-01-10 03:30",
      status: "stopped",
      maxPages: 50
    },
    {
      id: "news-scraper",
      name: "Nyhetsartiklar Scraper", 
      description: "Letar efter föreningsrelaterade nyheter",
      enabled: true,
      frequency: "daily",
      lastRun: "2024-01-15 01:15",
      status: "running",
      maxPages: 200
    },
    {
      id: "event-scraper",
      name: "Evenemang Scraper",
      description: "Scannar evenemangssidor för föreningsaktiviteter",
      enabled: true,
      frequency: "twice-daily",
      status: "error",
      lastRun: "2024-01-14 18:45",
      maxPages: 75
    }
  ]);

  const [generalSettings, setGeneralSettings] = useState({
    systemName: "Föreningssystem",
    enableNotifications: true,
    autoBackup: true,
    dataRetentionDays: 365,
    maxConcurrentUsers: 50,
    maintenanceMode: false
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "smtp.company.com",
    smtpPort: 587,
    smtpUsername: "noreply@company.com",
    smtpPassword: "••••••••••••",
    enableEmailNotifications: true,
    dailyReportEmail: "admin@company.com"
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireSpecialChars: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    allowedIpRanges: "192.168.1.0/24"
  });

  const updateWebscrapingAgent = (id: string, updates: Partial<WebscrapingAgent>) => {
    setWebscrapingAgents(prev => prev.map(agent =>
      agent.id === id ? { ...agent, ...updates } : agent
    ));
  };

  const runAgent = (id: string) => {
    updateWebscrapingAgent(id, { 
      status: 'running',
      lastRun: new Date().toLocaleString('sv-SE')
    });
    
    // Simulate completion after 3 seconds
    setTimeout(() => {
      updateWebscrapingAgent(id, { status: 'scheduled' });
    }, 3000);
  };

  const getStatusIcon = (status: WebscrapingAgent['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-green-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: WebscrapingAgent['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700">Körs</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700">Fel</Badge>;
      case 'scheduled':
        return <Badge className="bg-green-100 text-green-700">Schemalagd</Badge>;
      default:
        return <Badge variant="secondary">Stoppad</Badge>;
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'hourly':
        return 'Varje timme';
      case 'twice-daily':
        return 'Två gånger per dag';
      case 'daily':
        return 'Dagligen';
      case 'weekly':
        return 'Veckovis';
      case 'monthly':
        return 'Månadsvis';
      default:
        return frequency;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Inställningar</h1>
          <p className="text-gray-600">Hantera systemkonfiguration och automatisering.</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Admin Only
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="webscraping" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="webscraping" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Webscraping
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Allmänt
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-post
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Säkerhet
          </TabsTrigger>
        </TabsList>

        {/* Webscraping Agents Tab */}
        <TabsContent value="webscraping" className="space-y-6">
          <Card className="border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-600" />
                Webscraping-agenter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {webscrapingAgents.map((agent) => (
                <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={(checked) => updateWebscrapingAgent(agent.id, { enabled: checked })}
                      />
                      <div>
                        <h3 className="text-gray-900">{agent.name}</h3>
                        <p className="text-sm text-gray-600">{agent.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusIcon(agent.status)}
                      {getStatusBadge(agent.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">Frekvens</label>
                      <Select 
                        value={agent.frequency} 
                        onValueChange={(value) => updateWebscrapingAgent(agent.id, { frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Varje timme</SelectItem>
                          <SelectItem value="twice-daily">Två gånger per dag</SelectItem>
                          <SelectItem value="daily">Dagligen</SelectItem>
                          <SelectItem value="weekly">Veckovis</SelectItem>
                          <SelectItem value="monthly">Månadsvis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {agent.targetUrl && (
                      <div>
                        <label className="text-sm text-gray-600 mb-2 block">Mål-URL</label>
                        <Input
                          value={agent.targetUrl}
                          onChange={(e) => updateWebscrapingAgent(agent.id, { targetUrl: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">Max sidor</label>
                      <Input
                        type="number"
                        value={agent.maxPages}
                        onChange={(e) => updateWebscrapingAgent(agent.id, { maxPages: Number(e.target.value) })}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {agent.lastRun && (
                        <>Senast körd: {agent.lastRun}</>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runAgent(agent.id)}
                        disabled={agent.status === 'running' || !agent.enabled}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Kör nu
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Spara
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle>Allmänna inställningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Systemnamn</label>
                  <Input
                    value={generalSettings.systemName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, systemName: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Datalagring (dagar)</label>
                  <Input
                    type="number"
                    value={generalSettings.dataRetentionDays}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, dataRetentionDays: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Max samtidiga användare</label>
                  <Input
                    type="number"
                    value={generalSettings.maxConcurrentUsers}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, maxConcurrentUsers: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900">Aktivera notifikationer</p>
                    <p className="text-sm text-gray-600">Tillåt systemnotifikationer för användare</p>
                  </div>
                  <Switch
                    checked={generalSettings.enableNotifications}
                    onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, enableNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900">Automatisk säkerhetskopiering</p>
                    <p className="text-sm text-gray-600">Säkerhetskopiera databas dagligen</p>
                  </div>
                  <Switch
                    checked={generalSettings.autoBackup}
                    onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, autoBackup: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900">Underhållsläge</p>
                    <p className="text-sm text-gray-600">Begränsa åtkomst till systemet</p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Save className="w-4 h-4 mr-2" />
                  Spara allmänna inställningar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card className="border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle>E-postinställningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">SMTP-server</label>
                  <Input
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpServer: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">SMTP-port</label>
                  <Input
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">SMTP-användarnamn</label>
                  <Input
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUsername: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">SMTP-lösenord</label>
                  <Input
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600 mb-2 block">E-post för dagliga rapporter</label>
                  <Input
                    type="email"
                    value={emailSettings.dailyReportEmail}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, dailyReportEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900">Aktivera e-postnotifikationer</p>
                  <p className="text-sm text-gray-600">Skicka e-post för viktiga systemhändelser</p>
                </div>
                <Switch
                  checked={emailSettings.enableEmailNotifications}
                  onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, enableEmailNotifications: checked }))}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Save className="w-4 h-4 mr-2" />
                  Spara e-postinställningar
                </Button>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Testa e-postkonfiguration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle>Säkerhetsinställningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Minsta lösenordslängd</label>
                  <Input
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Session timeout (minuter)</label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Max inloggningsförsök</label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Tillåtna IP-adresser</label>
                  <Input
                    value={securitySettings.allowedIpRanges}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, allowedIpRanges: e.target.value }))}
                    placeholder="192.168.1.0/24"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900">Kräv specialtecken i lösenord</p>
                    <p className="text-sm text-gray-600">Lösenord måste innehålla specialtecken</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireSpecialChars}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireSpecialChars: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900">Aktivera tvåfaktorsautentisering</p>
                    <p className="text-sm text-gray-600">Kräv 2FA för alla användare</p>
                  </div>
                  <Switch
                    checked={securitySettings.enableTwoFactor}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableTwoFactor: checked }))}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Save className="w-4 h-4 mr-2" />
                  Spara säkerhetsinställningar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}