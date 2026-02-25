import React, { useEffect, useState, useRef } from 'react';
import { useGeolocation, useBatteryLevel } from '@/hooks/useGeolocation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Wifi, WifiOff, Battery, Signal, Navigation, Clock, Activity } from 'lucide-react';
import { authManager } from '@/lib/auth';

interface LocationSharingProps {
  onLocationUpdate?: (location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    batteryLevel?: number;
  }) => void;
  autoStart?: boolean;
}

export default function LocationSharing({ onLocationUpdate, autoStart = false }: LocationSharingProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const user = authManager.getState().user;
  const batteryLevel = useBatteryLevel();

  // Get location with high accuracy and continuous watching
  const location = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
    watch: isSharing
  });

  // Auto-start location sharing for cleaners when they login
  useEffect(() => {
    if (autoStart && user?.role === 'cleaner') {
      setIsSharing(true);
    }
  }, [autoStart, user]);

  // Setup WebSocket connection when sharing starts
  useEffect(() => {
    if (isSharing && user) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isSharing, user]);

  // Send location updates when location changes
  useEffect(() => {
    if (isSharing && location.latitude && location.longitude && !location.loading && !location.error) {
      sendLocationUpdate();
    }
  }, [isSharing, location.latitude, location.longitude, location.accuracy, location.heading, location.speed]);

  const connectWebSocket = () => {
    if (!user) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for location sharing');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Auto-reconnect if still sharing
        if (isSharing) {
          setTimeout(connectWebSocket, 5000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error - location updates may not be sent');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'error') {
            setError(message.message);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to establish connection');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const sendLocationUpdate = () => {
    if (!isConnected || !wsRef.current || !user || !location.latitude || !location.longitude) {
      return;
    }

    const currentLocation = {
      lat: location.latitude,
      lng: location.longitude
    };

    // Only send update if location has changed significantly (more than 5 meters)
    if (lastLocationRef.current) {
      const distance = getDistanceFromLatLonInMeters(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        currentLocation.lat,
        currentLocation.lng
      );

      if (distance < 5) {
        return; // Skip update if movement is less than 5 meters
      }
    }

    const locationData = {
      type: 'location_update',
      userId: user.id,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      heading: location.heading,
      speed: location.speed,
      batteryLevel: batteryLevel,
      isWorking: true, // Assume working when sharing location
      timestamp: new Date().toISOString()
    };

    try {
      wsRef.current.send(JSON.stringify(locationData));
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
      lastLocationRef.current = currentLocation;
      
      // Call callback if provided
      onLocationUpdate?.({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy ?? undefined,
        heading: locationData.heading ?? undefined,
        speed: locationData.speed ?? undefined,
        batteryLevel: locationData.batteryLevel ?? undefined,
      });
      
      console.log('Location update sent:', locationData);
    } catch (err) {
      console.error('Failed to send location update:', err);
      setError('Failed to send location update');
    }
  };

  // Calculate distance between two points in meters
  const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000; // Convert to meters
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const handleToggleSharing = (checked: boolean) => {
    if (checked) {
      setIsSharing(true);
      setError(null);
    } else {
      setIsSharing(false);
      setUpdateCount(0);
      setLastUpdate(null);
      lastLocationRef.current = null;
    }
  };

  const getLocationStatus = () => {
    if (location.loading) return 'Getting location...';
    if (location.error) return `Error: ${location.error}`;
    if (location.latitude && location.longitude) return 'Location active';
    return 'Location unavailable';
  };

  const formatCoordinate = (coord: number | null) => {
    if (!coord) return 'N/A';
    return coord.toFixed(6);
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  };

  if (user?.role !== 'cleaner') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Location sharing is only available for service providers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Location Sharing
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="text-green-600">
                <Wifi className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">Share Live Location</p>
            <p className="text-sm text-muted-foreground">
              Share your location with customers during service
            </p>
          </div>
          <Switch
            checked={isSharing}
            onCheckedChange={handleToggleSharing}
            disabled={location.loading}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Location Permission Alert */}
        {location.error && (
          <Alert>
            <AlertDescription>
              Please allow location access to share your location with customers.
              {location.error.includes('denied') && (
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2"
                  onClick={() => setError(null)}
                >
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Information */}
        {isSharing && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span className="font-medium">{getLocationStatus()}</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Connection</p>
                <div className="flex items-center gap-1">
                  {isConnected ? (
                    <Wifi className="h-3 w-3 text-green-600" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-600" />
                  )}
                  <span className="font-medium">
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Details */}
            {location.latitude && location.longitude && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Latitude</p>
                    <p className="font-mono text-xs">{formatCoordinate(location.latitude)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Longitude</p>
                    <p className="font-mono text-xs">{formatCoordinate(location.longitude)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  {location.accuracy && (
                    <div>
                      <p className="text-muted-foreground">Accuracy</p>
                      <div className="flex items-center gap-1">
                        <Signal className="h-3 w-3" />
                        <span className="text-xs">±{location.accuracy.toFixed(0)}m</span>
                      </div>
                    </div>
                  )}

                  {batteryLevel && (
                    <div>
                      <p className="text-muted-foreground">Battery</p>
                      <div className="flex items-center gap-1">
                        <Battery className="h-3 w-3" />
                        <span className="text-xs">{batteryLevel}%</span>
                      </div>
                    </div>
                  )}

                  {location.speed && location.speed > 0 && (
                    <div>
                      <p className="text-muted-foreground">Speed</p>
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        <span className="text-xs">
                          {(location.speed * 3.6).toFixed(1)} km/h
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last update: {formatLastUpdate()}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {updateCount} updates sent
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!isSharing && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Enable location sharing to let customers track your journey to their location in real-time.
          </div>
        )}
      </CardContent>
    </Card>
  );
}