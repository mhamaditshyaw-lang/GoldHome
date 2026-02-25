import { ReactNode } from "react";
import { useSettings } from "@/hooks/use-settings";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface SettingsWrapperProps {
  children: ReactNode;
  settingKey: string;
  fallback?: ReactNode;
  type?: "page" | "component";
}

export function SettingsWrapper({ 
  children, 
  settingKey, 
  fallback,
  type = "component" 
}: SettingsWrapperProps) {
  const { isPageEnabled, isComponentEnabled, isLoading } = useSettings();
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const isEnabled = type === "page" 
    ? isPageEnabled(settingKey) 
    : isComponentEnabled(settingKey);

  if (!isEnabled) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback for disabled features
    if (type === "page") {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Page Not Available
              </h2>
              <p className="text-gray-500">
                This page has been disabled by your administrator. 
                Contact your supervisor for access.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // For components, return null to hide completely
    return null;
  }

  return <>{children}</>;
}

// Convenience hooks for checking specific features
export function usePageAccess(pageName: string) {
  const { isPageEnabled, isLoading } = useSettings();
  return {
    isEnabled: isPageEnabled(pageName),
    isLoading
  };
}

export function useComponentAccess(componentName: string) {
  const { isComponentEnabled, isLoading } = useSettings();
  return {
    isEnabled: isComponentEnabled(componentName),
    isLoading
  };
}