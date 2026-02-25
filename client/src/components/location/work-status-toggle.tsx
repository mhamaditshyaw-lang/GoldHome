import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, AlertCircle } from 'lucide-react';
import { locationTracker } from '@/services/location-tracker';
import { authManager } from '@/lib/auth';

export default function WorkStatusToggle() {
  const [isWorking, setIsWorking] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const user = authManager.getState().user;

  useEffect(() => {
    // Check location permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        
        result.onchange = () => {
          setLocationPermission(result.state);
        };
      });
    }

    // Check if tracking is active
    const checkTrackingStatus = () => {
      setIsTracking(locationTracker.isActive());
    };

    checkTrackingStatus();
    const interval = setInterval(checkTrackingStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleWorkStatusToggle = () => {
    const newStatus = !isWorking;
    setIsWorking(newStatus);
    
    if (newStatus && !isTracking) {
      // Start tracking when user starts working
      locationTracker.startTracking();
    } else if (isTracking) {
      // Update work status
      locationTracker.setWorkingStatus(newStatus);
    }
  };

  const handleRequestPermission = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationPermission('granted');
        locationTracker.startTracking();
      },
      () => {
        setLocationPermission('denied');
      }
    );
  };

  if (!user) return null;

  return (
    <Card className="border-l-4 border-l-gold-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Work Status</span>
            </div>
            <Badge 
              variant={isWorking ? "default" : "outline"}
              className={isWorking ? "bg-green-100 text-green-800" : ""}
            >
              {isWorking ? "Working" : "Offline"}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {locationPermission === 'denied' && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Location access denied</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleRequestPermission}
                  className="text-xs"
                >
                  Enable
                </Button>
              </div>
            )}
            
            {locationPermission === 'prompt' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleRequestPermission}
                className="text-xs"
              >
                Allow Location
              </Button>
            )}
            
            {locationPermission === 'granted' && (
              <Button
                size="sm"
                variant={isWorking ? "destructive" : "default"}
                onClick={handleWorkStatusToggle}
                className="flex items-center space-x-1"
              >
                <Clock className="h-3 w-3" />
                <span>{isWorking ? "Stop Work" : "Start Work"}</span>
              </Button>
            )}
          </div>
        </div>
        
        {isTracking && (
          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live tracking active</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}