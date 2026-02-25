import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Battery, Signal, Clock, ExternalLink } from 'lucide-react';
import { loadGoogleMaps, isGoogleMapsLoaded } from '@/lib/google-maps';

declare global {
  interface Window {
    google: any;
  }
}

interface LiveTrackingData {
  id: number;
  bookingId: number;
  cleanerId: number;
  latitude: string;
  longitude: string;
  isActive: boolean;
  batteryLevel: number | null;
  accuracy: string | null;
  heading: string | null;
  speed: string | null;
  status: string;
  updatedAt: string;
  createdAt: string;
}

interface CleanerInfo {
  id: number;
  name: string;
  phone?: string;
  avatar?: string;
}

interface LiveTrackingMapProps {
  bookingId: number;
  customerLocation?: { latitude: number; longitude: number; address: string };
  onTrackingUpdate?: (tracking: LiveTrackingData | null) => void;
}

const GoogleMapComponent = ({ cleanerLat, cleanerLng, customerLat, customerLng, accuracy }: {
  cleanerLat: number;
  cleanerLng: number;
  customerLat?: number;
  customerLng?: number;
  accuracy?: number;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        await loadGoogleMaps();
        
        if (!mapInstance.current) {
          mapInstance.current = new window.google.maps.Map(mapRef.current, {
            zoom: 15,
            center: { lat: cleanerLat, lng: cleanerLng },
            mapTypeControl: false,
            streetViewControl: false,
          });
        }
        
        setMapReady(true);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    // Clear existing markers
    mapInstance.current.markers?.forEach((marker: any) => marker.setMap(null));
    mapInstance.current.circles?.forEach((circle: any) => circle.setMap(null));
    mapInstance.current.markers = [];
    mapInstance.current.circles = [];

    // Add cleaner marker
    const cleanerMarker = new window.google.maps.Marker({
      position: { lat: cleanerLat, lng: cleanerLng },
      map: mapInstance.current,
      title: 'Service Provider',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      }
    });

    mapInstance.current.markers = [cleanerMarker];

    // Add accuracy circle if provided
    if (accuracy) {
      const accuracyCircle = new window.google.maps.Circle({
        strokeColor: '#3B82F6',
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: '#3B82F6',
        fillOpacity: 0.1,
        map: mapInstance.current,
        center: { lat: cleanerLat, lng: cleanerLng },
        radius: accuracy
      });
      mapInstance.current.circles = [accuracyCircle];
    }

    // Add customer marker if provided
    if (customerLat && customerLng) {
      const customerMarker = new window.google.maps.Marker({
        position: { lat: customerLat, lng: customerLng },
        map: mapInstance.current,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });
      mapInstance.current.markers.push(customerMarker);
    }

    // Center map to show both markers if customer location exists
    if (customerLat && customerLng) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: cleanerLat, lng: cleanerLng });
      bounds.extend({ lat: customerLat, lng: customerLng });
      mapInstance.current.fitBounds(bounds);
    } else {
      mapInstance.current.setCenter({ lat: cleanerLat, lng: cleanerLng });
    }
  }, [cleanerLat, cleanerLng, customerLat, customerLng, accuracy]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function LiveTrackingMap({ bookingId, customerLocation, onTrackingUpdate }: LiveTrackingMapProps) {
  const [tracking, setTracking] = useState<LiveTrackingData | null>(null);
  const [cleaner, setCleaner] = useState<CleanerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTracking = async () => {
    try {
      const response = await fetch(`/api/tracking/booking/${bookingId}`);
      if (response.ok) {
        const trackingData = await response.json();
        setTracking(trackingData);
        setLastUpdate(new Date());
        setError(null);
        onTrackingUpdate?.(trackingData);

        // Fetch cleaner info if we have a cleanerId
        if (trackingData.cleanerId && !cleaner) {
          try {
            const cleanerResponse = await fetch(`/api/users/${trackingData.cleanerId}`);
            if (cleanerResponse.ok) {
              const cleanerData = await cleanerResponse.json();
              setCleaner(cleanerData);
            }
          } catch (cleanerError) {
            console.error('Failed to fetch cleaner info:', cleanerError);
          }
        }
      } else if (response.status === 404) {
        setTracking(null);
        setError('No active tracking for this booking');
        onTrackingUpdate?.(null);
      } else {
        setError('Failed to fetch tracking data');
      }
    } catch (err) {
      setError('Connection error - unable to fetch tracking data');
      console.error('Tracking fetch error:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTracking();

    // Set up polling every 10 seconds
    intervalRef.current = setInterval(fetchTracking, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bookingId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'tracking': return 'blue';
      case 'arrived': return 'green';
      case 'working': return 'orange';
      case 'completed': return 'green';
      case 'offline': return 'gray';
      default: return 'blue';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'tracking': return 'En Route';
      case 'arrived': return 'Arrived';
      case 'working': return 'Working';
      case 'completed': return 'Completed';
      case 'offline': return 'Offline';
      default: return status;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatSpeed = (speed: string | null) => {
    if (!speed || parseFloat(speed) === 0) return null;
    const kmh = parseFloat(speed) * 3.6; // Convert m/s to km/h
    return `${kmh.toFixed(1)} km/h`;
  };

  if (error && !tracking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchTracking} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tracking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Tracking will start when your service provider begins their journey</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const cleanerLat = parseFloat(tracking.latitude);
  const cleanerLng = parseFloat(tracking.longitude);
  
  const customerLat = customerLocation?.latitude;
  const customerLng = customerLocation?.longitude;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Live Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Status Bar */}
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {cleaner && (
                <div className="flex items-center gap-2">
                  {cleaner.avatar && (
                    <img 
                      src={cleaner.avatar} 
                      alt={cleaner.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{cleaner.name}</p>
                    <p className="text-xs text-muted-foreground">Service Provider</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-${getStatusColor(tracking.status)}`}>
                {getStatusText(tracking.status)}
              </Badge>
            </div>
          </div>

          {/* Tracking Details */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Updated {formatTime(tracking.updatedAt)}</span>
            </div>
            
            {tracking.batteryLevel && (
              <div className="flex items-center gap-1">
                <Battery className="h-4 w-4" />
                <span>{tracking.batteryLevel}%</span>
              </div>
            )}
            
            {tracking.accuracy && (
              <div className="flex items-center gap-1">
                <Signal className="h-4 w-4" />
                <span>±{parseFloat(tracking.accuracy).toFixed(0)}m</span>
              </div>
            )}
            
            {formatSpeed(tracking.speed) && (
              <div className="flex items-center gap-1">
                <Navigation className="h-4 w-4" />
                <span>{formatSpeed(tracking.speed)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Map - Simple Location Display */}
        <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center p-6">
            <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="font-semibold text-lg">Service Provider Location</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Latitude:</p>
                  <p className="font-mono">{cleanerLat.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Longitude:</p>
                  <p className="font-mono">{cleanerLng.toFixed(6)}</p>
                </div>
              </div>
              {tracking.accuracy && (
                <div className="mt-3">
                  <p className="text-muted-foreground text-xs">
                    Location accuracy: ±{parseFloat(tracking.accuracy).toFixed(0)} meters
                  </p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${cleanerLat},${cleanerLng}`;
                    window.open(url, '_blank');
                  }}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Google Maps
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="p-4 border-t">
          <Button 
            onClick={fetchTracking} 
            variant="outline" 
            className="w-full"
            size="sm"
          >
            Refresh Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}