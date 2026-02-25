import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserPlus,
  Search,
  Shield,
  ShieldOff,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Settings,
  Eye,
  EyeOff,
  Lock
} from "lucide-react";
import { User } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebSocket } from "@/hooks/use-websocket";
import { authManager } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface UserWithStats extends User {
  jobsCount: number;
  totalEarnings: number;
}

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showViewUser, setShowViewUser] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const user = authManager.getState().user;

  useEffect(() => {
    if (!user || user.role !== "admin") {
      toast({
        title: t('common.error'),
        description: t('admin.accessDenied'),
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [user, setLocation, toast, t]);

  if (!user || user.role !== "admin") {
    return null;
  }

  // Enable real-time updates via WebSocket
  useWebSocket();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (data) => data || [],
    refetchOnWindowFocus: true,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Calculate user statistics
  const usersWithStats: UserWithStats[] = (users || []).map(user => {
    const userInvoices = (invoices as any[]).filter((invoice: any) => invoice.cleanerId === user.id);
    const jobsCount = userInvoices.length;
    const totalEarnings = userInvoices.reduce((sum: number, invoice: any) =>
      sum + parseFloat(invoice.amount), 0);

    return {
      ...user,
      jobsCount,
      totalEarnings,
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredUsers = usersWithStats.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && Boolean(user.isActive)) ||
      (statusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesStatus;
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, { isActive });
      return response.json();
    },
    onMutate: async ({ userId, isActive }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData(["/api/users"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/users"], (old: User[] | undefined) => {
        if (!old) return old;
        return old.map(user =>
          user.id === userId ? { ...user, isActive } : user
        );
      });

      return { previousUsers, userId };
    },
    onError: (err, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousUsers) {
        queryClient.setQueryData(["/api/users"], context.previousUsers);
      }

      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('admin.failedToUpdateUserStatus'),
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      // Update cache with server response
      queryClient.setQueryData(["/api/users"], (old: User[] | undefined) => {
        if (!old) return old;
        return old.map(user =>
          user.id === data.id ? data : user
        );
      });

      toast({
        title: t('admin.userUpdated'),
        description: variables.isActive ? t('admin.userEnabledSuccess') : t('admin.userDisabledSuccess'),
      });
    },
    onSettled: (data, error, variables, context) => {
      // Invalidate team queries after mutation completes
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({
        title: t('admin.userDeleted'),
        description: t('admin.userRemovedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('admin.failedToDeleteUser'),
        variant: "destructive",
      });
    },
  });

  const activeUsers = usersWithStats.filter(user => user.isActive).length;
  const inactiveUsers = usersWithStats.filter(user => !user.isActive).length;
  const totalRevenue = usersWithStats.reduce((sum, user) => sum + user.totalEarnings, 0);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('admin.userManagement')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('admin.manageTeamPermissions')}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('admin.addUser')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('admin.addNewUser')}</DialogTitle>
                </DialogHeader>
                <UserForm
                  onClose={() => setShowAddUser(false)}
                  onSuccess={(newUser) => {
                    setStatusFilter("all");
                    setSearchTerm("");
                    // "Auto show me": Open detail view for the new user
                    // Ensure dates are converted properly from JSON string to Date object
                    const userWithStats = {
                      ...newUser,
                      createdAt: new Date(newUser.createdAt),
                      jobsCount: 0,
                      totalEarnings: 0,
                    };
                    setSelectedUser(userWithStats);
                    setShowViewUser(true);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('admin.totalUsers')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{usersWithStats.length}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCheck className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('admin.activeUsers')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{activeUsers}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserX className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('admin.inactiveUsers')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{inactiveUsers}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-xs">DQI</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('admin.totalRevenue')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{totalRevenue.toFixed(2)} DQI</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('admin.searchUsers')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t('admin.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.allUsers')}</SelectItem>
                  <SelectItem value="active">{t('admin.activeOnly')}</SelectItem>
                  <SelectItem value="inactive">{t('admin.inactiveOnly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('admin.allUsers')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 mb-4">{t('admin.noUsersFound')}</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.user')}</TableHead>
                    <TableHead>{t('admin.role')}</TableHead>
                    <TableHead>{t('admin.jobs')}</TableHead>
                    <TableHead>{t('admin.earnings')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('admin.created')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=D4AF37&color=fff`}
                            alt={user.name}
                          />
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'supervisor' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{user.jobsCount}</TableCell>
                      <TableCell className="font-medium">{user.totalEarnings.toFixed(2)} DQI</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={(checked) =>
                              toggleUserStatus.mutate({ userId: user.id, isActive: checked })
                            }
                            disabled={toggleUserStatus.isPending}
                          />
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? t('admin.active') : t('admin.inactive')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowViewUser(true);
                            }}
                            data-testid={`button-view-user-${user.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditUser(true);
                            }}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser.mutate(user.id)}
                            disabled={deleteUser.isPending}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View User Dialog */}
        <Dialog open={showViewUser} onOpenChange={setShowViewUser}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('admin.userDetails')}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <img
                    className="h-20 w-20 rounded-full object-cover"
                    src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=D4AF37&color=fff`}
                    alt={selectedUser.name}
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                    <p className="text-gray-500">@{selectedUser.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">{t('admin.role')}</Label>
                    <p className="font-medium capitalize">{selectedUser.role}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">{t('common.status')}</Label>
                    <p className="font-medium">
                      <Badge variant={selectedUser.isActive ? 'default' : 'secondary'}>
                        {selectedUser.isActive ? t('admin.active') : t('admin.inactive')}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">{t('admin.totalJobs')}</Label>
                    <p className="font-medium">{selectedUser.jobsCount}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">{t('admin.totalEarnings')}</Label>
                    <p className="font-medium">{selectedUser.totalEarnings.toFixed(2)} DQI</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">{t('admin.created')}</Label>
                    <p className="font-medium">{format(new Date(selectedUser.createdAt), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.editUser')}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <EditUserForm
                user={selectedUser}
                onClose={() => {
                  setShowEditUser(false);
                  setSelectedUser(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function UserForm({ onClose, onSuccess }: { onClose: () => void; onSuccess?: (user: User) => void }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "cleaner",
    avatar: "",
    isActive: true,
  });

  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: async (userData: typeof formData) => {
      // Trim all string fields
      const cleanedData = {
        ...userData,
        username: userData.username.trim(),
        name: userData.name.trim(),
        avatar: userData.avatar.trim() || null,
        isActive: userData.isActive,
      };

      console.log('Creating user with data:', cleanedData);
      const response = await apiRequest("POST", "/api/users", cleanedData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('User created successfully, updating cache...', data);

      // Force immediate cache update for real-time feel
      queryClient.setQueryData(["/api/users"], (old: User[] | undefined) => {
        const currentUsers = old || [];
        // Ensure we don't add duplicate if WebSocket already added it
        if (currentUsers.some(u => u.id === data.id)) return currentUsers;
        return [...currentUsers, data];
      });

      // Invalidate removed to prevent race conditions with stale reads
      // We rely on optimistic updates (immediate) and WebSocket (eventual consistency)
      // queryClient.invalidateQueries({ queryKey: ["/api/users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/team"], exact: false });

      setFormData({
        username: "",
        password: "",
        name: "",
        role: "cleaner",
        avatar: "",
        isActive: true,
      });

      // Close the add user dialog first
      onClose();

      // Small delay to ensure the add dialog is closed before opening view dialog
      // This prevents potential focus management issues or state conflicts
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(data);
        }, 100);
      }
    },
    onError: (error: Error) => {
      console.error('User creation error:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('admin.failedToCreateUser'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.username.trim()) {
      toast({
        title: t('bookings.validationError'),
        description: t('admin.usernameRequired'),
        variant: "destructive",
      });
      return;
    }

    if (!formData.password.trim()) {
      toast({
        title: t('bookings.validationError'),
        description: t('admin.passwordRequired'),
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: t('bookings.validationError'),
        description: t('admin.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: t('bookings.validationError'),
        description: t('admin.passwordMinLength'),
        variant: "destructive",
      });
      return;
    }

    createUser.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="username">{t('admin.username')}</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          placeholder={t('admin.enterUsername')}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">{t('admin.password')}</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          placeholder={t('admin.enterPassword')}
          required
        />
      </div>
      <div>
        <Label htmlFor="name">{t('admin.fullName')}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={t('admin.enterFullName')}
          required
        />
      </div>
      <div>
        <Label htmlFor="role">{t('admin.role')}</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cleaner">{t('admin.cleaner')}</SelectItem>
            <SelectItem value="supervisor">{t('admin.supervisor')}</SelectItem>
            <SelectItem value="admin">{t('admin.admin')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="avatar">{t('admin.avatarUrlOptional')}</Label>
        <Input
          id="avatar"
          value={formData.avatar}
          onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
          placeholder={t('admin.avatarPlaceholder')}
        />
      </div>
      <div className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={createUser.isPending}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {createUser.isPending ? t('admin.creatingUser') : t('admin.createUser')}
        </Button>
      </div>
    </form>
  );
}

function EditUserForm({ user, onClose }: { user: UserWithStats; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: user.name,
    role: user.role,
    avatar: user.avatar || "",
    password: "", // Optional - only if changing password
  });

  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const updateUser = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const updateData: any = {
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar,
      };

      // Only include password if it's been changed
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      const response = await apiRequest("PATCH", `/api/users/${user.id}`, updateData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/users"], (old: User[] | undefined) => {
        if (!old) return old;
        return old.map(u => u.id === user.id ? data : u);
      });

      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });

      toast({
        title: t('admin.userUpdated'),
        description: t('admin.userUpdatedSuccess'),
      });

      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message || t('admin.failedToUpdateUser'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: t('bookings.validationError'),
        description: t('admin.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast({
        title: t('bookings.validationError'),
        description: t('admin.passwordMinLength'),
        variant: "destructive",
      });
      return;
    }

    updateUser.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">{t('admin.fullName')}</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={t('admin.enterFullName')}
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-role">{t('admin.role')}</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cleaner">{t('admin.cleaner')}</SelectItem>
            <SelectItem value="supervisor">{t('admin.supervisor')}</SelectItem>
            <SelectItem value="admin">{t('admin.admin')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="edit-avatar">{t('admin.avatarUrlOptional')}</Label>
        <Input
          id="edit-avatar"
          value={formData.avatar}
          onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
          placeholder={t('admin.avatarPlaceholder')}
        />
      </div>
      <div>
        <Label htmlFor="edit-password">{t('admin.newPasswordOptional')}</Label>
        <Input
          id="edit-password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          placeholder={t('admin.leaveBlankToKeep')}
        />
      </div>
      <div className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={updateUser.isPending}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {updateUser.isPending ? t('admin.updatingUser') : t('admin.updateUser')}
        </Button>
      </div>
    </form>
  );
}