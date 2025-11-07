import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Download
} from "lucide-react";

const customers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@acme.com",
    company: "Acme Corporation",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    status: "active",
    value: "$45,000",
    lastContact: "2 days ago",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400"
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "m.chen@techstart.io",
    company: "TechStart Inc",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    status: "prospect",
    value: "$32,000",
    lastContact: "1 week ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily.r@global-sol.com",
    company: "Global Solutions",
    phone: "+1 (555) 345-6789",
    location: "Austin, TX",
    status: "active",
    value: "$67,000",
    lastContact: "3 days ago",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david.w@innovate.co",
    company: "Innovate Ltd",
    phone: "+1 (555) 456-7890",
    location: "Boston, MA",
    status: "inactive",
    value: "$21,000",
    lastContact: "2 months ago",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  },
  {
    id: 5,
    name: "Lisa Thompson",
    email: "lisa.t@nextgen.org",
    company: "NextGen Solutions",
    phone: "+1 (555) 567-8901",
    location: "Seattle, WA",
    status: "prospect",
    value: "$15,000",
    lastContact: "5 days ago",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400"
  }
];

interface CustomerListProps {
  onCustomerSelect: (customer: any) => void;
}

export function CustomerList({ onCustomerSelect }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'prospect': return 'bg-orange-100 text-orange-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships and track interactions.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 rounded-xl mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 rounded-lg h-11"
              />
            </div>
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-lg h-11">
                    <Filter className="w-4 h-4 mr-2" />
                    Status: {statusFilter === 'all' ? 'All' : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('prospect')}>
                    Prospect
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                    Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card className="border-gray-200 rounded-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-600">Customer</TableHead>
              <TableHead className="text-gray-600">Contact</TableHead>
              <TableHead className="text-gray-600">Company</TableHead>
              <TableHead className="text-gray-600">Status</TableHead>
              <TableHead className="text-gray-600">Value</TableHead>
              <TableHead className="text-gray-600">Last Contact</TableHead>
              <TableHead className="text-gray-600 w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id} className="border-gray-200 hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={customer.avatar} />
                      <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">ID: {customer.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {customer.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-gray-900">{customer.company}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      {customer.location}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(customer.status)} capitalize`}>
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-gray-900">{customer.value}</span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">{customer.lastContact}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onCustomerSelect(customer)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Customer
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredCustomers.length} of {customers.length} customers
      </div>
    </div>
  );
}