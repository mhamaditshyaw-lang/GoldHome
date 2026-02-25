import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface LocationUpdate {
  userId: number;
  latitude: string;
  longitude: string;
  isWorking: boolean;
}

interface LocationData {
  id: number;
  userId: number;
  latitude: string;
  longitude: string;
  isWorking: boolean;
  updatedAt: string;
  user: { id: number; name: string; avatar: string | null } | null;
}

interface DataChangeMessage {
  type: 'data_change';
  dataType: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Validate host is properly defined
    if (!window.location.host || window.location.host.includes('undefined')) {
      console.warn('Invalid host for WebSocket connection:', window.location.host);
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log('Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to:', wsUrl);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'locations_update') {
            setLocations(message.data);
          } else if (message.type === 'data_change') {
            const dataChange = message as DataChangeMessage;
            console.log(`Received ${dataChange.action} for ${dataChange.dataType}:`, dataChange.data);

            const dataType = dataChange.dataType;

            if (dataType === 'users') {
              console.log('Invalidating users and team queries...');
              queryClient.invalidateQueries({
                queryKey: ['/api/users'],
                exact: false
              });
              queryClient.invalidateQueries({
                queryKey: ['/api/team'],
                exact: false
              });
            } else if (dataType === 'services') {
              queryClient.invalidateQueries({
                queryKey: ['/api/services']
              });
              queryClient.invalidateQueries({
                queryKey: ['/api/services/all']
              });
              queryClient.invalidateQueries({
                queryKey: ['/api/services/public']
              });
            } else if (dataType === 'settings') {
              queryClient.invalidateQueries({
                queryKey: ['/api/settings']
              });
            } else if (dataType === 'invoices') {
              queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
              queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
            } else if (dataType === 'bookings') {
              queryClient.invalidateQueries({ queryKey: ['/api/customer/bookings'] });
              queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
            } else if (dataType === 'customers') {
              queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
            } else if (dataType === 'debts') {
              queryClient.invalidateQueries({ queryKey: ['/api/debts'] });
            } else if (dataType === 'debt_payments') {
              queryClient.invalidateQueries({ queryKey: ['/api/payment-history'] });
              queryClient.invalidateQueries({ queryKey: ['/api/debts'] });
            } else {
              console.log('Unknown data type:', dataType);
            }
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket URL was:', wsUrl);
        setIsConnected(false);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      return;
    }
  }, [queryClient]);

  const sendLocationUpdate = (locationUpdate: LocationUpdate) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'location_update',
        ...locationUpdate
      }));
    }
  };

  return {
    isConnected,
    locations,
    sendLocationUpdate
  };
}