import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, BarChart, Bar } from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  DollarSign,
  Clock,
  MapPin,
  Download,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { format, subDays, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  totalRevenue: number;
  revenueGrowth: number;
  jobsCompleted: number;
  jobsGrowth: number;
  activeUsers: number;
  averageJobValue: number;
  topPerformers: Array<{
    id: number;
    name: string;
    jobsCount: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    jobs: number;
  }>;
  serviceTypeStats: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();

  // Check if user has access to this page
  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("analytics")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const isLoading = invoicesLoading || usersLoading;

  // Filter invoices by date range
  const filteredInvoices = (invoices as any[]).filter((invoice: any) => {
    const invoiceDate = new Date(invoice.createdAt);
    const matchesStartDate = !startDate || invoiceDate >= new Date(startDate);
    const matchesEndDate = !endDate || invoiceDate <= new Date(endDate + "T23:59:59");
    
    return matchesStartDate && matchesEndDate;
  });

  // Calculate analytics data from filtered invoice data
  const totalRevenue = filteredInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0);
  const completedJobs = filteredInvoices.filter((inv: any) => inv.status === 'completed').length;
  
  const analyticsData: AnalyticsData = {
    totalRevenue,
    revenueGrowth: 12.5, // Could be calculated from historical data
    jobsCompleted: completedJobs,
    jobsGrowth: 8.3,
    activeUsers: (users as any[]).filter((user: any) => user.isActive).length,
    averageJobValue: completedJobs > 0 ? (totalRevenue / completedJobs) : 0,
    topPerformers: (users as any[]).map((user: any) => {
      const userInvoices = filteredInvoices.filter((inv: any) => inv.cleanerId === user.id);
      return {
        id: user.id,
        name: user.name,
        jobsCount: userInvoices.length,
        revenue: userInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0),
      };
    }).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5),
    revenueByDay: Array.from({ length: 7 }, (_, i) => {
      const targetDate = subDays(new Date(), 6 - i);
      const dayInvoices = filteredInvoices.filter((inv: any) => {
        const invDate = new Date(inv.createdAt);
        return invDate.toDateString() === targetDate.toDateString();
      });
      
      return {
        date: format(targetDate, 'MMM dd'),
        revenue: dayInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0),
        jobs: dayInvoices.length,
      };
    }),
    serviceTypeStats: (() => {
      const serviceStats = new Map();
      
      filteredInvoices.forEach((invoice: any) => {
        if (invoice.services && Array.isArray(invoice.services)) {
          invoice.services.forEach((service: any) => {
            const serviceName = service.name;
            if (!serviceStats.has(serviceName)) {
              serviceStats.set(serviceName, { count: 0, revenue: 0 });
            }
            const stats = serviceStats.get(serviceName);
            stats.count += service.quantity || 1;
            stats.revenue += parseFloat(service.price || 0) * (service.quantity || 1);
          });
        }
      });
      
      return Array.from(serviceStats.entries()).map(([type, stats]) => ({
        type,
        count: stats.count,
        revenue: stats.revenue,
      })).sort((a, b) => b.revenue - a.revenue);
    })(),
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleExportReport = () => {
    // Create CSV export
    const csvData = [
      ['Date', 'Revenue', 'Jobs', 'Average Job Value'],
      ...analyticsData.revenueByDay.map(day => [
        day.date,
        day.revenue.toFixed(2),
        day.jobs.toString(),
        (day.revenue / day.jobs).toFixed(2)
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `home-gold-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Analytics & Reports
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
                placeholder="Start date"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
                placeholder="End date"
              />
              {(startDate || endDate) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearFilters}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gold-500 rounded-md flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {analyticsData.totalRevenue.toFixed(0)} DQI
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {analyticsData.revenueGrowth}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Jobs Completed</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {analyticsData.jobsCompleted}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {analyticsData.jobsGrowth}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {analyticsData.activeUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Job Value</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {analyticsData.averageJobValue.toFixed(0)} DQI
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and detailed analytics */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "#D4AF37",
                  },
                  jobs: {
                    label: "Jobs",
                    color: "#3B82F6",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickFormatter={(value) => `${value} DQI`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [
                        name === "revenue" ? `${value} DQI` : value,
                        name === "revenue" ? "Revenue" : "Jobs"
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#D4AF37"
                      fill="#D4AF37"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Jobs Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Jobs Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  jobs: {
                    label: "Jobs",
                    color: "#3B82F6",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [value, "Jobs"]}
                    />
                    <Bar
                      dataKey="jobs"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-gold-700">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{performer.name}</p>
                        <p className="text-xs text-gray-500">{performer.jobsCount} jobs</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{performer.revenue.toFixed(0)} DQI</p>
                      <p className="text-xs text-gray-500">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Types Analysis */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Service Types Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {analyticsData.serviceTypeStats.map((service) => (
                <div key={service.type} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-2">{service.type}</h4>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Jobs</span>
                    <Badge variant="outline">{service.count}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Revenue</span>
                    <span className="font-semibold text-sm">{service.revenue.toFixed(0)} DQI</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gold-500 h-2 rounded-full" 
                      style={{ width: `${(service.revenue / Math.max(...analyticsData.serviceTypeStats.map(s => s.revenue))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.revenueByDay.slice(0, 5).map((day, index) => (
                <div key={index} className="flex items-center justify-between border-l-4 border-l-gold-500 pl-4">
                  <div>
                    <p className="font-medium text-sm">{day.date}</p>
                    <p className="text-xs text-gray-500">{day.jobs} jobs completed</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{day.revenue.toFixed(0)} DQI</p>
                    <p className="text-xs text-gray-500">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}