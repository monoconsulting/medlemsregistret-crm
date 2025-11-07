import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  FileText,
  Edit,
  Star
} from "lucide-react";

interface CustomerDetailSheetProps {
  customer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const customerActivities = [
  {
    type: "email",
    title: "Sent proposal document",
    description: "Shared Q3 pricing proposal with customer",
    date: "2 days ago",
    icon: Mail
  },
  {
    type: "call",
    title: "Discovery call completed",
    description: "45-minute call to discuss requirements",
    date: "1 week ago",
    icon: Phone
  },
  {
    type: "meeting",
    title: "Product demo scheduled",
    description: "Upcoming demo meeting for next Tuesday",
    date: "Next week",
    icon: Calendar
  },
  {
    type: "note",
    title: "Customer interested in enterprise plan",
    description: "Showed strong interest in advanced features",
    date: "1 week ago",
    icon: MessageSquare
  }
];

const deals = [
  { name: "Q3 Enterprise License", value: "$45,000", status: "negotiation", stage: "85%" },
  { name: "Additional Users", value: "$8,000", status: "proposal", stage: "60%" },
  { name: "Training Package", value: "$3,500", status: "qualified", stage: "40%" }
];

export function CustomerDetailSheet({ customer, open, onOpenChange }: CustomerDetailSheetProps) {
  if (!customer) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'prospect': return 'bg-orange-100 text-orange-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={customer.avatar} />
                <AvatarFallback className="text-lg">
                  {customer.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <SheetTitle className="text-xl text-gray-900">{customer.name}</SheetTitle>
                  <Badge className={`${getStatusColor(customer.status)} capitalize`}>
                    {customer.status}
                  </Badge>
                </div>
                <SheetDescription className="text-gray-600">
                  {customer.company} • {customer.location}
                </SheetDescription>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button size="sm" variant="outline">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mx-6 mt-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="deals">Deals</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="p-6 space-y-6">
                {/* Contact Information */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-gray-900">{customer.email}</p>
                        <p className="text-sm text-gray-500">Primary email</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-gray-900">{customer.phone}</p>
                        <p className="text-sm text-gray-500">Mobile phone</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-gray-900">{customer.company}</p>
                        <p className="text-sm text-gray-500">Company</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-gray-900">{customer.location}</p>
                        <p className="text-sm text-gray-500">Location</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl text-gray-900">{customer.value}</p>
                          <p className="text-sm text-gray-500">Total Value</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-2xl text-gray-900">3</p>
                          <p className="text-sm text-gray-500">Active Deals</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Rating */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Customer Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-gray-600 ml-2">4.0 / 5.0</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Based on engagement, purchase history, and communication
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deals" className="p-6 space-y-4">
                {deals.map((deal, index) => (
                  <Card key={index} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-900">{deal.name}</h3>
                        <Badge variant="outline" className="capitalize">
                          {deal.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl text-gray-900">{deal.value}</span>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Progress</p>
                          <p className="text-sm text-green-600">{deal.stage}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="activity" className="p-6 space-y-4">
                {customerActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-1">{activity.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="documents" className="p-6 space-y-4">
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg text-gray-900 mb-2">No documents yet</h3>
                  <p className="text-gray-500 mb-4">Upload contracts, proposals, and other files</p>
                  <Button variant="outline">
                    Upload Document
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}