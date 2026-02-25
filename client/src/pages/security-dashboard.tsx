
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Ban, 
  Eye, 
  Trash2,
  Clock,
  Globe,
  User,
  RefreshCw
} from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface SecurityEvent {
  type: string;
  userId?: number;
  ip: string;
  userAgent: string;
  timestamp: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityReport {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  blockedIPs: string[];
  failedLoginAttempts: number;
  events: SecurityEvent[];
}

export default function SecurityDashboard() {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ipToUnblock, setIpToUnblock] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("security-dashboard")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  const fetchSecurityReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/security/report', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch security report');
      }

      const data = await response.json();
      setReport(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const unblockIP = async (ip: string) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/security/unblock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ip })
      });

      if (!response.ok) {
        throw new Error('Failed to unblock IP');
      }

      await fetchSecurityReport();
      setIpToUnblock('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock IP');
    } finally {
      setActionLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/security/clear-logs', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to clear logs');
      }

      await fetchSecurityReport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear logs');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityReport();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSecurityReport, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const color = getSeverityColor(severity);
    return (
      <Badge className={`${color} text-white`}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  if (loading && !report) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading security report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchSecurityReport} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={clearLogs} disabled={actionLoading} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Logs
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {report && (
        <>
          {/* Security Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events (24h)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalEvents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{report.criticalEvents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
                <Ban className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{report.failedLoginAttempts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
                <Shield className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.blockedIPs.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="events" className="space-y-6">
            <TabsList>
              <TabsTrigger value="events">Security Events</TabsTrigger>
              <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
              <TabsTrigger value="actions">Security Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>Recent Security Events</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.events.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No security events in the last 24 hours</p>
                    ) : (
                      report.events.map((event, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getSeverityBadge(event.severity)}
                              <span className="font-medium">{event.type.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(event.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <span>IP: {event.ip}</span>
                            </div>
                            {event.userId && (
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>User ID: {event.userId}</span>
                              </div>
                            )}
                          </div>

                          {event.details && (
                            <div className="bg-gray-50 rounded p-3 text-sm">
                              <strong>Details:</strong> {JSON.stringify(event.details, null, 2)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blocked">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Ban className="h-5 w-5" />
                    <span>Blocked IP Addresses</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.blockedIPs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No blocked IP addresses</p>
                    ) : (
                      report.blockedIPs.map((ip, index) => (
                        <div key={index} className="flex items-center justify-between border rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-red-500" />
                            <span className="font-mono">{ip}</span>
                          </div>
                          <Button 
                            onClick={() => unblockIP(ip)} 
                            disabled={actionLoading}
                            variant="outline"
                            size="sm"
                          >
                            Unblock
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions">
              <Card>
                <CardHeader>
                  <CardTitle>Security Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Unblock IP Address</h3>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter IP address to unblock"
                          value={ipToUnblock}
                          onChange={(e) => setIpToUnblock(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => unblockIP(ipToUnblock)} 
                          disabled={!ipToUnblock || actionLoading}
                        >
                          Unblock
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
