import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  Download,
  Filter
} from "lucide-react";

const monthlyData = [
  { month: "Jan", revenue: 45000, customers: 120, deals: 12, conversion: 24 },
  { month: "Feb", revenue: 52000, customers: 145, deals: 15, conversion: 28 },
  { month: "Mar", revenue: 48000, customers: 132, deals: 11, conversion: 22 },
  { month: "Apr", revenue: 61000, customers: 167, deals: 18, conversion: 31 },
  { month: "May", revenue: 55000, customers: 158, deals: 16, conversion: 29 },
  { month: "Jun", revenue: 67000, customers: 189, deals: 21, conversion: 34 },
];

const customerSegments = [
  { name: "Enterprise", value: 45, color: "#ea580c" },
  { name: "Mid-Market", value: 30, color: "#dc2626" },
  { name: "SMB", value: 25, color: "#f59e0b" },
];

const salesByRegion = [
  { region: "North America", sales: 245000, growth: 12.5 },
  { region: "Europe", sales: 189000, growth: 8.3 },
  { region: "Asia Pacific", sales: 156000, growth: 18.7 },
  { region: "Latin America", sales: 89000, growth: -2.1 },
];

const pipelineMetrics = [
  { stage: "Lead", count: 342, value: 1240000, conversion: 28 },
  { stage: "Qualified", count: 156, value: 890000, conversion: 45 },
  { stage: "Proposal", count: 89, value: 560000, conversion: 62 },
  { stage: "Negotiation", count: 34, value: 340000, conversion: 78 },
  { stage: "Closed Won", count: 23, value: 280000, conversion: 100 },
];

export function AnalyticsDashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Deep insights into your sales performance and customer behavior.</p>
        </div>
        <div className="flex gap-3">
          <Select defaultValue="6months">
            <SelectTrigger className="w-40 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-lg">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">$67,000</div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+21.8%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Customer Acquisition Cost</CardTitle>
            <Users className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">$245</div>
            <div className="flex items-center text-sm">
              <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">-8.2%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Average Deal Size</CardTitle>
            <Target className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">$12,190</div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+15.3%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-600">Sales Cycle Length</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 mb-1">32 days</div>
            <div className="flex items-center text-sm">
              <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">-5.1%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
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
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="url(#revenueGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerSegments}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                >
                  {customerSegments.map((entry, index) => (
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
            <div className="mt-4 space-y-2">
              {customerSegments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm text-gray-600">{segment.name}</span>
                  </div>
                  <span className="text-sm text-gray-900">{segment.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Sales by Region</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {salesByRegion.map((region, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-gray-900">{region.region}</h4>
                  <p className="text-2xl text-gray-900 mt-1">${region.sales.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${
                    region.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {region.growth >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(region.growth)}%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">vs last quarter</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Pipeline Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineMetrics.map((stage, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{stage.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-900">{stage.count} deals</span>
                    <Badge variant="secondary" className="text-xs">
                      {stage.conversion}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stage.conversion}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>${(stage.value / 1000).toFixed(0)}K value</span>
                  <span>{stage.conversion}% conversion</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="text-gray-900">Monthly Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="customers" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="New Customers"
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="deals" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                name="Deals Closed"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="conversion" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Conversion Rate %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}