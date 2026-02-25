import { useQuery } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";

interface Setting {
  id: number;
  key: string;
  value: any;
  description: string | null;
  category: string;
  updatedAt: string;
}

interface UserSetting {
  id: number;
  userId: number;
  settingKey: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useSettings() {
  const authState = authManager.getState();
  const user = authState.user;

  const { data: settings = [], isLoading: settingsLoading } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
    select: (data) => data || [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
    retry: (failureCount, error: any) => {
      // Don't retry if it's an auth error
      if (error?.message?.includes('Authentication required')) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Fetch user-specific settings for all authenticated users
  const { data: userSettings = [], isLoading: userSettingsLoading } = useQuery<UserSetting[]>({
    queryKey: user?.id ? [`/api/user-settings/${user.id}`] : [],
    enabled: !!user?.id,
    select: (data) => data || [],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = settingsLoading || userSettingsLoading;

  const getSettingValue = (key: string, defaultValue: any = true): any => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  const isPageEnabled = (pageName: string): boolean => {
    // Admin and supervisor users always have access to all pages
    if (user && (user.role === 'supervisor' || user.role === 'admin')) {
      return true;
    }

    // For regular users, check user-specific settings first
    if (user && user.role === 'cleaner') {
      const userSetting = userSettings.find(s => s.settingKey === `pages.${pageName}.enabled`);
      if (userSetting) {
        return userSetting.isEnabled;
      }
    }

    // Fallback to global settings
    const globalEnabled = getSettingValue(`pages.${pageName}.enabled`, true);
    
    // Extra safety: some pages are admin-only by default if no setting exists
    const adminOnlyPages = ['admin', 'security_dashboard', 'cloudflare_dns', 'backup_restore'];
    if (adminOnlyPages.includes(pageName) && user?.role !== 'admin') {
      return false;
    }

    return globalEnabled;
  };

  const isComponentEnabled = (componentName: string): boolean => {
    // Admin and supervisor users always have access to all components
    if (user && (user.role === 'supervisor' || user.role === 'admin')) {
      return true;
    }

    // For regular users, check user-specific settings first
    if (user && user.role === 'cleaner') {
      const userSetting = userSettings.find(s => s.settingKey === `components.${componentName}.enabled`);
      if (userSetting) {
        return userSetting.isEnabled;
      }
    }

    // Fallback to global settings
    return getSettingValue(`components.${componentName}.enabled`, true);
  };

  return {
    settings,
    userSettings,
    isLoading,
    getSettingValue,
    isPageEnabled,
    isComponentEnabled,
  };
}