import React, { useEffect, useRef, useState } from 'react';

interface LocationData {
  id: number;
  userId: number;
  latitude: string;
  longitude: string;
  isWorking: boolean;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    avatar: string | null;
  };
}

interface GoogleMapProps {
  locations: LocationData[];
  height?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMap({ 
  locations, 
  height = "400px", 
  zoom = 13, 
  center = { lat: 34.6220955, lng: 45.3088178 } 
}: GoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: number]: any }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps Script
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        initializeMap();
      };
      
      script.onerror = () => {
        setError('Failed to load Google Maps');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapContainerRef.current) return;

      try {
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center,
          zoom,
          styles: [
            {
              featureType: "all",
              elementType: "geometry.fill",
              stylers: [{ color: "#f5f5f5" }]
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#ffffff" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#a2daf2" }]
            }
          ],
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapRef.current = map;
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();

    return () => {
      // Cleanup markers
      Object.values(markersRef.current).forEach((marker: any) => {
        marker.setMap(null);
      });
      markersRef.current = {};
    };
  }, [center, zoom]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => {
      marker.setMap(null);
    });
    markersRef.current = {};

    // Add new markers
    locations.forEach((location) => {
      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;

      const position = { lat, lng };
      
      // Create custom marker
      const marker = new window.google.maps.Marker({
        position,
        map: mapRef.current,
        title: location.user.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: location.isWorking ? '#10b981' : '#6b7280',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">
              ${location.user.name}
            </h3>
            <p style="margin: 0; color: ${location.isWorking ? '#059669' : '#6b7280'}; font-size: 12px;">
              ${location.isWorking ? '🟢 Working' : '⚫ Offline'}
            </p>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 11px;">
              Last seen: ${new Date(location.updatedAt).toLocaleString()}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Close other info windows
        Object.values(markersRef.current).forEach((m: any) => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });
        
        // Open this info window
        infoWindow.open(mapRef.current, marker);
      });

      markersRef.current[location.id] = marker;
      marker.infoWindow = infoWindow;
    });

    // Adjust map bounds to fit all markers
    if (locations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach((location) => {
        const lat = parseFloat(location.latitude);
        const lng = parseFloat(location.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend({ lat, lng });
        }
      });
      
      if (locations.length === 1) {
        mapRef.current.setCenter(bounds.getCenter());
        mapRef.current.setZoom(zoom);
      } else {
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [locations, zoom]);

  if (error) {
    return (
      <div 
        style={{ height }}
        className="flex items-center justify-center bg-gray-100 rounded-lg border"
      >
        <div className="text-center p-4">
          <p className="text-red-600 mb-2">Map Error</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div 
          style={{ height }}
          className="flex items-center justify-center bg-gray-100 rounded-lg border"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        style={{ height, display: isLoading ? 'none' : 'block' }}
        className="rounded-lg border shadow-sm"
      />
    </div>
  );
}