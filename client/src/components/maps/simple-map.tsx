import React from 'react';
import { MapPin, Navigation, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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

interface SimpleMapProps {
  locations: LocationData[];
  height?: string;
}

export default function SimpleMap({ locations, height = "400px" }: SimpleMapProps) {
  const openInGoogleMaps = (lat: string, lng: string, name: string) => {
    const url = `https://maps.google.com/maps?q=${lat},${lng}&t=m&z=15&hl=en`;
    window.open(url, '_blank');
  };

  const openDirections = (lat: string, lng: string) => {
    const url = `https://maps.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full" style={{ height }}>
      <div className="h-full overflow-y-auto space-y-3">
        {locations.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-center p-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Locations</h3>
              <p className="text-gray-500">
                No team members are currently sharing their location.
              </p>
            </div>
          </div>
        ) : (
          locations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {location.user.avatar ? (
                        <img
                          src={location.user.avatar}
                          alt={location.user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                          location.isWorking ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {location.user.name}
                        </h4>
                        <Badge 
                          variant={location.isWorking ? "default" : "secondary"}
                          className={`text-xs ${
                            location.isWorking 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {location.isWorking ? 'Working' : 'Available'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(location.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <button
                      onClick={() => openInGoogleMaps(location.latitude, location.longitude, location.user.name)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="View on Google Maps"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDirections(location.latitude, location.longitude)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="Get Directions"
                    >
                      <Navigation className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}