import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default markers in Leaflet
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

interface OSMMapProps {
  locations: LocationData[];
  height?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
}

export default function OSMMap({ 
  locations, 
  height = "400px", 
  zoom = 13, 
  center = { lat: 34.6220955, lng: 45.3088178 } 
}: OSMMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Create map with better OSM tiles for Middle East region
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true,
      });

      // Use multiple tile servers for better reliability
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 1,
        subdomains: ['a', 'b', 'c'],
        crossOrigin: true,
        detectRetina: true,
        updateWhenIdle: false,
        keepBuffer: 2,
        updateWhenZooming: false,
        updateInterval: 200,
      });

      tileLayer.addTo(map);

      // Add tile loading event listeners
      tileLayer.on('loading', () => {
        console.log('Tiles loading...');
      });

      tileLayer.on('load', () => {
        console.log('Tiles loaded successfully');
        setIsLoading(false);
      });

      tileLayer.on('tileerror', (e) => {
        console.error('Tile loading error:', e);
      });

      mapRef.current = map;
      setError(null);

      // Set a timeout to ensure loading completes
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      // Add map event listeners
      map.on('load', () => {
        console.log('OSM Map loaded successfully');
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
        setError('Map loading error occurred');
      });

    } catch (err) {
      console.error('Error initializing OSM map:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }

    return () => {
      // Cleanup
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      Object.values(markersRef.current).forEach((marker) => {
        marker.remove();
      });
      markersRef.current = {};
    };
  }, [center.lat, center.lng, zoom]);

  // Create custom marker icon
  const createMarkerIcon = (location: LocationData) => {
    const initials = location.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const color = location.isWorking ? '#10b981' : '#6b7280';
    const textColor = '#ffffff';

    // Create SVG icon with user initials
    const svgIcon = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" stroke="#ffffff" stroke-width="3"/>
        <text x="20" y="26" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
          ${initials}
        </text>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });
    markersRef.current = {};

    // Add new markers
    locations.forEach((location) => {
      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coordinates for location ${location.id}:`, location.latitude, location.longitude);
        return;
      }

      // Create marker with custom icon
      const marker = L.marker([lat, lng], {
        icon: createMarkerIcon(location)
      }).addTo(mapRef.current!);

      // Create popup content
      const popupContent = `
        <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${location.isWorking ? '#10b981' : '#6b7280'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 12px;">
              ${location.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">
                ${location.user.name}
              </h3>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: ${location.isWorking ? '#059669' : '#6b7280'}; font-weight: 500;">
                ${location.isWorking ? '🟢 Currently Working' : '⚫ Offline'}
              </p>
            </div>
          </div>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 8px;">
            <p style="margin: 0; font-size: 11px; color: #6b7280;">
              <strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280;">
              <strong>Last Update:</strong> ${new Date(location.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      // Add click event to open popup
      marker.on('click', () => {
        marker.openPopup();
      });

      markersRef.current[location.id] = marker;
    });

    // Adjust map view to show all markers
    if (locations.length > 0) {
      const validLocations = locations.filter(loc => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        return !isNaN(lat) && !isNaN(lng);
      });

      if (validLocations.length === 1) {
        const loc = validLocations[0];
        mapRef.current.setView([parseFloat(loc.latitude), parseFloat(loc.longitude)], zoom);
      } else if (validLocations.length > 1) {
        const group = new L.FeatureGroup(Object.values(markersRef.current));
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [locations, zoom]);

  if (error) {
    return (
      <div 
        style={{ height }}
        className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border"
      >
        <div className="text-center p-8">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-blue-200 rounded-full flex items-center justify-center">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Kalar Location Center</h3>
          <p className="text-sm text-gray-600 mb-4">
            Current location: Kalar, Kurdistan, Iraq<br/>
            Coordinates: 34.6220955, 45.3088178
          </p>
          <div className="space-y-2">
            {locations.map((location) => (
              <div key={location.id} className="flex items-center justify-between bg-white rounded p-3 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${location.isWorking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="font-medium">{location.user.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {location.isWorking ? 'Working' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setError(null)} 
            className="mt-4 px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
          >
            Retry Map
          </button>
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
            <p className="text-sm text-gray-600">Loading OpenStreetMap...</p>
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        style={{ height }}
        className="rounded-lg border shadow-sm"
      />

    </div>
  );
}