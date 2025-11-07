import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Bot,
  Key,
  Settings,
  FileText,
  Save,
  TestTube,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";

interface AIProvider {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  apiKey: string;
  model?: string;
  lastUsed?: string;
}

interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
  provider: string;
  active: boolean;
}

export function AISettings() {
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '🤖',
      status: 'connected',
      apiKey: 'sk-••••••••••••••••••••••••••••••••',
      model: 'gpt-4',
      lastUsed: '2024-01-15 14:30'
    },
    {
      id: 'gemini', 
      name: 'Google Gemini',
      icon: '💎',
      status: 'disconnected',
      apiKey: '',
      model: 'gemini-pro'
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      icon: '🔍', 
      status: 'error',
      apiKey: 'pplx-••••••••••••••••••••••••••••••••',
      model: 'sonar-small-online',
      lastUsed: '2024-01-14 09:15'
    },
    {
      id: 'grok',
      name: 'Grok (X.AI)',
      icon: '🚀',
      status: 'disconnected', 
      apiKey: '',
      model: 'grok-beta'
    }
  ]);

  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([
    {
      id: 'kommun-search',
      name: 'Sökning per kommun på föreningsregister',
      description: 'Automatiserad sökning och analys av föreningar per kommun',
      prompt: 'Du är en AI-assistent som hjälper till att söka och analysera föreningsregister per kommun. Din uppgift är att...',
      provider: 'openai',
      active: true
    },
    {
      id: 'extended-org-search',
      name: 'Utökad sökning per förening',
      description: 'Djupanalys av specifika föreningar med externa datakällor',
      prompt: 'Du är en forskningsassistent som utför djupanalys av föreningar. Du ska söka efter...',
      provider: 'perplexity',
      active: true
    },
    {
      id: 'person-search',
      name: 'Utökad personsökning',
      description: 'Personanalys och bakgrundscheck av nyckelaktörer',
      prompt: 'Du är en profilering-expert som analyserar personer kopplade till föreningar. Din uppgift är att...',
      provider: 'gemini',
      active: false
    }
  ]);

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const updateApiKey = (providerId: string, apiKey: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? { ...provider, apiKey, status: apiKey ? 'connected' : 'disconnected' }
        : provider
    ));
  };

  const testConnection = async (providerId: string) => {
    // Simulate API test
    console.log(`Testing connection for ${providerId}`);
    
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? { ...provider, status: 'connected', lastUsed: new Date().toLocaleString('sv-SE') }
        : provider
    ));
  };

  const updateSystemPrompt = (promptId: string, updates: Partial<SystemPrompt>) => {
    setSystemPrompts(prev => prev.map(prompt =>
      prompt.id === promptId
        ? { ...prompt, ...updates }
        : prompt
    ));
  };

  const getStatusIcon = (status: AIProvider['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: AIProvider['status']) => {
    switch (status) {
      case 'connected':
        return 'Ansluten';
      case 'error':
        return 'Fel';
      default:
        return 'Ej ansluten';
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">AI-inställningar</h1>
          <p className="text-gray-600">Hantera AI-leverantörer och systemprompts för automatisering.</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Admin Only
        </Badge>
      </div>

      {/* API Keys Section */}
      <Card className="border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-600" />
            API-nycklar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {providers.map((provider) => (
            <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <h3 className="text-gray-900">{provider.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(provider.status)}
                      <span className="text-sm text-gray-600">{getStatusText(provider.status)}</span>
                      {provider.lastUsed && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">Senast använd: {provider.lastUsed}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {provider.model && (
                    <Badge variant="outline" className="text-xs">
                      {provider.model}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(provider.id)}
                    disabled={!provider.apiKey}
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Testa
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showApiKeys[provider.id] ? "text" : "password"}
                      placeholder={`Ange ${provider.name} API-nyckel...`}
                      value={provider.apiKey}
                      onChange={(e) => updateApiKey(provider.id, e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleApiKeyVisibility(provider.id)}
                  >
                    {showApiKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>

                {provider.model && (
                  <Select value={provider.model} onValueChange={(value) => {
                    setProviders(prev => prev.map(p => 
                      p.id === provider.id ? { ...p, model: value } : p
                    ));
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {provider.id === 'openai' && (
                        <>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </>
                      )}
                      {provider.id === 'gemini' && (
                        <>
                          <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                          <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                        </>
                      )}
                      {provider.id === 'perplexity' && (
                        <>
                          <SelectItem value="sonar-small-online">Sonar Small Online</SelectItem>
                          <SelectItem value="sonar-medium-online">Sonar Medium Online</SelectItem>
                          <SelectItem value="sonar-large-online">Sonar Large Online</SelectItem>
                        </>
                      )}
                      {provider.id === 'grok' && (
                        <>
                          <SelectItem value="grok-beta">Grok Beta</SelectItem>
                          <SelectItem value="grok-vision-beta">Grok Vision Beta</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Prompts Section */}
      <Card className="border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Systemprompts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {systemPrompts.map((prompt) => (
            <div key={prompt.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">{prompt.name}</h3>
                    <Switch
                      checked={prompt.active}
                      onCheckedChange={(checked) => updateSystemPrompt(prompt.id, { active: checked })}
                    />
                    <Badge 
                      variant={prompt.active ? "default" : "secondary"}
                      className={prompt.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
                    >
                      {prompt.active ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{prompt.description}</p>
                </div>
                
                <Select value={prompt.provider} onValueChange={(value) => updateSystemPrompt(prompt.id, { provider: value })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="perplexity">Perplexity</SelectItem>
                    <SelectItem value="grok">Grok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Textarea
                  placeholder="Systemprompt..."
                  value={prompt.prompt}
                  onChange={(e) => updateSystemPrompt(prompt.id, { prompt: e.target.value })}
                  className="min-h-[120px] font-mono text-sm"
                />
                
                <div className="flex justify-end">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    <Save className="w-4 h-4 mr-2" />
                    Spara prompt
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}