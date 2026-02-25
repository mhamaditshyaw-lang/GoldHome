import { authManager } from '@/lib/auth';

interface LocationUpdate {
  userId: number;
  latitude: string;
  longitude: string;
  isWorking: boolean;
}

class LocationTracker {
  private watchId: number | null = null;
  private wsConnection: WebSocket | null = null;
  private isTracking = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    // Listen for authentication changes
    authManager.subscribe((authState) => {
      if (authState.isAuthenticated && authState.user) {
        this.startTracking();
      } else {
        // User logged out, stop tracking and mark as offline
        this.stopTracking();
      }
    });
  }

  private connectWebSocket() {
    // Validate that host is properly defined
    if (!window.location.host || window.location.host.includes('undefined')) {
      console.warn('Invalid host for WebSocket connection:', window.location.host);
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.wsConnection = new WebSocket(wsUrl);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      return;
    }

    this.wsConnection.onopen = () => {
      console.log('Location tracker WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.wsConnection.onclose = () => {
      console.log('Location tracker WebSocket disconnected');
      this.wsConnection = null;

      // Attempt to reconnect if tracking is still active
      if (this.isTracking && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          this.connectWebSocket();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };

    this.wsConnection.onerror = (error) => {
      console.error('Location tracker WebSocket error:', error);
    };
  }

  private sendLocationUpdate(update: LocationUpdate) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'location_update',
        ...update
      }));
    }
  }

  private async checkLocationPermission(): Promise<boolean> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('Location permission status:', permission.state);
        return permission.state === 'granted';
      } catch (error) {
        console.warn('Could not check location permission:', error);
      }
    }
    return false;
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      const timeoutId = setTimeout(() => {
        console.warn('Location request timed out after 20 seconds');
        reject(new Error('Location request timed out'));
      }, 20000); // Increased timeout to 20 seconds

      // Force fresh GPS coordinates with high accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          console.log('Fresh GPS location acquired:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleString()
          });
          resolve(position);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('GPS location error:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.code === 1,
            POSITION_UNAVAILABLE: error.code === 2,
            TIMEOUT: error.code === 3
          });
          reject(error);
        },
        {
          enableHighAccuracy: true, // Force GPS usage
          timeout: 15000, // 15 second timeout for GPS
          maximumAge: 0 // Always get fresh location, no cache
        }
      );
    });
  }

  async startTracking() {
    const authState = authManager.getState();
    if (!authState.isAuthenticated || !authState.user) {
      console.warn('Cannot start location tracking: user not authenticated');
      return;
    }

    if (this.isTracking) {
      console.log('Location tracking already active');
      return;
    }

    this.isTracking = true;
    console.log('Starting location tracking for user:', authState.user.name);

    // Connect to WebSocket
    this.connectWebSocket();

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    const userRole = authState.user.role;
    const isActiveRole = userRole === 'admin' || userRole === 'supervisor' || userRole === 'cleaner';

    try {
      // Check location permission first
      const hasPermission = await this.checkLocationPermission();
      if (!hasPermission) {
        console.warn('Location permission not granted, requesting permission...');
      }

      // Get user's actual GPS location
      console.log('Requesting fresh GPS coordinates...');
      const position = await this.getCurrentPosition();
      
      this.sendLocationUpdate({
        userId: authState.user.id,
        latitude: position.coords.latitude.toString(),
        longitude: position.coords.longitude.toString(),
        isWorking: isActiveRole
      });

      // Start watching for location changes
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          console.log('GPS location updated:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy + 'm',
            timestamp: new Date(position.timestamp).toLocaleString()
          });
          if (authState.user) {
            this.sendLocationUpdate({
              userId: authState.user.id,
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
              isWorking: isActiveRole
            });
          }
        },
        (error) => {
          console.error('Location watch error:', error.message);
          // Fallback to Kalar coordinates on error
          if (authState.user) {
            this.sendLocationUpdate({
              userId: authState.user.id,
              latitude: '34.6220955',
              longitude: '45.3088178',
              isWorking: isActiveRole
            });
          }
        },
        {
          enableHighAccuracy: true, // Force GPS usage
          timeout: 15000, // 15 second timeout
          maximumAge: 0 // Always get fresh location
        }
      );
    } catch (error) {
      console.error('Failed to get initial location:', error instanceof Error ? error.message : 'Unknown error');
      // Fallback to Kalar coordinates if GPS fails
      if (authState.user) {
        this.sendLocationUpdate({
          userId: authState.user.id,
          latitude: '34.6220955',
          longitude: '45.3088178',
          isWorking: isActiveRole
        });
      }
    }
  }

  stopTracking() {
    if (!this.isTracking) return;

    console.log('Stopping location tracking');
    this.isTracking = false;

    // Stop watching position
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // Send final location update with isWorking = false
    const user = authManager.getState().user;
    if (user) {
      // Try to send offline status via WebSocket first
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.sendLocationUpdate({
              userId: user.id,
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
              isWorking: false
            });
          },
          () => {
            // If we can't get position, just send the offline status
            this.sendLocationUpdate({
              userId: user.id,
              latitude: '0',
              longitude: '0',
              isWorking: false
            });
          },
          { timeout: 5000 }
        );
      } else {
        // Fallback: send offline status via REST API
        fetch('/api/locations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            latitude: '0',
            longitude: '0',
            isWorking: false
          }),
          credentials: 'include'
        }).catch(error => {
          console.error('Failed to send offline status:', error);
        });
      }
    }

    // Close WebSocket connection
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  isActive(): boolean {
    return this.isTracking;
  }

  // Method to update work status without stopping tracking
  setWorkingStatus(isWorking: boolean) {
    const user = authManager.getState().user;
    if (!user || !this.isTracking) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.sendLocationUpdate({
          userId: user.id,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          isWorking
        });
      },
      (error) => {
        console.error('Error getting position for status update:', error);
        // Fallback to Kalar coordinates on GPS error
        this.sendLocationUpdate({
          userId: user.id,
          latitude: '34.6220955',
          longitude: '45.3088178',
          isWorking
        });
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
      }
    );

    // If user stops working, stop tracking after a delay
    if (!isWorking) {
      setTimeout(() => {
        this.stopTracking();
      }, 5000); // Stop tracking 5 seconds after user stops working
    }
  }
}

// Create singleton instance
export const locationTracker = new LocationTracker();

// Initialize tracking when the module loads
const initializeTracking = () => {
  const authState = authManager.getState();
  if (authState.isAuthenticated && authState.user) {
    locationTracker.startTracking();
  }
};

// Initialize after a short delay to ensure auth state is ready
setTimeout(initializeTracking, 1000);