
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, Wifi, WifiOff, Play, Square, RotateCcw, Activity } from "lucide-react";
import { Location } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useWebSocket } from "@/hooks/use-websocket";
import { authManager } from "@/lib/auth";
import { useState, useEffect } from "react";
import OSMMap from "@/components/maps/osm-map";
import SimpleMap from "@/components/maps/simple-map";
import EnhancedLiveMap from "@/components/tracking/enhanced-live-map";
import LocationPerformanceMonitor from "@/components/tracking/location-performance-monitor";
import { locationTracker } from "@/services/location-tracker";
import LocationHistory from "@/components/tracking/location-history";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface LocationWithUser extends Location {
  user: { id: number; name: string; avatar: string | null } | null;
}

export default function Tracking() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();

  // Check if user has access to this page
  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("tracking")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  const { data: activeLocations, isLoading } = useQuery({
    queryKey: ["/api/locations/active"],
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: false,
  });

  // Remove duplicates and filter only working team members
  const displayLocations = React.useMemo(() => {
    if (!activeLocations) return [];

    const uniqueLocations = new Map();
    (activeLocations as any[]).forEach((location: any) => {
      // Only include locations where user is working and has valid coordinates
      if (location.isWorking && location.latitude && location.longitude && location.user) {
        uniqueLocations.set(location.userId, location);
      }
    });

    return Array.from(uniqueLocations.values());
  }, [activeLocations]);

  const { isConnected, locations: wsLocations, sendLocationUpdate } = useWebSocket();
  const [isSimulating, setIsSimulating] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [mapType, setMapType] = useState<'interactive' | 'list'>('interactive');
  const user = authManager.getState().user;

  // Disable simulation by default to use real GPS
  useEffect(() => {
    setIsSimulating(false);
  }, []);

  // Use WebSocket data if available, otherwise fall back to API data
  const displayLocationsWS = wsLocations.length > 0 ? wsLocations : activeLocations || [];

  // Calculate map center based on real user locations
  const mapCenter = React.useMemo(() => {
    if (displayLocations.length > 0) {
      const avgLat = displayLocations.reduce((sum, loc) => sum + parseFloat(loc.latitude), 0) / displayLocations.length;
      const avgLng = displayLocations.reduce((sum, loc) => sum + parseFloat(loc.longitude), 0) / displayLocations.length;
      return { lat: avgLat, lng: avgLng };
    }
    // Default to Kalar city center coordinates
    return { lat: 34.6220955, lng: 45.3088178 }; // Kalar, Kurdistan, Iraq
  }, [displayLocations]);

  // Check if location tracking is active
  useEffect(() => {
    setTrackingActive(locationTracker.isActive());

    // Check periodically
    const interval = setInterval(() => {
      setTrackingActive(locationTracker.isActive());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Location simulation for testing
  useEffect(() => {
    if (!isSimulating || !user) return;

    const interval = setInterval(() => {
      // Simulate movement around NYC area
      const baseLatitude = 40.7589;
      const baseLongitude = -73.9851;
      const latitude = (baseLatitude + (Math.random() - 0.5) * 0.01).toString();
      const longitude = (baseLongitude + (Math.random() - 0.5) * 0.01).toString();

      sendLocationUpdate({
        userId: user.id,
        latitude,
        longitude,
        isWorking: true,
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isSimulating, user, sendLocationUpdate]);

  const handleToggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  // Location tracking is now handled by the location tracker service with real GPS

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('tracking.title')}
            </h2>
            <div className="mt-1 flex items-center space-x-4">
              <p className="text-sm text-gray-500">
                {t('tracking.subtitle')}
              </p>
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? t('tracking.connected') : t('tracking.disconnected')}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Button
              variant={trackingActive ? "destructive" : "default"}
              onClick={() => {
                if (trackingActive) {
                  locationTracker.stopTracking();
                } else {
                  locationTracker.startTracking();
                }
              }}
              disabled={!user}
              className="flex items-center"
            >
              {trackingActive ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  {t('tracking.stopTracking')}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {t('tracking.startTracking')}
                </>
              )}
            </Button>

            <Button
              variant={isSimulating ? "destructive" : "outline"}
              onClick={handleToggleSimulation}
              disabled={!user}
              size="sm"
            >
              {isSimulating ? t('tracking.stopTestMode') : t('tracking.startTestMode')}
            </Button>
          </div>
        </div>

        {/* Performance Monitor */}
        <div className="mt-6">
          <LocationPerformanceMonitor
            isConnected={isConnected}
            locationsCount={displayLocations.length}
            onRefresh={() => {
              // Data updates in real-time via WebSocket - no refresh needed
            }}
          />
        </div>

        {/* Live Map */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                {t('tracking.liveMapView')}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {t('tracking.activeCount', { count: displayLocations.length.toString() })}
                </Badge>
                {isSimulating && (
                  <Badge variant="destructive" className="text-xs">
                    {t('tracking.testModeActive')}
                  </Badge>
                )}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setMapType('interactive')}
                    className={`px-2 py-1 text-xs rounded ${mapType === 'interactive'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {t('tracking.mapTypes.interactive')}
                  </button>
                  <button
                    onClick={() => setMapType('list')}
                    className={`px-2 py-1 text-xs rounded ${mapType === 'list'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {t('tracking.mapTypes.list')}
                  </button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mapType === 'interactive' ? (
              <EnhancedLiveMap
                locations={displayLocations}
                height="600px"
                zoom={13}
                center={mapCenter}
                showStatistics={false}
              />
            ) : (
              <div className="space-y-4">
                {/* Live Updates Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('tracking.stats.activeWorkers')}</p>
                      <p className="text-2xl font-bold text-green-600">
                        {displayLocations.filter(loc => loc.isWorking).length}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('tracking.stats.totalTracked')}</p>
                      <p className="text-2xl font-bold text-blue-600">{displayLocations.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      {isConnected ? (
                        <Wifi className="h-6 w-6 text-purple-600" />
                      ) : (
                        <WifiOff className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('tracking.stats.connection')}</p>
                      <p className="text-lg font-bold text-purple-600">
                        {isConnected ? t('tracking.stats.live') : t('tracking.stats.offline')}
                      </p>
                    </div>
                  </div>
                </div>

                {displayLocations.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('tracking.noActiveMembers')}</h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      {t('tracking.noActiveMembersDesc')}
                    </p>
                    <Button
                      onClick={() => {
                        // Data updates in real-time - no manual refresh needed
                      }}
                      variant="outline"
                      disabled
                      className="flex items-center space-x-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>{t('common.refresh')}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {displayLocations.map((location: any) => (
                      <Card key={location.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0 relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${location.isWorking ? 'bg-green-500 shadow-lg' : 'bg-gray-400'
                                  }`}>
                                  {location.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                </div>
                                {location.isWorking && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="text-lg font-semibold truncate">
                                    {location.user?.name || t('common.unknownUser')}
                                  </h3>
                                  <Badge
                                    variant={location.isWorking ? "default" : "secondary"}
                                    className={location.isWorking ? "bg-green-500 hover:bg-green-600" : ""}
                                  >
                                    {location.isWorking ? t('tracking.status.working') : t('tracking.status.offline')}
                                  </Badge>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                                    <span className="font-mono">
                                      {parseFloat(location.latitude).toFixed(6)}, {parseFloat(location.longitude).toFixed(6)}
                                    </span>
                                  </div>

                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-4 w-4 mr-1 text-orange-500" />
                                    <span>
                                      {t('tracking.updatedAt', { distance: formatDistanceToNow(new Date(location.updatedAt), { addSuffix: true }) })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end space-y-1">
                              <div className={`w-3 h-3 rounded-full ${isConnected && location.isWorking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                                }`}></div>
                              <span className="text-xs text-gray-400">
                                {isConnected ? t('tracking.status.live') : t('tracking.status.cached')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active team members */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('tracking.activeTeamMembers')}</h3>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayLocations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('tracking.noActiveWorkers')}</h3>
                <p className="text-gray-500">
                  {t('tracking.noActiveWorkersDesc')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayLocations.map((location) => (
                <Card key={location.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={location.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(location.user?.name || t('common.unknownUser'))}&background=D4AF37&color=fff`}
                        alt={location.user?.name || t('common.unknownUser')}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {location.user?.name || t('common.unknownUser')}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1" />
                            {t('tracking.status.working')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>
                          {parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {t('tracking.updatedAt', { distance: formatDistanceToNow(new Date(location.updatedAt), { addSuffix: true }) })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Location history */}
        <LocationHistory />
      </div>
    </div>
  );
}
