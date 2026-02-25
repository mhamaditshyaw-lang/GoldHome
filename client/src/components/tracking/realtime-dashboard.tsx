import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  Activity, 
  MapPin, 
  Users, 
  Clock, 
  Wifi, 
  WifiOff, 
  Navigation, 
  Zap,
  RefreshCw,
  Eye,
  AlertCircle 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import EnhancedLiveMap from "./enhanced-live-map";

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

export default function RealtimeDashboard() {
  const { data: activeLocations, isLoading, refetch } = useQuery({
    queryKey: ["/api/locations/active"],
    refetchInterval: 5000, // Refresh every 5 seconds for optimal performance
  });

  const { isConnected, locations: wsLocations } = useWebSocket();
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Use WebSocket data if available, otherwise use API data
  const locations: LocationData[] = wsLocations.length > 0 
    ? wsLocations.map(loc => ({ ...loc, user: loc.user || { id: 0, name: 'Unknown', avatar: null } }))
    : ((activeLocations as any[]) || []).map(loc => ({ ...loc, user: loc.user || { id: 0, name: 'Unknown', avatar: null } }));

  // Filter only working team members with valid coordinates
  const activeWorkers = React.useMemo(() => {
    return locations.filter(location => {
      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);
      return location.isWorking && !isNaN(lat) && !isNaN(lng) && location.user;
    });
  }, [locations]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalTracked = locations.length;
    const activeCount = activeWorkers.length;
    const offlineCount = totalTracked - activeCount;

    // Calculate center point for map
    let centerLat = 34.6220955; // Default to Kalar
    let centerLng = 45.3088178;
    
    if (activeWorkers.length > 0) {
      centerLat = activeWorkers.reduce((sum, loc) => sum + parseFloat(loc.latitude), 0) / activeWorkers.length;
      centerLng = activeWorkers.reduce((sum, loc) => sum + parseFloat(loc.longitude), 0) / activeWorkers.length;
    }

    return {
      totalTracked,
      activeCount,
      offlineCount,
      mapCenter: { lat: centerLat, lng: centerLng }
    };
  }, [activeWorkers, locations]);

  // Update last update time when data changes
  useEffect(() => {
    if (locations.length > 0) {
      setLastUpdate(new Date());
    }
  }, [locations]);

  const StatCard = ({ icon: Icon, title, value, color, subtitle }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    color: string;
    subtitle?: string;
  }) => (
    <Card>
      <CardContent className="flex items-center p-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 ${color} rounded-lg`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Navigation className="h-6 w-6 text-blue-600" />
            <span>Live Tracking Dashboard</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time location monitoring using OpenStreetMap
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center space-x-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{isConnected ? "Live" : "Offline"}</span>
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          title="Active Workers"
          value={stats.activeCount}
          color="bg-green-100 text-green-600"
          subtitle="Currently working"
        />
        
        <StatCard
          icon={Users}
          title="Total Tracked"
          value={stats.totalTracked}
          color="bg-blue-100 text-blue-600"
          subtitle="All team members"
        />
        
        <StatCard
          icon={Clock}
          title="Offline"
          value={stats.offlineCount}
          color="bg-gray-100 text-gray-600"
          subtitle="Not working"
        />
        
        <StatCard
          icon={Zap}
          title="Connection"
          value={isConnected ? "Live" : "Cached"}
          color={isConnected ? "bg-purple-100 text-purple-600" : "bg-red-100 text-red-600"}
          subtitle={`Updated ${formatDistanceToNow(lastUpdate, { addSuffix: true })}`}
        />
      </div>

      {/* Connection Status Alert */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                WebSocket connection lost
              </p>
              <p className="text-xs text-yellow-700">
                Showing cached data. Refresh to get latest updates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Live Tracking View</span>
          </CardTitle>
          
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="h-4 w-4 inline mr-1" />
              Map View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              Grid View
            </button>
          </div>
        </CardHeader>
        
        <CardContent>
          {viewMode === 'map' ? (
            <EnhancedLiveMap
              locations={activeWorkers}
              center={stats.mapCenter}
              height="600px"
              zoom={13}
              showStatistics={false}
            />
          ) : (
            <div className="space-y-4">
              {activeWorkers.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Workers</h3>
                  <p className="text-sm text-gray-500">
                    Team members will appear here when they start working and sharing location.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeWorkers.map((location) => (
                    <Card key={location.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg">
                              {location.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold truncate">{location.user.name}</h3>
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                Working
                              </Badge>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="font-mono">
                                  {parseFloat(location.latitude).toFixed(6)}, {parseFloat(location.longitude).toFixed(6)}
                                </span>
                              </div>
                              
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {formatDistanceToNow(new Date(location.updatedAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center space-y-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600 font-medium">Live</span>
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
    </div>
  );
}