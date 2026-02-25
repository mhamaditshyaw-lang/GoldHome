import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Users,
  Settings as SettingsIcon,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  UserX
} from "lucide-react";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface UserSetting {
  id: number;
  userId: number;
  settingKey: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const pageSettings = [
  { key: "pages.dashboard.enabled", nameKey: "userSettings.pages.dashboard.name", descKey: "userSettings.pages.dashboard.description" },
  { key: "pages.invoices.enabled", nameKey: "userSettings.pages.invoices.name", descKey: "userSettings.pages.invoices.description" },
  { key: "pages.accounting.enabled", nameKey: "userSettings.pages.accounting.name", descKey: "userSettings.pages.accounting.description" },
  { key: "pages.expenses.enabled", nameKey: "userSettings.pages.expenses.name", descKey: "userSettings.pages.expenses.description" },
  { key: "pages.debt.enabled", nameKey: "userSettings.pages.debt.name", descKey: "userSettings.pages.debt.description" },
  { key: "pages.services.enabled", nameKey: "userSettings.pages.services.name", descKey: "userSettings.pages.services.description" },
  { key: "pages.team.enabled", nameKey: "userSettings.pages.team.name", descKey: "userSettings.pages.team.description" },
  { key: "pages.tracking.enabled", nameKey: "userSettings.pages.tracking.name", descKey: "userSettings.pages.tracking.description" },
  { key: "pages.analytics.enabled", nameKey: "userSettings.pages.analytics.name", descKey: "userSettings.pages.analytics.description" },
  { key: "pages.customers.enabled", nameKey: "userSettings.pages.customers.name", descKey: "userSettings.pages.customers.description" },
  { key: "pages.bookings.enabled", nameKey: "userSettings.pages.bookings.name", descKey: "userSettings.pages.bookings.description" },
  { key: "pages.assign-bookings.enabled", nameKey: "userSettings.pages.assign-bookings.name", descKey: "userSettings.pages.assign-bookings.description" },
  { key: "pages.customer-locations.enabled", nameKey: "userSettings.pages.customer-locations.name", descKey: "userSettings.pages.customer-locations.description" },
  { key: "pages.equipment.enabled", nameKey: "userSettings.pages.equipment.name", descKey: "userSettings.pages.equipment.description" },
  { key: "pages.admin.enabled", nameKey: "userSettings.pages.admin.name", descKey: "userSettings.pages.admin.description" },
  { key: "pages.admin-permissions.enabled", nameKey: "userSettings.pages.admin-permissions.name", descKey: "userSettings.pages.admin-permissions.description" },
  { key: "pages.user-settings.enabled", nameKey: "userSettings.pages.user-settings.name", descKey: "userSettings.pages.user-settings.description" },
  { key: "pages.settings.enabled", nameKey: "userSettings.pages.settings.name", descKey: "userSettings.pages.settings.description" },
  { key: "pages.header-footer.enabled", nameKey: "userSettings.pages.header-footer.name", descKey: "userSettings.pages.header-footer.description" },
  { key: "pages.security-dashboard.enabled", nameKey: "userSettings.pages.security-dashboard.name", descKey: "userSettings.pages.security-dashboard.description" },
  { key: "pages.about-developer.enabled", nameKey: "userSettings.pages.about-developer.name", descKey: "userSettings.pages.about-developer.description" },
];

const componentSettings = [
  { key: "components.invoice_form.enabled", nameKey: "userSettings.components.invoice_form.name", descKey: "userSettings.components.invoice_form.description" },
  { key: "components.invoice_edit.enabled", nameKey: "userSettings.components.invoice_edit.name", descKey: "userSettings.components.invoice_edit.description" },
  { key: "components.invoice_delete.enabled", nameKey: "userSettings.components.invoice_delete.name", descKey: "userSettings.components.invoice_delete.description" },
  { key: "components.expense_management.enabled", nameKey: "userSettings.components.expense_management.name", descKey: "userSettings.components.expense_management.description" },
  { key: "components.debt_management.enabled", nameKey: "userSettings.components.debt_management.name", descKey: "userSettings.components.debt_management.description" },
  { key: "components.financial_reports.enabled", nameKey: "userSettings.components.financial_reports.name", descKey: "userSettings.components.financial_reports.description" },
  { key: "components.team_management.enabled", nameKey: "userSettings.components.team_management.name", descKey: "userSettings.components.team_management.description" },
  { key: "components.team_delete.enabled", nameKey: "userSettings.components.team_delete.name", descKey: "userSettings.components.team_delete.description" },
  { key: "components.location_tracking.enabled", nameKey: "userSettings.components.location_tracking.name", descKey: "userSettings.components.location_tracking.description" },
  { key: "components.location_history.enabled", nameKey: "userSettings.components.location_history.name", descKey: "userSettings.components.location_history.description" },
  { key: "components.analytics_export.enabled", nameKey: "userSettings.components.analytics_export.name", descKey: "userSettings.components.analytics_export.description" },
  { key: "components.service_management.enabled", nameKey: "userSettings.components.service_management.name", descKey: "userSettings.components.service_management.description" },
  { key: "components.booking_assignment.enabled", nameKey: "userSettings.components.booking_assignment.name", descKey: "userSettings.components.booking_assignment.description" },
  { key: "components.booking_status_update.enabled", nameKey: "userSettings.components.booking_status_update.name", descKey: "userSettings.components.booking_status_update.description" },
  { key: "components.customer_management.enabled", nameKey: "userSettings.components.customer_management.name", descKey: "userSettings.components.customer_management.description" },
  { key: "components.equipment_management.enabled", nameKey: "userSettings.components.equipment_management.name", descKey: "userSettings.components.equipment_management.description" },
  { key: "components.notifications.enabled", nameKey: "userSettings.components.notifications.name", descKey: "userSettings.components.notifications.description" },
  { key: "components.notification_send.enabled", nameKey: "userSettings.components.notification_send.name", descKey: "userSettings.components.notification_send.description" },
  { key: "components.settings_modify.enabled", nameKey: "userSettings.components.settings_modify.name", descKey: "userSettings.components.settings_modify.description" },
  { key: "components.pdf_export.enabled", nameKey: "userSettings.components.pdf_export.name", descKey: "userSettings.components.pdf_export.description" },
  { key: "components.mobile_menu.enabled", nameKey: "userSettings.components.mobile_menu.name", descKey: "userSettings.components.mobile_menu.description" },
];

export default function UserSettings() {
  const { t } = useLanguage();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("pages");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users (except supervisors and admins)
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (data) => data?.filter(user => user.role === "cleaner") || [],
  });

  // Fetch user-specific settings for selected user
  const { data: userSettings = [], isLoading: settingsLoading } = useQuery<UserSetting[]>({
    queryKey: selectedUserId ? [`/api/user-settings/${selectedUserId}`] : [],
    enabled: !!selectedUserId,
  });

  const updateUserSettingMutation = useMutation({
    mutationFn: async ({ userId, settingKey, isEnabled }: { userId: number; settingKey: string; isEnabled: boolean }) => {
      const response = await apiRequest("POST", "/api/user-settings", {
        userId,
        settingKey,
        isEnabled,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific user's settings for immediate update
      queryClient.invalidateQueries({
        queryKey: [`/api/user-settings/${variables.userId}`],
        exact: true
      });
      // Also invalidate all user-settings queries
      queryClient.invalidateQueries({
        queryKey: ["/api/user-settings"],
        exact: false
      });
      toast({
        title: t('userSettings.updateSuccess'),
        description: t('userSettings.updateSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('userSettings.updateError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isSettingEnabled = (settingKey: string): boolean => {
    const setting = userSettings.find(s => s.settingKey === settingKey);
    return setting ? setting.isEnabled : true; // Default to enabled if no setting exists
  };

  const handleSettingChange = (settingKey: string, isEnabled: boolean) => {
    if (!selectedUserId) return;

    updateUserSettingMutation.mutate({
      userId: parseInt(selectedUserId),
      settingKey,
      isEnabled,
    });
  };

  const renderSettingCard = (setting: { key: string; nameKey: string; descKey: string }) => {
    const isEnabled = isSettingEnabled(setting.key);
    const isUpdating = updateUserSettingMutation.isPending;

    return (
      <Card key={setting.key} className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">{t(setting.nameKey)}</h3>
                <Badge variant={isEnabled ? "default" : "secondary"}>
                  {isEnabled ? t('userSettings.enabled') : t('userSettings.disabled')}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">{t(setting.descKey)}</p>
            </div>
            <div className="flex items-center space-x-2">
              {isEnabled ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-red-600" />
              )}
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
                disabled={isUpdating || !selectedUserId}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (usersLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('userSettings.title')}</h1>
          <p className="text-gray-600">{t('userSettings.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-amber-600" />
          <span className="text-sm text-gray-600">{t('userSettings.teamMembersCount', { count: users.length.toString() })}</span>
        </div>
      </div>

      {/* User Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>{t('userSettings.selectUser')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('userSettings.selectUserPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} (@{user.username}) - {user.isActive ? t('admin.active') : t('admin.inactive')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedUserId && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                {t('userSettings.settingsFor', { name: users.find(u => u.id.toString() === selectedUserId)?.name || '' })}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Configuration */}
      {selectedUserId ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pages">{t('userSettings.tabs.pages')}</TabsTrigger>
            <TabsTrigger value="components">{t('userSettings.tabs.components')}</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('userSettings.pageAccessControl')}</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <SettingsIcon className="h-4 w-4" />
                  <span>{t('userSettings.enabledCount', { enabled: pageSettings.filter(s => isSettingEnabled(s.key)).length.toString(), total: pageSettings.length.toString() })}</span>
                </div>
              </div>
              {settingsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {pageSettings.map(renderSettingCard)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="components" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('userSettings.featureAccessControl')}</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>{t('userSettings.enabledCount', { enabled: componentSettings.filter(s => isSettingEnabled(s.key)).length.toString(), total: componentSettings.length.toString() })}</span>
                </div>
              </div>
              {settingsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {componentSettings.map(renderSettingCard)}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <UserX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('userSettings.noUserSelected')}</h3>
            <p className="text-gray-600 mb-6">
              {t('userSettings.noUserSelectedDesc')}
            </p>
            <div className="text-sm text-gray-500">
              <p>{t('userSettings.controlList.title')}</p>
              <ul className="mt-2 space-y-1">
                <li>• {t('userSettings.controlList.pages')}</li>
                <li>• {t('userSettings.controlList.features')}</li>
                <li>• {t('userSettings.controlList.permissions')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>{t('userSettings.permissionSystem')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-700 space-y-2">
            {/*  @ts-ignore */}
            {(t('userSettings.permissionNotes', { returnObjects: true })).map((note: string, index: number) => (
              <p key={index}>• {note}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
