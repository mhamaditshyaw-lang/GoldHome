
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Clock, User, Search, Filter, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { authManager } from "@/lib/auth";

interface LocationHistoryData {
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
    role: string;
  } | null;
}

export default function LocationHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const user = authManager.getState().user;

  // Only show to supervisors and admin
  if (!user || (user.role !== "supervisor" && user.role !== "admin")) {
    return null;
  }

  const { data: locationHistory = [], isLoading } = useQuery({
    queryKey: ["/api/locations/history", { startDate, endDate, userId: selectedUser !== "all" ? selectedUser : undefined, search: searchTerm }],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Filter data based on search term
  const filteredHistory = (locationHistory as LocationHistoryData[] || []).filter((location: LocationHistoryData) => {
    const matchesSearch = !searchTerm || 
      location.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.latitude.includes(searchTerm) ||
      location.longitude.includes(searchTerm);
    
    return matchesSearch;
  });

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedUser("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Location History
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name or coordinates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {(users as any[] || [])
                .filter((u: any) => u.role === "cleaner" && u.isActive)
                .map((u: any) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
          
          <Button variant="outline" onClick={handleClearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading location history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Location History</h3>
            <p className="text-gray-500">
              No location data found for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Time Ago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((location: LocationHistoryData) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={location.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(location.user?.name || 'User')}&background=D4AF37&color=fff`}
                          alt={location.user?.name || "Unknown user"}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {location.user?.name || "Unknown user"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {location.user?.role || "Unknown role"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={location.isWorking ? "default" : "outline"}
                        className={location.isWorking ? "bg-green-100 text-green-800" : ""}
                      >
                        <div className={`w-2 h-2 rounded-full mr-1 ${location.isWorking ? 'bg-green-400' : 'bg-gray-400'}`} />
                        {location.isWorking ? "Working" : "Offline"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>
                          {parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {format(new Date(location.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(location.updatedAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
