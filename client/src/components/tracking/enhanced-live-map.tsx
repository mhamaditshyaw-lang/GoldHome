import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Activity, Clock, Navigation, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface EnhancedLiveMapProps {
  locations: LocationData[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  showStatistics?: boolean;
}

export default function EnhancedLiveMap({ 
  locations = [], 
  center = { lat: 34.6220955, lng: 45.3088178 }, 
  zoom = 13, 
  height = "500px",
  showStatistics = true 
}: EnhancedLiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);
  const [followUser, setFollowUser] = useState<number | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    const activeWorkers = locations.filter(loc => loc.isWorking).length;
    const totalWorkers = locations.length;
    const offlineWorkers = totalWorkers - activeWorkers;
    
    // Calculate center point
    let centerLat = center.lat;
    let centerLng = center.lng;
    
    if (locations.length > 0) {
      const validLocations = locations.filter(loc => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        return !isNaN(lat) && !isNaN(lng);
      });
      
      if (validLocations.length > 0) {
        centerLat = validLocations.reduce((sum, loc) => sum + parseFloat(loc.latitude), 0) / validLocations.length;
        centerLng = validLocations.reduce((sum, loc) => sum + parseFloat(loc.longitude), 0) / validLocations.length;
      }
    }

    return {
      activeWorkers,
      totalWorkers,
      offlineWorkers,
      centerLat,
      centerLng
    };
  }, [locations, center]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create map with better options for live tracking
      const map = L.map(mapContainerRef.current, {
        center: [stats.centerLat, stats.centerLng],
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true,
        attributionControl: true,
        preferCanvas: true, // Better performance for many markers
      });

      // Add OpenStreetMap tiles with better options for real-time tracking
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 1,
        subdomains: ['a', 'b', 'c'],
        crossOrigin: true,
        detectRetina: true,
        updateWhenIdle: false,
        keepBuffer: 2,
        updateWhenZooming: false,
        updateInterval: 100, // Faster updates for live tracking
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

      // Set loading to false after map is ready
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      return () => {
        map.remove();
      };
    } catch (err) {
      console.error('Error initializing enhanced map:', err);
      setError('Failed to initialize map. Please refresh the page.');
      setIsLoading(false);
    }
  }, [stats.centerLat, stats.centerLng, zoom]);

  // Create enhanced marker with pulsing animation for active workers
  const createEnhancedMarker = (location: LocationData) => {
    const initials = location.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const isActive = location.isWorking;
    const color = isActive ? '#10b981' : '#6b7280';
    const pulseColor = isActive ? '#34d399' : 'transparent';

    // Enhanced SVG with pulsing animation for active workers
    const svgIcon = `
      <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        ${isActive ? `
          <circle cx="25" cy="25" r="20" fill="${pulseColor}" opacity="0.6">
            <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
        <circle cx="25" cy="25" r="18" fill="${color}" stroke="#ffffff" stroke-width="3" filter="url(#glow)"/>
        <text x="25" y="31" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
          ${initials}
        </text>
        ${isActive ? `
          <circle cx="35" cy="15" r="4" fill="#10b981">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: 'enhanced-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
      popupAnchor: [0, -25]
    });
  };

  // Update markers with enhanced features
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new enhanced markers
    locations.forEach((location) => {
      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coordinates for location ${location.id}:`, location.latitude, location.longitude);
        return;
      }

      // Create marker with enhanced icon
      const marker = L.marker([lat, lng], {
        icon: createEnhancedMarker(location),
        riseOnHover: true
      }).addTo(mapRef.current!);

      // Enhanced popup content
      const lastUpdate = new Date(location.updatedAt);
      const timeAgo = formatDistanceToNow(lastUpdate, { addSuffix: true });
      
      const popupContent = `
        <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif; min-width: 240px; max-width: 300px;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${location.isWorking ? '#10b981' : '#6b7280'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              ${location.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                ${location.user.name}
              </h3>
              <div style="display: flex; align-items: center; margin-top: 4px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${location.isWorking ? '#10b981' : '#6b7280'}; margin-right: 6px;"></div>
                <span style="font-size: 12px; color: ${location.isWorking ? '#059669' : '#6b7280'}; font-weight: 500;">
                  ${location.isWorking ? 'Currently Working' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; space-y: 8px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <svg width="16" height="16" style="margin-right: 8px; color: #6b7280;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              <span style="font-size: 12px; color: #374151;">
                <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
              </span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <svg width="16" height="16" style="margin-right: 8px; color: #6b7280;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
              <span style="font-size: 12px; color: #374151;">
                <strong>Last Update:</strong> ${timeAgo}
              </span>
            </div>
            
            <div style="display: flex; align-items: center;">
              <svg width="16" height="16" style="margin-right: 8px; color: #6b7280;" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              <span style="font-size: 12px; color: #374151;">
                <strong>Status:</strong> ${location.isWorking ? '🔥 Active' : '😴 Offline'}
              </span>
            </div>
          </div>
          
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
            <button onclick="window.parent.postMessage({type: 'followUser', userId: ${location.userId}}, '*')" 
                    style="width: 100%; padding: 8px; background: ${location.isWorking ? '#10b981' : '#6b7280'}; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;">
              📍 Follow This Worker
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: 'enhanced-popup'
      });

      // Add click event for enhanced interaction
      marker.on('click', () => {
        marker.openPopup();
        
        // Center map on clicked marker if auto-center is enabled
        if (autoCenter) {
          mapRef.current?.setView([lat, lng], Math.max(zoom, 15), {
            animate: true,
            duration: 1
          });
        }
      });

      markersRef.current[location.id] = marker;
    });

    // Auto-fit bounds for all markers if auto-center is enabled
    if (locations.length > 0 && autoCenter && !followUser) {
      const validLocations = locations.filter(loc => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        return !isNaN(lat) && !isNaN(lng);
      });

      if (validLocations.length === 1) {
        const loc = validLocations[0];
        mapRef.current?.setView([parseFloat(loc.latitude), parseFloat(loc.longitude)], zoom, {
          animate: true,
          duration: 1
        });
      } else if (validLocations.length > 1) {
        const group = new L.FeatureGroup(Object.values(markersRef.current));
        mapRef.current?.fitBounds(group.getBounds().pad(0.1), {
          animate: true,
          duration: 1
        });
      }
    }

    // Follow specific user if enabled
    if (followUser && locations.length > 0) {
      const userLocation = locations.find(loc => loc.userId === followUser);
      if (userLocation) {
        const lat = parseFloat(userLocation.latitude);
        const lng = parseFloat(userLocation.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          mapRef.current?.setView([lat, lng], Math.max(zoom, 16), {
            animate: true,
            duration: 1
          });
        }
      }
    }
  }, [locations, zoom, autoCenter, followUser]);

  // Listen for follow user messages from popups
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'followUser') {
        setFollowUser(event.data.userId);
        setAutoCenter(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Map Error</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => setError(null)} variant="outline">
              Retry Map
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Workers</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeWorkers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Workers</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalWorkers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Offline</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.offlineWorkers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Live Updates</p>
                  <p className="text-sm font-bold text-purple-600">Real-time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Navigation className="h-5 w-5" />
            <span>Live Location Tracking</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={autoCenter ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setAutoCenter(!autoCenter);
                setFollowUser(null);
              }}
            >
              Auto Center
            </Button>
            
            {followUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFollowUser(null);
                  setAutoCenter(true);
                }}
              >
                Stop Following
              </Button>
            )}
            
            <Badge variant={isLoading ? "secondary" : "default"}>
              {isLoading ? "Loading..." : "Live"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div 
            ref={mapContainerRef}
            style={{ height }}
            className="w-full rounded-lg border bg-gray-50 relative overflow-hidden"
          >
            {isLoading && (
              <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}