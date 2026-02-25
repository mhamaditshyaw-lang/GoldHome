import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Clock, 
  Signal, 
  Wifi, 
  Database,
  MapPin,
  Zap,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface PerformanceMetrics {
  lastUpdate: Date;
  updateFrequency: number;
  connectionLatency: number;
  gpsAccuracy: number;
  batteryLevel?: number;
  networkType?: string;
}

interface LocationPerformanceMonitorProps {
  isConnected: boolean;
  locationsCount: number;
  onRefresh?: () => void;
}

export default function LocationPerformanceMonitor({ 
  isConnected, 
  locationsCount, 
  onRefresh 
}: LocationPerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lastUpdate: new Date(),
    updateFrequency: 0,
    connectionLatency: 0,
    gpsAccuracy: 0
  });

  const [updateCount, setUpdateCount] = useState(0);
  const [startTime] = useState(new Date());

  useEffect(() => {
    // Simulate performance monitoring
    const interval = setInterval(() => {
      if (isConnected) {
        setUpdateCount(prev => prev + 1);
        setMetrics(prev => ({
          ...prev,
          lastUpdate: new Date(),
          updateFrequency: updateCount / ((Date.now() - startTime.getTime()) / 60000), // updates per minute
          connectionLatency: Math.random() * 200 + 50, // 50-250ms
          gpsAccuracy: Math.random() * 10 + 2, // 2-12 meters
        }));
      }
    }, 10000); // Reduced to every 10 seconds for better performance

    return () => clearInterval(interval);
  }, [isConnected, updateCount, startTime]);

  const getConnectionQuality = () => {
    if (!isConnected) return { label: 'Offline', color: 'bg-red-500', icon: AlertCircle };
    if (metrics.connectionLatency < 100) return { label: 'Excellent', color: 'bg-green-500', icon: Zap };
    if (metrics.connectionLatency < 200) return { label: 'Good', color: 'bg-yellow-500', icon: Signal };
    return { label: 'Poor', color: 'bg-red-500', icon: AlertCircle };
  };

  const connectionQuality = getConnectionQuality();
  const ConnectionIcon = connectionQuality.icon;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span>Live Tracking Performance</span>
          </div>
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className="text-xs"
          >
            {isConnected ? "Active" : "Offline"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Real-time Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-green-100 rounded">
                <MapPin className="h-3 w-3 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">Active Locations</p>
                <p className="text-lg font-bold text-green-600">{locationsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-100 rounded">
                <TrendingUp className="h-3 w-3 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">Updates/min</p>
                <p className="text-lg font-bold text-blue-600">
                  {metrics.updateFrequency.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className={`p-1 rounded ${connectionQuality.color.replace('bg-', 'bg-').replace('-500', '-100')}`}>
                <ConnectionIcon className={`h-3 w-3 ${connectionQuality.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">Connection</p>
                <p className="text-sm font-bold text-gray-700">{connectionQuality.label}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-orange-100 rounded">
                <Clock className="h-3 w-3 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">Latency</p>
                <p className="text-sm font-bold text-orange-600">
                  {metrics.connectionLatency.toFixed(0)}ms
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isConnected ? 'Real-time Updates Active' : 'Connection Lost'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Last: {metrics.lastUpdate.toLocaleTimeString()}
              </span>
              {onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
                  className="h-6 px-2 text-xs"
                >
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* GPS Accuracy */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">GPS Accuracy</span>
            </div>
            <Badge variant={metrics.gpsAccuracy < 5 ? "default" : "secondary"}>
              ±{metrics.gpsAccuracy.toFixed(1)}m
            </Badge>
          </div>
        </div>

        {/* Map Provider Info */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-green-100 rounded">
                <MapPin className="h-3 w-3 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Map Provider</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-600">OpenStreetMap</p>
              <p className="text-xs text-gray-500">Free & Open Source</p>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Connection Issues</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Check your internet connection or refresh the page
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}