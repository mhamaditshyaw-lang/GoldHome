import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";
import { 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import { format } from "date-fns";

interface CustomerBooking {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  location: string | null;
  services: { id: number; name: string; price: string; quantity: number }[];
  totalAmount: string;
  notes: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  status: string;
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
}

export default function Bookings() {
  const [selectedBooking, setSelectedBooking] = useState<CustomerBooking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();
  const { isConnected } = useWebSocket();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("bookings")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  const { data: bookings, isLoading } = useQuery<CustomerBooking[]>({
    queryKey: ["/api/customer/bookings"],
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: false, // Let WebSocket handle updates
    refetchIntervalInBackground: false,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CustomerBooking> }) => {
      const response = await fetch(`/api/customer/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update booking: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/bookings"] });
      toast({
        title: t('bookings.bookingUpdated'),
        description: t('bookings.bookingUpdatedMessage'),
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('bookings.updateFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/customer/bookings/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete booking: ${response.statusText}`);
      }

      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/bookings"] });
      toast({
        title: t('bookings.bookingDeletedSuccess'),
        description: t('bookings.bookingDeletedMessage'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('bookings.deleteFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredBookings = bookings?.filter(booking => 
    statusFilter === "all" || booking.status === statusFilter
  ) || [];

  const handleStatusUpdate = (bookingId: number, newStatus: string) => {
    updateBookingMutation.mutate({
      id: bookingId,
      updates: { status: newStatus }
    });
  };

  const handleAssignUpdate = (bookingId: number, assignedTo: number | null) => {
    updateBookingMutation.mutate({
      id: bookingId,
      updates: { assignedTo }
    });
  };

  const handleDeleteBooking = (bookingId: number) => {
    if (confirm(t('bookings.confirmDeleteBooking'))) {
      deleteBookingMutation.mutate(bookingId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('bookings.customerBookings')}</h1>
          <p className="text-gray-600">{t('bookings.manageBookings')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('bookings.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('bookings.allBookings')}</SelectItem>
              <SelectItem value="pending">{t('bookings.pending')}</SelectItem>
              <SelectItem value="confirmed">{t('bookings.confirmed')}</SelectItem>
              <SelectItem value="assigned">{t('bookings.assigned')}</SelectItem>
              <SelectItem value="completed">{t('bookings.completed')}</SelectItem>
              <SelectItem value="cancelled">{t('bookings.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mb-4">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('bookings.noBookingsFound')}</h3>
            <p className="text-gray-600">{t('bookings.noMatchingBookings')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{booking.customerName}</CardTitle>
                    <p className="text-sm text-gray-600">#{booking.id}</p>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {getStatusIcon(booking.status)}
                    <span className="ml-1 capitalize">{t(`bookings.${booking.status}`)}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {booking.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {booking.address}
                  </div>
                  {booking.preferredDate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(booking.preferredDate), 'PPP')}
                      {booking.preferredTime && ` ${t('bookings.at')} ${booking.preferredTime}`}
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 mb-1">{t('bookings.services')}</p>
                    <div className="space-y-1">
                      {booking.services.map((service, index) => (
                        <div key={index} className="text-sm flex justify-between">
                          <span>{service.name} (x{service.quantity})</span>
                          <span className="font-medium">
                            {formatCurrency(parseFloat(service.price) * service.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t font-semibold">
                      <span>{t('bookings.total')}</span>
                      <span className="text-gold-600">
                        {formatCurrency(parseFloat(booking.totalAmount))}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-3">
                    <Dialog open={isDialogOpen && selectedBooking?.id === booking.id} onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) setSelectedBooking(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsDialogOpen(true);
                          }}
                          data-testid={`button-edit-booking-${booking.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl" aria-describedby="booking-edit-description">
                        <DialogHeader>
                          <DialogTitle>{t('bookings.editBookingNumber')}{booking.id}</DialogTitle>
                        </DialogHeader>
                        <p id="booking-edit-description" className="sr-only">
                          Edit booking status and assignment for customer {booking.customerName}
                        </p>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="status">{t('common.status')}</Label>
                              <Select
                                value={booking.status}
                                onValueChange={(value) => handleStatusUpdate(booking.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">{t('bookings.pending')}</SelectItem>
                                  <SelectItem value="confirmed">{t('bookings.confirmed')}</SelectItem>
                                  <SelectItem value="assigned">{t('bookings.assigned')}</SelectItem>
                                  <SelectItem value="completed">{t('bookings.completed')}</SelectItem>
                                  <SelectItem value="cancelled">{t('bookings.cancelled')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="assignedTo">{t('bookings.assignTo')}</Label>
                              <Select
                                value={booking.assignedTo?.toString() || "unassigned"}
                                onValueChange={(value) => handleAssignUpdate(booking.id, value === "unassigned" ? null : parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('bookings.selectTeamMember')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">{t('bookings.unassigned')}</SelectItem>
                                  {users?.filter(user => user.role === "cleaner").map(user => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      {user.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label>{t('bookings.customerDetails')}</Label>
                            <div className="bg-gray-50 p-4 rounded-lg mt-1">
                              <p><strong>{t('bookings.name')}</strong> {booking.customerName}</p>
                              <p><strong>{t('bookings.phone')}</strong> {booking.phone}</p>
                              <p><strong>{t('bookings.address')}</strong> {booking.address}</p>
                              {booking.location && <p><strong>{t('bookings.area')}</strong> {booking.location}</p>}
                              {booking.notes && <p><strong>{t('bookings.notes')}</strong> {booking.notes}</p>}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-booking-${booking.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}