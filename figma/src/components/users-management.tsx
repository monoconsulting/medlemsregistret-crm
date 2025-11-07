import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Calendar,
  Search,
  UserCheck,
  Crown,
  Eye
} from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
}

const mockUsers: User[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe", 
    email: "john.doe@company.com",
    role: "admin",
    status: "active",
    lastLogin: "2024-01-15 14:30",
    createdAt: "2023-06-15",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  },
  {
    id: "2",
    firstName: "Anna",
    lastName: "Svensson",
    email: "anna.svensson@company.com", 
    role: "user",
    status: "active",
    lastLogin: "2024-01-15 09:15",
    createdAt: "2023-08-22"
  },
  {
    id: "3",
    firstName: "Erik",
    lastName: "Johansson",
    email: "erik.johansson@company.com",
    role: "user", 
    status: "active",
    lastLogin: "2024-01-14 16:45",
    createdAt: "2023-09-10"
  },
  {
    id: "4",
    firstName: "Maria",
    lastName: "Lindberg",
    email: "maria.lindberg@company.com",
    role: "viewer",
    status: "inactive", 
    lastLogin: "2024-01-10 11:20",
    createdAt: "2023-11-05"
  },
  {
    id: "5",
    firstName: "Lars", 
    lastName: "Andersson",
    email: "lars.andersson@company.com",
    role: "user",
    status: "pending",
    createdAt: "2024-01-14"
  }
];

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user" as User['role']
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email) return;
    
    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      status: "pending",
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setUsers(prev => [...prev, user]);
    setNewUser({ firstName: "", lastName: "", email: "", role: "user" });
    setIsAddUserOpen(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    setUsers(prev => prev.map(user => 
      user.id === editingUser.id ? editingUser : user
    ));
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-orange-600" />;
      case 'user':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleName = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'Administratör';
      case 'user':
        return 'Användare';
      case 'viewer':
        return 'Läsare';
    }
  };

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Aktiv</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Inaktiv</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700">Väntande</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Användarhantering</h1>
          <p className="text-gray-600">Hantera användare och deras behörigheter i systemet.</p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Lägg till användare
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till ny användare</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Förnamn</label>
                  <Input
                    value={newUser.firstName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Förnamn"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Efternamn</label>
                  <Input
                    value={newUser.lastName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Efternamn"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-2 block">E-postadress</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e-post@example.com"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Systemroll</label>
                <Select value={newUser.role} onValueChange={(value: User['role']) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Läsare</SelectItem>
                    <SelectItem value="user">Användare</SelectItem>
                    <SelectItem value="admin">Administratör</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Avbryt
                </Button>
                <Button 
                  onClick={handleAddUser}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={!newUser.firstName || !newUser.lastName || !newUser.email}
                >
                  Lägg till användare
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Totalt antal användare</p>
                <p className="text-2xl text-gray-900">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Aktiva användare</p>
                <p className="text-2xl text-gray-900">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Administratörer</p>
                <p className="text-2xl text-gray-900">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <Crown className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Väntande</p>
                <p className="text-2xl text-gray-900">{users.filter(u => u.status === 'pending').length}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 rounded-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Sök användare..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrera på roll" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla roller</SelectItem>
                <SelectItem value="admin">Administratör</SelectItem>
                <SelectItem value="user">Användare</SelectItem>
                <SelectItem value="viewer">Läsare</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrera på status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
                <SelectItem value="pending">Väntande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle>Användarlista</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Användare</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">E-post</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Roll</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Senast inloggad</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">Skapad: {user.createdAt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="text-gray-900">{getRoleName(user.role)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {user.lastLogin || "Aldrig"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ta bort användare</AlertDialogTitle>
                              <AlertDialogDescription>
                                Är du säker på att du vill ta bort {user.firstName} {user.lastName}? 
                                Denna åtgärd kan inte ångras.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Ta bort
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera användare</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Förnamn</label>
                  <Input
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, firstName: e.target.value }) : null)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Efternamn</label>
                  <Input
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, lastName: e.target.value }) : null)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-2 block">E-postadress</label>
                <Input
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Roll</label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value: User['role']) => setEditingUser(prev => prev ? ({ ...prev, role: value }) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Läsare</SelectItem>
                      <SelectItem value="user">Användare</SelectItem>
                      <SelectItem value="admin">Administratör</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Status</label>
                  <Select 
                    value={editingUser.status} 
                    onValueChange={(value: User['status']) => setEditingUser(prev => prev ? ({ ...prev, status: value }) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                      <SelectItem value="pending">Väntande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Avbryt
                </Button>
                <Button 
                  onClick={handleUpdateUser}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Spara ändringar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}