import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, MapPin, Clock, DollarSign, Camera, FileText } from "lucide-react";
import { authManager } from "@/lib/auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { useCurrency } from "@/hooks/use-currency";

interface MobileSimulatorProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function MobileSimulator({ isVisible, onClose }: MobileSimulatorProps) {
  const [currentLocation, setCurrentLocation] = useState({
    latitude: "40.7589",
    longitude: "-73.9851",
  });
  const [isWorking, setIsWorking] = useState(false);
  const [currentJob, setCurrentJob] = useState<string | null>(null);
  
  const user = authManager.getState().user;
  const { sendLocationUpdate } = useWebSocket();
  const { toast } = useToast();
  const notifications = useNotifications();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();

  // Simulate location updates while working
  useEffect(() => {
    if (!isWorking) return;
    
    const interval = setInterval(() => {
      const baseLatitude = 40.7589;
      const baseLongitude = -73.9851;
      const newLat = (baseLatitude + (Math.random() - 0.5) * 0.01).toString();
      const newLng = (baseLongitude + (Math.random() - 0.5) * 0.01).toString();
      
      setCurrentLocation({
        latitude: newLat,
        longitude: newLng,
      });
      
      if (user) {
        sendLocationUpdate({
          userId: user.id,
          latitude: newLat,
          longitude: newLng,
          isWorking: true,
        });
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isWorking, user, sendLocationUpdate]);

  const createJobMutation = useMutation({
    mutationFn: async (jobData: { customerName: string; serviceType: string; amount: string }) => {
      const response = await apiRequest("POST", "/api/invoices", {
        ...jobData,
        cleanerId: user?.id || 1,
        status: "completed",
        notes: "Completed via mobile app",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      // Simulate job completion notification
      console.log(`Job completed by ${user?.name} worth ${formatCurrency(85)}`);
      
      toast({
        title: "Job Completed",
        description: "Invoice created successfully!",
      });
      setCurrentJob(null);
      setIsWorking(false);
    },
  });

  const startWork = () => {
    setIsWorking(true);
    setCurrentJob("Kitchen Deep Clean at 123 Main St");
    if (user) {
      sendLocationUpdate({
        userId: user.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        isWorking: true,
      });
    }
  };

  const completeJob = () => {
    createJobMutation.mutate({
      customerName: "Mobile Demo Customer",
      serviceType: "Kitchen Deep Clean",
      amount: "85.00",
    });
  };

  const stopWork = () => {
    setIsWorking(false);
    setCurrentJob(null);
    if (user) {
      sendLocationUpdate({
        userId: user.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        isWorking: false,
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-80 max-h-[90vh] overflow-auto">
        <CardHeader className="bg-gradient-to-r from-gold-500 to-gold-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <CardTitle className="text-lg">Gold Home Mobile</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              ✕
            </Button>
          </div>
          <p className="text-sm opacity-90">Cleaner Mobile App Simulator</p>
        </CardHeader>
        
        <CardContent className="p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=D4AF37&color=fff`}
              alt={user?.name}
            />
            <div>
              <p className="font-medium text-sm">{user?.name || "Demo User"}</p>
              <Badge variant={isWorking ? "default" : "secondary"} className="text-xs">
                {isWorking ? "Working" : "Off Duty"}
              </Badge>
            </div>
          </div>

          {/* Current Location */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Current Location</span>
            </div>
            <p className="text-xs text-gray-600">
              {parseFloat(currentLocation.latitude).toFixed(4)}, {parseFloat(currentLocation.longitude).toFixed(4)}
            </p>
          </div>

          {/* Current Job */}
          {currentJob && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Current Job</span>
              </div>
              <p className="text-sm text-blue-600">{currentJob}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isWorking ? (
              <Button 
                onClick={startWork} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Start Working
              </Button>
            ) : (
              <div className="space-y-2">
                <Button 
                  onClick={completeJob}
                  disabled={createJobMutation.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Complete Job ({formatCurrency(85)})
                </Button>
                <Button 
                  onClick={stopWork}
                  variant="outline"
                  className="w-full"
                >
                  Stop Working
                </Button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Camera className="h-3 w-3 mr-1" />
                Photo
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Notes
              </Button>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p>Location updates every 3 seconds while working</p>
            <p>Tap "Complete Job" to create a demo invoice</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}