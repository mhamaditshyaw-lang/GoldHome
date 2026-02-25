import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings as SettingsIcon, Shield, Users, FileText, BarChart3, MapPin, CreditCard, UserCog } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebSocket } from "@/hooks/use-websocket";
import { authManager } from "@/lib/auth";

interface Setting {
  id: number;
  key: string;
  value: any;
  description: string | null;
  category: string;
  updatedAt: string;
}

export default function Settings() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("pages");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const user = authManager.getState().user;
  
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      toast({
        title: t('common.error'),
        description: t('settings.accessDenied'),
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [user, setLocation, toast, t]);
  
  if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
    return null;
  }
  
  // Enable real-time updates via WebSocket
  useWebSocket();

  const pageSettings = [
    {
      key: "pages.dashboard.enabled",
      labelKey: "settings.pages.dashboard.label",
      descriptionKey: "settings.pages.dashboard.description",
      icon: BarChart3,
      category: "pages"
    },
    {
      key: "pages.invoices.enabled",
      labelKey: "settings.pages.invoices.label",
      descriptionKey: "settings.pages.invoices.description",
      icon: FileText,
      category: "pages"
    },
    {
      key: "pages.bookings.enabled",
      labelKey: "settings.pages.bookings.label",
      descriptionKey: "settings.pages.bookings.description",
      icon: FileText,
      category: "pages"
    },
    {
      key: "pages.assign-bookings.enabled",
      labelKey: "settings.pages.assignBookings.label",
      descriptionKey: "settings.pages.assignBookings.description",
      icon: Users,
      category: "pages"
    },
    {
      key: "pages.customers.enabled",
      labelKey: "settings.pages.customers.label",
      descriptionKey: "settings.pages.customers.description",
      icon: Users,
      category: "pages"
    },
    {
      key: "pages.customer-locations.enabled",
      labelKey: "settings.pages.customerLocations.label",
      descriptionKey: "settings.pages.customerLocations.description",
      icon: MapPin,
      category: "pages"
    },
    {
      key: "pages.services.enabled",
      labelKey: "settings.pages.services.label",
      descriptionKey: "settings.pages.services.description",
      icon: SettingsIcon,
      category: "pages"
    },
    {
      key: "pages.accounting.enabled",
      labelKey: "settings.pages.accounting.label",
      descriptionKey: "settings.pages.accounting.description",
      icon: CreditCard,
      category: "pages"
    },
    {
      key: "pages.expenses.enabled",
      labelKey: "settings.pages.expenses.label",
      descriptionKey: "settings.pages.expenses.description",
      icon: CreditCard,
      category: "pages"
    },
    {
      key: "pages.debt.enabled",
      labelKey: "settings.pages.debt.label",
      descriptionKey: "settings.pages.debt.description",
      icon: CreditCard,
      category: "pages"
    },
    {
      key: "pages.team.enabled",
      labelKey: "settings.pages.team.label",
      descriptionKey: "settings.pages.team.description",
      icon: Users,
      category: "pages"
    },
    {
      key: "pages.tracking.enabled",
      labelKey: "settings.pages.tracking.label",
      descriptionKey: "settings.pages.tracking.description",
      icon: MapPin,
      category: "pages"
    },
    {
      key: "pages.analytics.enabled",
      labelKey: "settings.pages.analytics.label",
      descriptionKey: "settings.pages.analytics.description",
      icon: BarChart3,
      category: "pages"
    },
    {
      key: "pages.admin.enabled",
      labelKey: "settings.pages.admin.label",
      descriptionKey: "settings.pages.admin.description",
      icon: Shield,
      category: "pages"
    },
    {
      key: "pages.security-dashboard.enabled",
      labelKey: "settings.pages.securityDashboard.label",
      descriptionKey: "settings.pages.securityDashboard.description",
      icon: Shield,
      category: "pages"
    },
    {
      key: "pages.settings.enabled",
      labelKey: "settings.pages.settings.label",
      descriptionKey: "settings.pages.settings.description",
      icon: SettingsIcon,
      category: "pages"
    },
    {
      key: "pages.user-settings.enabled",
      labelKey: "settings.pages.userSettings.label",
      descriptionKey: "settings.pages.userSettings.description",
      icon: UserCog,
      category: "pages"
    },
    {
      key: "pages.header-footer.enabled",
      labelKey: "settings.pages.headerFooter.label",
      descriptionKey: "settings.pages.headerFooter.description",
      icon: SettingsIcon,
      category: "pages"
    },
    {
      key: "pages.about-developer.enabled",
      labelKey: "settings.pages.aboutDeveloper.label",
      descriptionKey: "settings.pages.aboutDeveloper.description",
      icon: Users,
      category: "pages"
    }
  ];

  const componentSettings = [
    {
      key: "components.notifications.enabled",
      labelKey: "settings.components.notifications.label",
      descriptionKey: "settings.components.notifications.description",
      icon: CreditCard,
      category: "components"
    },
    {
      key: "components.location_tracking.enabled",
      labelKey: "settings.components.locationTracking.label",
      descriptionKey: "settings.components.locationTracking.description",
      icon: MapPin,
      category: "components"
    },
    {
      key: "components.pdf_export.enabled",
      labelKey: "settings.components.pdfExport.label",
      descriptionKey: "settings.components.pdfExport.description",
      icon: FileText,
      category: "components"
    },
    {
      key: "components.expense_management.enabled",
      labelKey: "settings.components.expenseManagement.label",
      descriptionKey: "settings.components.expenseManagement.description",
      icon: CreditCard,
      category: "components"
    },
    {
      key: "components.financial_reports.enabled",
      labelKey: "settings.components.financialReports.label",
      descriptionKey: "settings.components.financialReports.description",
      icon: BarChart3,
      category: "components"
    },
    {
      key: "components.mobile_menu.enabled",
      labelKey: "settings.components.mobileMenu.label",
      descriptionKey: "settings.components.mobileMenu.description",
      icon: BarChart3,
      category: "components"
    },
    {
      key: "components.user_management.enabled",
      labelKey: "settings.components.userManagement.label",
      descriptionKey: "settings.components.userManagement.description",
      icon: Users,
      category: "components"
    }
  ];

  const systemSettings = [
    {
      key: "system.currency",
      labelKey: "settings.system.currency.label",
      descriptionKey: "settings.system.currency.description",
      type: "select",
      options: [
        { value: "IQD", labelKey: "settings.system.currency.iraqiDinar" }
      ],
      icon: CreditCard,
      category: "system"
    }
  ];

  const { data: settings = [], isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
    select: (data) => data || [],
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Authentication required')) {
        return false;
      }
      return failureCount < 3;
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const response = await apiRequest("PUT", `/api/settings/${key}`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: t('settings.toast.settingsUpdated'),
        description: t('settings.toast.settingUpdatedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('settings.toast.error'),
        description: t('settings.toast.failedToUpdate'),
        variant: "destructive",
      });
    },
  });

  const createSettingMutation = useMutation({
    mutationFn: async (settingData: { key: string; value: any; description?: string; category: string }) => {
      const response = await apiRequest("POST", "/api/settings", settingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  const getSettingValue = (key: string): boolean => {
    const setting = settings.find((s: Setting) => s.key === key);
    return setting ? setting.value : true;
  };

  const handleToggleSetting = async (key: string, newValue: boolean | string) => {
    const existingSetting = settings.find((s: Setting) => s.key === key);
    
    if (existingSetting) {
      updateSettingMutation.mutate({ key, value: newValue });
    } else {
      const settingConfig = [...pageSettings, ...componentSettings].find((s: any) => s.key === key);
      createSettingMutation.mutate({
        key,
        value: newValue,
        description: settingConfig?.descriptionKey ? t(settingConfig.descriptionKey) : undefined,
        category: settingConfig?.category || "general"
      });
    }
  };

  const renderSettingCard = (settingConfig: typeof pageSettings[0] | typeof componentSettings[0]) => {
    const isEnabled = getSettingValue(settingConfig.key);
    const Icon = (settingConfig as any).icon || SettingsIcon;
    const label = t(settingConfig.labelKey);
    const description = t(settingConfig.descriptionKey);

    return (
      <Card key={settingConfig.key} className="transition-all duration-200 hover:shadow-md" data-testid={`setting-card-${settingConfig.key}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
                <Icon className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium" data-testid={`setting-label-${settingConfig.key}`}>{label}</h3>
                  <Badge variant={isEnabled ? "default" : "secondary"} data-testid={`setting-status-${settingConfig.key}`}>
                    {isEnabled ? t('settings.status.enabled') : t('settings.status.disabled')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1" data-testid={`setting-description-${settingConfig.key}`}>
                  {description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor={settingConfig.key} className="text-sm">
                {isEnabled ? t('settings.status.on') : t('settings.status.off')}
              </Label>
              <Switch
                id={settingConfig.key}
                checked={isEnabled}
                onCheckedChange={(checked) => handleToggleSetting(settingConfig.key, checked)}
                disabled={updateSettingMutation.isPending || createSettingMutation.isPending}
                data-testid={`switch-${settingConfig.key}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSystemSettingCard = (settingConfig: any) => {
    const currentValue = getSettingValue(settingConfig.key) || settingConfig.options[0].value;
    const Icon = settingConfig.icon || SettingsIcon;
    const label = t(settingConfig.labelKey);
    const description = t(settingConfig.descriptionKey);

    if (settingConfig.type === "select") {
      return (
        <Card key={settingConfig.key} className="transition-all duration-200 hover:shadow-md" data-testid={`setting-card-${settingConfig.key}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-gold-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium" data-testid={`setting-label-${settingConfig.key}`}>{label}</h3>
                    <Badge variant="outline" data-testid={`setting-value-${settingConfig.key}`}>
                      {t(settingConfig.options.find((opt: any) => opt.value === currentValue)?.labelKey)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1" data-testid={`setting-description-${settingConfig.key}`}>
                    {description}
                  </p>
                </div>
              </div>
              <div className="w-48">
                <Select
                  value={currentValue}
                  onValueChange={(value) => handleToggleSetting(settingConfig.key, value)}
                  disabled={updateSettingMutation.isPending || createSettingMutation.isPending}
                >
                  <SelectTrigger data-testid={`select-${settingConfig.key}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settingConfig.options.map((option: any) => (
                      <SelectItem key={option.value} value={option.value} data-testid={`select-item-${option.value}`}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="settings-title">{t('settings.title')}</h1>
            <p className="text-gray-600 mt-2" data-testid="settings-subtitle">
              {t('settings.subtitle')}
            </p>
          </div>
          <Link href="/user-settings">
            <Button variant="outline" className="flex items-center space-x-2" data-testid="button-user-settings">
              <UserCog className="h-4 w-4" />
              <span>{t('settings.userSpecificSettings')}</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex space-x-1 mb-8">
        <Button
          variant={activeCategory === "pages" ? "default" : "outline"}
          onClick={() => setActiveCategory("pages")}
          className="flex items-center space-x-2"
          data-testid="tab-pages"
        >
          <FileText className="h-4 w-4" />
          <span>{t('settings.tabs.pages')}</span>
        </Button>
        <Button
          variant={activeCategory === "components" ? "default" : "outline"}
          onClick={() => setActiveCategory("components")}
          className="flex items-center space-x-2"
          data-testid="tab-components"
        >
          <SettingsIcon className="h-4 w-4" />
          <span>{t('settings.tabs.components')}</span>
        </Button>
        <Button
          variant={activeCategory === "system" ? "default" : "outline"}
          onClick={() => setActiveCategory("system")}
          className="flex items-center space-x-2"
          data-testid="tab-system"
        >
          <CreditCard className="h-4 w-4" />
          <span>{t('settings.tabs.system')}</span>
        </Button>
      </div>

      <div className="space-y-4">
        {activeCategory === "pages" && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4" data-testid="section-page-visibility">{t('settings.sections.pageVisibility')}</h2>
            <div className="grid gap-4">
              {pageSettings.map(renderSettingCard)}
            </div>
          </>
        )}

        {activeCategory === "components" && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4" data-testid="section-component-features">{t('settings.sections.componentFeatures')}</h2>
            <div className="grid gap-4">
              {componentSettings.map(renderSettingCard)}
            </div>
          </>
        )}

        {activeCategory === "system" && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4" data-testid="section-system-configuration">{t('settings.sections.systemConfiguration')}</h2>
            <div className="grid gap-4">
              {systemSettings.map(renderSystemSettingCard)}
            </div>
          </>
        )}
      </div>

      <Card className="mt-8 border-amber-200 bg-amber-50" data-testid="notice-card">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span data-testid="notice-title">{t('settings.notice.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700" data-testid="notice-message">
            {t('settings.notice.message')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
