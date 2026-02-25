import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

interface FreeMapProps {
  locations: LocationData[];
  height?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
}

export default function FreeMap({ 
  locations, 
  height = "400px", 
  zoom = 9, 
  center = { lat: 34.6220955, lng: 45.3088178 } 
}: FreeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create custom marker icon
  const createMarkerIcon = (location: LocationData) => {
    const initials = location.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const color = location.isWorking ? '#10b981' : '#6b7280';

    return L.divIcon({
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 14px;
          cursor: pointer;
        ">${initials}</div>
      `,
      className: 'custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true
      });

      // Add OpenStreetMap tiles (free alternative to Mapbox)
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        tileSize: 256
      });

      tileLayer.addTo(map);

      // Add loading event handlers
      tileLayer.on('loading', () => setIsLoading(true));
      tileLayer.on('load', () => setIsLoading(false));
      tileLayer.on('tileerror', () => {
        setError('Failed to load map tiles. Please check your internet connection.');
        setIsLoading(false);
      });

      mapRef.current = map;

      // Set loading to false after a short delay to ensure map is rendered
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      return () => {
        map.remove();
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map. Please refresh the page.');
      setIsLoading(false);
    }
  }, [center.lat, center.lng, zoom]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove existing markers
    Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
    markersRef.current = {};

    // Add new markers
    locations.forEach((location) => {
      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const markerIcon = createMarkerIcon(location);

      const marker = L.marker([lat, lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${location.user.name}</div>
            <div style="color: #666; font-size: 12px;">
              Status: ${location.isWorking ? 'Working' : 'Available'}
            </div>
            <div style="color: #666; font-size: 12px;">
              Updated: ${new Date(location.updatedAt).toLocaleTimeString()}
            </div>
          </div>
        `);

      markersRef.current[location.userId] = marker;
    });

    // Fit map to show all markers
    if (locations.length > 0) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds(), {
        padding: [20, 20],
        maxZoom: 15
      });
    }
  }, [locations]);

  return (
    <div className="w-full relative" style={{ height }}>
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg border border-gray-200" 
        style={{ height, minHeight: height }} 
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Loading map...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-75 rounded-lg">
          <div className="text-center p-4">
            <div className="text-red-600 mb-2">⚠️ Map Error</div>
            <div className="text-sm text-red-500">{error}</div>
            <button 
              onClick={() => setError(null)} 
              className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Retry Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}