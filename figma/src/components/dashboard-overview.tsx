import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Target,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  MapPin,
  UserCheck,
  Phone
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

const newCustomersData = [
  { period: "v47", kunder: 12, kontakter: 45 },
  { period: "v48", kunder: 18, kontakter: 52 },
  { period: "v49", kunder: 15, kontakter: 38 },
  { period: "v50", kunder: 22, kontakter: 67 },
  { period: "v51", kunder: 19, kontakter: 58 },
  { period: "v52", kunder: 25, kontakter: 71 },
];

const contactVsCustomerData = [
  { name: "Kontakter", value: 1847, color: "#ea580c" },
  { name: "Kunder", value: 423, color: "#dc2626" },
];

const newCustomers = [
  { name: "Malmö Fotbollsklubb", kommun: "Malmö", kategori: "Sport", date: "2024-01-15", contacted: true },
  { name: "Lunds Naturvänner", kommun: "Lund", kategori: "Miljö", date: "2024-01-14", contacted: false },
  { name: "Helsingborg Teaterförening", kommun: "Helsingborg", kategori: "Kultur", date: "2024-01-14", contacted: true },
  { name: "Växjö Ungdomscenter", kommun: "Växjö", kategori: "Ungdom", date: "2024-01-13", contacted: false },
  { name: "Kristianstad Handboll", kommun: "Kristianstad", kategori: "Sport", date: "2024-01-13", contacted: true },
  { name: "Karlskrona Segelsällskap", kommun: "Karlskrona", kategori: "Sport", date: "2024-01-12", contacted: false },
  { name: "Ystad Konstförening", kommun: "Ystad", kategori: "Kultur", date: "2024-01-12", contacted: true },
  { name: "Trelleborg Miljögrupp", kommun: "Trelleborg", kategori: "Miljö", date: "2024-01-11", contacted: false },
  { name: "Landskrona Dansgrupp", kommun: "Landskrona", kategori: "Kultur", date: "2024-01-11", contacted: true },
  { name: "Hässleholm Ryttarförening", kommun: "Hässleholm", kategori: "Sport", date: "2024-01-10", contacted: false },
];

export function DashboardOverview() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Översikt av föreningsdata och systemaktivitet.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-lg">
            <Calendar className="w-4 h-4 mr-2" />
            Denna månad
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 rounded-lg">
            Exportera rapport
          </Button>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Aktiva föreningar</CardTitle>
            <Building2 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">2,847</div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+156</span>
              <span className="text-gray-500 ml-1">denna månad</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Scannade kommuner</CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">33</div>
            <div className="flex items-center text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">Komplett</span>
              <span className="text-gray-500 ml-1">av 33 totalt</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Scannade föreningar</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">12,456</div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+423</span>
              <span className="text-gray-500 ml-1">denna vecka</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Scannade personprofiler</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">45,789</div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+1,234</span>
              <span className="text-gray-500 ml-1">denna vecka</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Kontaktade föreningar</CardTitle>
            <Phone className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">1,847</div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+89</span>
              <span className="text-gray-500 ml-1">denna vecka</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Kontakter denna vecka</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">127</div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+23</span>
              <span className="text-gray-500 ml-1">från förra veckan</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Kontakter denna månad</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">543</div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+12.3%</span>
              <span className="text-gray-500 ml-1">från förra månaden</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Nya kunder</CardTitle>
            <UserCheck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">89</div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+15</span>
              <span className="text-gray-500 ml-1">denna månad</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Nya kunder - veckovis trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={newCustomersData}>
                <defs>
                  <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="contactGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="kontakter" 
                  stackId="1"
                  stroke="#dc2626" 
                  strokeWidth={2}
                  fill="url(#contactGradient)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="kunder" 
                  stackId="2"
                  stroke="#ea580c" 
                  strokeWidth={2}
                  fill="url(#customerGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Kontakt vs. kund fördelning</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contactVsCustomerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contactVsCustomerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-4">
              {contactVsCustomerData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-900">Nya kunder (10 senaste)</CardTitle>
            <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
              Visa alla <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {newCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex-1">
                  <p className="text-gray-900">{customer.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {customer.kommun}
                    </Badge>
                    <Badge 
                      variant="secondary"
                      className={
                        customer.kategori === 'Sport' ? 'bg-blue-100 text-blue-700' :
                        customer.kategori === 'Kultur' ? 'bg-purple-100 text-purple-700' :
                        customer.kategori === 'Miljö' ? 'bg-green-100 text-green-700' :
                        customer.kategori === 'Ungdom' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }
                    >
                      {customer.kategori}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-500">{customer.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <Badge 
                    variant={customer.contacted ? "default" : "secondary"}
                    className={customer.contacted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
                  >
                    {customer.contacted ? "Kontaktad" : "Ej kontaktad"}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}