import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Battery, Signal, Clock, ExternalLink, Wifi, WifiOff, Activity, Map, RefreshCw } from 'lucide-react';
import { useLocation } from 'wouter';
import FreeMap from '@/components/maps/free-map';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/hooks/use-settings';

interface LiveLocationData {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  batteryLevel?: number;
  isWorking: boolean;
  timestamp: string;
  user?: {
    id: number;
    name: string;
    avatar: string | null;
  };
}

export default function LiveTrackingPage() {
  const [, setLocation] = useLocation();
  const [liveLocations, setLiveLocations] = useState<Map<string, LiveLocationData>>(new globalThis.Map<string, LiveLocationData>());
  const [isConnected, setIsConnected] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();

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

  useEffect(() => {
    // Connect to WebSocket for live location updates
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Connected to live tracking WebSocket');
        setIsConnected(true);
        setWsConnection(ws);
      };
      
      ws.onclose = () => {
        console.log('Disconnected from live tracking WebSocket');
        setIsConnected(false);
        setWsConnection(null);
        // Try to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'locations_update' && data.data) {
            // Update live locations from backend broadcast
            const newLocations = new globalThis.Map<string, LiveLocationData>(liveLocations);
            data.data.forEach((location: any) => {
              // Convert backend location format to frontend format
              const liveLocation: LiveLocationData = {
                userId: location.userId.toString(),
                latitude: parseFloat(location.latitude),
                longitude: parseFloat(location.longitude),
                isWorking: location.isWorking,
                timestamp: location.updatedAt || new Date().toISOString(),
                accuracy: location.accuracy,
                speed: location.speed,
                heading: location.heading,
                batteryLevel: location.batteryLevel,
                user: location.user
              };
              newLocations.set(liveLocation.userId, liveLocation);
            });
            setLiveLocations(newLocations);
          } else if (data.type === 'location_broadcast' && data.locations) {
            // Update live locations (legacy format)
            const newLocations = new globalThis.Map<string, LiveLocationData>(liveLocations);
            data.locations.forEach((location: LiveLocationData) => {
              newLocations.set(location.userId, location);
            });
            setLiveLocations(newLocations);
          } else if (data.type === 'location_update') {
            // Single location update
            const newLocations = new globalThis.Map<string, LiveLocationData>(liveLocations);
            newLocations.set(data.userId, data);
            setLiveLocations(newLocations);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 1) return `${seconds} ${t('tracking.secondsAgo')}`;
    if (minutes === 1) return `1 ${t('tracking.minuteAgo')}`;
    if (minutes < 60) return `${minutes} ${t('tracking.minutesAgo')}`;
    return date.toLocaleTimeString();
  };

  const formatSpeed = (speed?: number) => {
    if (!speed || speed === 0) return null;
    return `${(speed * 3.6).toFixed(1)} ${t('tracking.kmh')}`; // Convert m/s to km/h
  };

  const getLocationAccuracy = (accuracy?: number) => {
    if (!accuracy) return t('tracking.unknown');
    if (accuracy < 10) return t('tracking.high');
    if (accuracy < 50) return t('tracking.good');
    return t('tracking.low');
  };

  const handleRefreshLocation = async () => {
    setIsRefreshing(true);
    try {
      if (!navigator.geolocation) {
        throw new Error(t('tracking.geolocationNotSupported'));
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0 // Force fresh location
          }
        );
      });

      // Import location tracker to restart tracking with fresh coordinates
      const { locationTracker } = await import('@/services/location-tracker');
      locationTracker.stopTracking();
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay
      locationTracker.startTracking();

      toast({
        title: t('tracking.locationRefreshed'),
        description: `${t('tracking.locationRefreshedDesc')}: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
      });
    } catch (error) {
      console.error('Failed to refresh location:', error);
      toast({
        title: t('tracking.locationRefreshFailed'),
        description: error instanceof Error ? error.message : t('tracking.locationRefreshFailedDesc'),
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('tracking.liveLocationTracking')}</h1>
            <p className="text-muted-foreground">{t('tracking.monitorProviders')}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={isConnected ? "text-green-600" : "text-red-600"}>
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  {t('tracking.connected')}
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  {t('tracking.disconnected')}
                </>
              )}
            </Badge>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshLocation}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? t('tracking.refreshing') : t('tracking.refreshLocation')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/dashboard')}
              >
                {t('tracking.backToDashboard')}
              </Button>
            </div>
          </div>
        </div>

        {/* Map View */}
        {liveLocations.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                {t('tracking.liveLocationMap')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FreeMap 
                locations={Array.from(liveLocations.values()).map(location => ({
                  id: parseInt(location.userId),
                  userId: parseInt(location.userId),
                  latitude: location.latitude.toString(),
                  longitude: location.longitude.toString(),
                  isWorking: location.isWorking,
                  updatedAt: location.timestamp,
                  user: location.user || { id: parseInt(location.userId), name: `${t('tracking.user')} ${location.userId}`, avatar: null }
                }))}
                height="400px"
                zoom={13}
                center={{ 
                  lat: Array.from(liveLocations.values())[0]?.latitude || 34.6220955, 
                  lng: Array.from(liveLocations.values())[0]?.longitude || 45.3088178 
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Active Locations */}
        {liveLocations.size === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('tracking.noActiveTracking')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('tracking.noProvidersSharing')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('tracking.locationSharingInfo')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from(liveLocations.entries()).map(([userId, location]) => (
              <Card key={userId} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      <span>{location.user?.name || `${t('tracking.user')} ${userId}`}</span>
                    </div>
                    <Badge variant={location.isWorking ? "default" : "secondary"}>
                      {location.isWorking ? t('tracking.working') : t('tracking.idle')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location Coordinates */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t('tracking.latitude')}</p>
                      <p className="font-mono text-xs">{location.latitude.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('tracking.longitude')}</p>
                      <p className="font-mono text-xs">{location.longitude.toFixed(6)}</p>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {location.accuracy && (
                      <div className="flex items-center gap-1">
                        <Signal className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">{t('tracking.accuracy')}</p>
                          <p className="text-xs">
                            ±{location.accuracy.toFixed(0)}m ({getLocationAccuracy(location.accuracy)})
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {location.batteryLevel && (
                      <div className="flex items-center gap-1">
                        <Battery className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">{t('tracking.battery')}</p>
                          <p className="text-xs">{location.batteryLevel}%</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Speed and Heading */}
                  {(location.speed || location.heading) && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {formatSpeed(location.speed) && (
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">{t('tracking.speed')}</p>
                            <p className="text-xs">{formatSpeed(location.speed)}</p>
                          </div>
                        </div>
                      )}
                      
                      {location.heading && (
                        <div>
                          <p className="text-muted-foreground">{t('tracking.heading')}</p>
                          <p className="text-xs">{location.heading.toFixed(0)}°</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Last Update */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                    <Clock className="h-3 w-3" />
                    <span>{t('tracking.updated')} {formatTime(location.timestamp)}</span>
                  </div>

                  {/* View on Maps */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    {t('tracking.viewOnGoogleMaps')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Connection Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {isConnected ? t('tracking.connectedToLiveTracking') : t('tracking.disconnectedFromLiveTracking')}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {liveLocations.size} {liveLocations.size !== 1 ? t('tracking.activeLocations') : t('tracking.activeLocation')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}