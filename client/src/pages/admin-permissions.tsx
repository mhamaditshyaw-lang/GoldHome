import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { authManager } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/hooks/use-settings';
import { 
  Shield, 
  Users, 
  Settings, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw, 
  ArrowLeft,
  MapPin,
  FileText,
  BarChart3,
  Calendar,
  DollarSign,
  Wrench,
  Bell,
  Smartphone,
  Briefcase,
  Navigation
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  isActive: boolean;
}

interface UserSettings {
  userId: number;
  settingKey: string;
  isEnabled: boolean;
}

interface PermissionConfig {
  key: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  defaultValue: boolean;
  roleRestrictions?: string[]; // Roles that can access this permission
}

// Define all available permissions - moved inside component to access t() function

export default function AdminPermissions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [localPermissions, setLocalPermissions] = useState<{[key: string]: boolean}>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();

  const currentUser = authManager.getState().user;

  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("admin-permissions")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  // Define all available permissions with translations
  const availablePermissions: PermissionConfig[] = [
    {
      key: 'dashboard_access',
      name: t('admin.dashboardAccess'),
      description: t('admin.dashboardAccessDesc'),
      category: t('admin.core'),
      icon: <BarChart3 className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'invoices_view',
      name: t('admin.viewInvoices'),
      description: t('admin.viewInvoicesDesc'),
      category: t('admin.invoices'),
      icon: <FileText className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'invoices_create',
      name: t('admin.createInvoices'),
      description: t('admin.createInvoicesDesc'),
      category: t('admin.invoices'),
      icon: <FileText className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'invoices_edit',
      name: t('admin.editInvoices'),
      description: t('admin.editInvoicesDesc'),
      category: t('admin.invoices'),
      icon: <FileText className="h-4 w-4" />,
      defaultValue: false,
      roleRestrictions: ['admin', 'supervisor'],
    },
    {
      key: 'team_view',
      name: t('admin.viewTeam'),
      description: t('admin.viewTeamDesc'),
      category: t('admin.team'),
      icon: <Users className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'team_manage',
      name: t('admin.manageTeam'),
      description: t('admin.manageTeamDesc'),
      category: t('admin.team'),
      icon: <Users className="h-4 w-4" />,
      defaultValue: false,
      roleRestrictions: ['admin', 'supervisor'],
    },
    {
      key: 'live_tracking',
      name: t('admin.liveLocationTracking'),
      description: t('admin.liveLocationTrackingDesc'),
      category: t('admin.tracking'),
      icon: <MapPin className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'bookings_view',
      name: t('admin.viewBookings'),
      description: t('admin.viewBookingsDesc'),
      category: t('admin.bookings'),
      icon: <Calendar className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'bookings_manage',
      name: t('admin.manageBookings'),
      description: t('admin.manageBookingsDesc'),
      category: t('admin.bookings'),
      icon: <Calendar className="h-4 w-4" />,
      defaultValue: false,
      roleRestrictions: ['admin', 'supervisor'],
    },
    {
      key: 'expenses_view',
      name: t('admin.viewExpenses'),
      description: t('admin.viewExpensesDesc'),
      category: t('admin.financial'),
      icon: <DollarSign className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'expenses_manage',
      name: t('admin.manageExpenses'),
      description: t('admin.manageExpensesDesc'),
      category: t('admin.financial'),
      icon: <DollarSign className="h-4 w-4" />,
      defaultValue: false,
      roleRestrictions: ['admin', 'supervisor'],
    },
    {
      key: 'services_view',
      name: t('admin.viewServices'),
      description: t('admin.viewServicesDesc'),
      category: t('admin.servicesCategory'),
      icon: <Wrench className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'services_manage',
      name: t('admin.manageServices'),
      description: t('admin.manageServicesDesc'),
      category: t('admin.servicesCategory'),
      icon: <Wrench className="h-4 w-4" />,
      defaultValue: false,
      roleRestrictions: ['admin', 'supervisor'],
    },
    {
      key: 'notifications_view',
      name: t('admin.viewNotifications'),
      description: t('admin.viewNotificationsDesc'),
      category: t('admin.communication'),
      icon: <Bell className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'mobile_features',
      name: t('admin.mobileFeatures'),
      description: t('admin.mobileFeaturesDesc'),
      category: t('admin.mobile'),
      icon: <Smartphone className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'admin_settings',
      name: t('admin.adminSettings'),
      description: t('admin.adminSettingsDesc'),
      category: t('admin.adminCategory'),
      icon: <Settings className="h-4 w-4" />,
      defaultValue: false,
      roleRestrictions: ['admin'],
    },
    {
      key: 'section_business_operations',
      name: t('admin.sectionBusinessOperations') || 'Business Operations Section',
      description: t('admin.sectionBusinessOperationsDesc') || 'Control access to the entire Business Operations section',
      category: t('admin.sections'),
      icon: <Briefcase className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'section_scheduling_assignments',
      name: t('admin.sectionSchedulingAssignments') || 'Scheduling & Assignments Section',
      description: t('admin.sectionSchedulingAssignmentsDesc') || 'Control access to the entire Scheduling & Assignments section',
      category: t('admin.sections'),
      icon: <Calendar className="h-4 w-4" />,
      defaultValue: true,
    },
    {
      key: 'section_team_tracking',
      name: t('admin.sectionTeamTracking') || 'Team & Tracking Section',
      description: t('admin.sectionTeamTrackingDesc') || 'Control access to the entire Team & Tracking section',
      category: t('admin.sections'),
      icon: <Navigation className="h-4 w-4" />,
      defaultValue: true,
    },
  ];
  
  // Check if user has admin permission
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">{t('admin.accessDenied')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('admin.noPermissionMessage')}
            </p>
            <Button onClick={() => setLocation('/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('admin.backToDashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch user settings for selected user
  const { data: userSettings, isLoading: userSettingsLoading } = useQuery<UserSettings[]>({
    queryKey: ['/api/user-settings', selectedUser?.id],
    enabled: !!selectedUser,
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async (data: { userId: number; settingKey: string; isEnabled: boolean }) => {
      const response = await fetch(`/api/user-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(t('admin.failedToUpdatePermission'));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-settings'] });
      setHasUnsavedChanges(false);
      toast({
        title: t('admin.permissionsUpdated'),
        description: t('admin.permissionsUpdatedMessage'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('admin.failedToUpdatePermission'),
        variant: "destructive",
      });
    },
  });

  // Initialize local permissions when user settings load
  React.useEffect(() => {
    if (userSettings && selectedUser) {
      const permissions: {[key: string]: boolean} = {};
      availablePermissions.forEach(permission => {
        const userSetting = userSettings.find(s => s.settingKey === permission.key);
        permissions[permission.key] = userSetting?.isEnabled ?? permission.defaultValue;
      });
      setLocalPermissions(permissions);
      setHasUnsavedChanges(false);
    }
  }, [userSettings, selectedUser]);

  const handlePermissionChange = (permissionKey: string, enabled: boolean) => {
    setLocalPermissions(prev => ({
      ...prev,
      [permissionKey]: enabled
    }));
    setHasUnsavedChanges(true);
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;
    
    const promises = Object.entries(localPermissions).map(([key, enabled]) => 
      updatePermissionMutation.mutateAsync({
        userId: selectedUser.id,
        settingKey: key,
        isEnabled: enabled,
      })
    );

    Promise.all(promises);
  };

  const handleResetPermissions = () => {
    if (!selectedUser) return;
    
    const resetPermissions: {[key: string]: boolean} = {};
    availablePermissions.forEach(permission => {
      resetPermissions[permission.key] = permission.defaultValue;
    });
    
    setLocalPermissions(resetPermissions);
    setHasUnsavedChanges(true);
  };

  const getPermissionsByCategory = () => {
    const categories: {[key: string]: PermissionConfig[]} = {};
    availablePermissions.forEach(permission => {
      // Check role restrictions
      if (permission.roleRestrictions && selectedUser) {
        if (!permission.roleRestrictions.includes(selectedUser.role)) {
          return; // Skip this permission for this user role
        }
      }
      
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
  };

  const getStatusColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'cleaner':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6 border border-purple-100">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              <Shield className="h-8 w-8 text-purple-600" />
              {t('admin.userPermissionsManagement')}
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              {t('admin.controlAccess')}
            </p>
          </div>
          <Button 
            onClick={() => setLocation('/dashboard')} 
            variant="outline" 
            className="hover:bg-purple-50 border-purple-200"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('admin.backToDashboard')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <Card className="lg:col-span-1 shadow-md border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Users className="h-5 w-5 text-purple-600" />
                {t('admin.users')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('admin.noUsersFound')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUser?.id === user.id 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={getStatusColor(user.role)}>
                            {user.role}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="outline" className="text-red-600">
                              {t('admin.inactive')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions Panel */}
          <Card className="lg:col-span-2 shadow-md border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {selectedUser ? t('admin.permissionsFor', { name: selectedUser.name }) : t('admin.selectUser')}
                </CardTitle>
                {selectedUser && hasUnsavedChanges && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleResetPermissions}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('admin.resetToDefault')}
                    </Button>
                    <Button
                      onClick={handleSavePermissions}
                      disabled={updatePermissionMutation.isPending}
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updatePermissionMutation.isPending ? t('admin.saving') : t('common.save')}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedUser ? (
                <div className="text-center py-16">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.selectUser')}</h3>
                  <p className="text-muted-foreground">
                    {t('admin.chooseUserMessage')}
                  </p>
                </div>
              ) : userSettingsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {hasUnsavedChanges && (
                    <Alert>
                      <AlertDescription>
                        {t('admin.unsavedChangesWarning')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-4">{category}</h3>
                      <div className="space-y-4">
                        {permissions.map((permission) => (
                          <div key={permission.key} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">{permission.icon}</div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{permission.name}</p>
                                  {permission.roleRestrictions && (
                                    <Badge variant="outline" className="text-xs">
                                      {permission.roleRestrictions.join(', ')}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{permission.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={localPermissions[permission.key] ?? permission.defaultValue}
                              onCheckedChange={(checked) => handlePermissionChange(permission.key, checked)}
                            />
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-6" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}