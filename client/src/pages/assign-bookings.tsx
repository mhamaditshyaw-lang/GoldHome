import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { queryClient } from "@/lib/queryClient";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  UserCheck,
  AlertCircle,
  Users,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Plus,
  Minus
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
  isActive: boolean;
}

interface Service {
  id: number;
  name: string;
  price: string;
  description: string | null;
  isActive: boolean;
}

export default function AssignBookings() {
  const [selectedBooking, setSelectedBooking] = useState<CustomerBooking | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<CustomerBooking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [newService, setNewService] = useState({ serviceId: "", quantity: 1 });
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("assign-bookings")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  // Fetch current user session to check role
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/session"],
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  // Fetch all bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<CustomerBooking[]>({
    queryKey: ["/api/customer/bookings"],
    refetchInterval: 1000, // Auto-refresh every 1 second
    refetchIntervalInBackground: true,
  });

  // Fetch active cleaners
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchInterval: 1000, // Auto-refresh every 1 second
    refetchIntervalInBackground: true,
  });

  // Fetch available services
  const { data: availableServices } = useQuery<Service[]>({
    queryKey: ["/api/services/all"],
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  const cleaners = users?.filter(user => user.role === "cleaner" && user.isActive) || [];

  // Mutation to assign booking
  const assignBookingMutation = useMutation({
    mutationFn: async ({ bookingId, cleanerId }: { bookingId: number; cleanerId: number }) => {
      const response = await fetch(`/api/customer/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          assignedTo: cleanerId,
          status: "assigned"
        }),
      });
      if (!response.ok) throw new Error("Failed to assign booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/bookings"] });
      setIsAssignDialogOpen(false);
      setSelectedBooking(null);
      toast({
        title: "Booking Assigned",
        description: "The booking has been successfully assigned to the cleaner.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign booking",
        variant: "destructive",
      });
    },
  });

  // Mutation to complete booking (creates invoice automatically)
  const completeBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/customer/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!response.ok) throw new Error("Failed to complete booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Booking Completed",
        description: "The booking has been marked as completed and an invoice was automatically created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete booking",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete booking
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/customer/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/bookings"] });
      toast({
        title: "Booking Deleted",
        description: "The booking has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      });
    },
  });

  // Mutation to add service to booking
  const addServiceMutation = useMutation({
    mutationFn: async ({ bookingId, serviceId, quantity }: { bookingId: number; serviceId: number; quantity: number }) => {
      const response = await fetch(`/api/customer/bookings/${bookingId}/add-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, quantity }),
      });
      if (!response.ok) throw new Error("Failed to add service to booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/bookings"] });
      setIsAddServiceDialogOpen(false);
      setNewService({ serviceId: "", quantity: 1 });
      toast({
        title: "Service Added",
        description: "Service has been successfully added to the booking.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Add Service Failed",
        description: error.message || "Failed to add service to booking",
        variant: "destructive",
      });
    },
  });

  const handleAssignBooking = (booking: CustomerBooking) => {
    setSelectedBooking(booking);
    setIsAssignDialogOpen(true);
  };

  const handleEditBooking = (booking: CustomerBooking) => {
    setEditingBooking(booking);
    setIsEditDialogOpen(true);
  };

  const handleConfirmAssignment = (cleanerId: number) => {
    if (selectedBooking) {
      assignBookingMutation.mutate({
        bookingId: selectedBooking.id,
        cleanerId
      });
    }
  };

  const handleCompleteBooking = (bookingId: number) => {
    if (confirm("Mark this booking as completed? This will automatically create an invoice.")) {
      completeBookingMutation.mutate(bookingId);
    }
  };

  const handleDeleteBooking = (bookingId: number) => {
    if (confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      deleteBookingMutation.mutate(bookingId);
    }
  };

  const handleAddService = () => {
    if (!editingBooking || !newService.serviceId) {
      toast({
        title: "Validation Error",
        description: "Please select a service.",
        variant: "destructive",
      });
      return;
    }

    addServiceMutation.mutate({
      bookingId: editingBooking.id,
      serviceId: parseInt(newService.serviceId),
      quantity: newService.quantity,
    });
  };

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
      case "assigned":
        return <UserCheck className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredBookings = bookings?.filter(booking => {
    // Role-based filtering: cleaners only see bookings assigned to them
    if (currentUser?.role === "cleaner") {
      // Cleaners only see bookings assigned to them
      if (booking.assignedTo !== currentUser.id) {
        return false;
      }
    }
    // Admins see all bookings, cleaners see filtered bookings based on assignment

    // Status filtering
    if (statusFilter === "unassigned") {
      return !booking.assignedTo && booking.status !== "cancelled" && booking.status !== "completed";
    }
    return statusFilter === "all" || booking.status === statusFilter;
  }) || [];

  const assignedCleaner = (booking: CustomerBooking) => {
    return cleaners.find(cleaner => cleaner.id === booking.assignedTo);
  };

  if (bookingsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentUser?.role === "cleaner" ? "My Bookings" : "Assign Bookings"}
          </h1>
          <p className="text-gray-600">
            {currentUser?.role === "cleaner" 
              ? "View and manage your assigned bookings" 
              : "Assign customer bookings to available cleaners"
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              {/* Only show unassigned option for admins */}
              {currentUser?.role !== "cleaner" && (
                <SelectItem value="unassigned">Unassigned</SelectItem>
              )}
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mb-4">
              <Users className="h-12 w-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {currentUser?.role === "cleaner" 
                ? "You don't have any bookings assigned to you yet."
                : statusFilter === "unassigned" 
                  ? "All bookings have been assigned to cleaners."
                  : "No bookings match the selected filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{booking.customerName}</h3>
                      <Badge className={`${getStatusColor(booking.status)} flex items-center gap-1`}>
                        {getStatusIcon(booking.status)}
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{booking.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{booking.address}</span>
                      </div>
                      {booking.preferredDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(booking.preferredDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {booking.preferredTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{booking.preferredTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total Amount</div>
                      <div className="text-lg font-semibold">{formatCurrency(parseFloat(booking.totalAmount))}</div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {booking.assignedTo ? (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Assigned to {assignedCleaner(booking)?.name || "Unknown"}
                          </span>
                        </div>
                      ) : (
                        // Only admins can assign cleaners
                        currentUser?.role !== "cleaner" && (
                          <Button
                            onClick={() => handleAssignBooking(booking)}
                            disabled={assignBookingMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Assign Cleaner
                          </Button>
                        )
                      )}

                      {/* Action buttons row */}
                      <div className="flex gap-2">
                        {/* Only admins can edit bookings */}
                        {currentUser?.role !== "cleaner" && booking.assignedTo && booking.status !== "completed" && booking.status !== "cancelled" && (
                          <Button
                            onClick={() => handleEditBooking(booking)}
                            size="sm"
                            variant="outline"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        
                        {/* Both admins and cleaners can complete their assigned bookings */}
                        {booking.status !== "completed" && booking.status !== "cancelled" && (
                          currentUser?.role !== "cleaner" || booking.assignedTo === currentUser.id
                        ) && (
                          <Button
                            onClick={() => handleCompleteBooking(booking.id)}
                            disabled={completeBookingMutation.isPending}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {completeBookingMutation.isPending ? "Completing..." : "Complete"}
                          </Button>
                        )}
                        
                        {/* Only admins can delete bookings */}
                        {currentUser?.role !== "cleaner" && (
                          <Button
                            onClick={() => handleDeleteBooking(booking.id)}
                            disabled={deleteBookingMutation.isPending}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deleteBookingMutation.isPending ? "Deleting..." : "Delete"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                    <div className="flex flex-wrap gap-2">
                      {booking.services.map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service.name} (x{service.quantity}) - {formatCurrency(parseFloat(service.price))}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {booking.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                      <p className="text-sm text-gray-600">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Booking to Cleaner</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedBooking.customerName}</h4>
                <p className="text-sm text-gray-600">{selectedBooking.address}</p>
                <p className="text-sm font-medium mt-2">
                  Total: {formatCurrency(parseFloat(selectedBooking.totalAmount))}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3">Select Cleaner:</h4>
                <div className="space-y-2">
                  {cleaners.length === 0 ? (
                    <p className="text-gray-500">No active cleaners available</p>
                  ) : (
                    cleaners.map((cleaner) => (
                      <Button
                        key={cleaner.id}
                        variant="outline"
                        className="w-full justify-start h-auto p-4"
                        onClick={() => handleConfirmAssignment(cleaner.id)}
                        disabled={assignBookingMutation.isPending}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{cleaner.name}</div>
                            <div className="text-sm text-gray-500">@{cleaner.username}</div>
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Booking - {editingBooking?.customerName}</DialogTitle>
          </DialogHeader>
          
          {editingBooking && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {editingBooking.customerName}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {editingBooking.phone}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Address:</span> {editingBooking.address}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Services & Pricing</h4>
                <div className="border rounded-lg p-4 space-y-4">
                  {editingBooking.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-600">
                          Quantity: {service.quantity} × {formatCurrency(parseFloat(service.price))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">
                          {formatCurrency(parseFloat(service.price) * service.quantity)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            // Remove service logic would go here
                            toast({
                              title: "Service Management",
                              description: "Service editing functionality can be expanded here for invoice modifications.",
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total Amount:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(parseFloat(editingBooking.totalAmount))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded-lg">
                    <span className="font-medium">Preferred Date:</span><br />
                    {editingBooking.preferredDate ? format(new Date(editingBooking.preferredDate), "MMM dd, yyyy") : "Not specified"}
                  </div>
                  <div className="p-3 border rounded-lg">
                    <span className="font-medium">Preferred Time:</span><br />
                    {editingBooking.preferredTime || "Not specified"}
                  </div>
                  {editingBooking.notes && (
                    <div className="col-span-2 p-3 border rounded-lg">
                      <span className="font-medium">Notes:</span><br />
                      {editingBooking.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Close
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => setIsAddServiceDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      toast({
                        title: "Changes Saved",
                        description: "Booking modifications have been prepared for invoice generation.",
                      });
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Service to Booking</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="service">Select Service</Label>
              <Select
                value={newService.serviceId}
                onValueChange={(value) => setNewService(prev => ({ ...prev, serviceId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices?.filter(service => service.isActive).map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{service.name}</span>
                        <span className="ml-2 text-green-600 font-medium">
                          {formatCurrency(parseFloat(service.price))}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewService(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                  disabled={newService.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 border rounded text-center min-w-[60px]">
                  {newService.quantity}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewService(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {newService.serviceId && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Cost:</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(
                    parseFloat(availableServices?.find(s => s.id.toString() === newService.serviceId)?.price || "0") * newService.quantity
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddServiceDialogOpen(false);
                  setNewService({ serviceId: "", quantity: 1 });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddService}
                disabled={addServiceMutation.isPending || !newService.serviceId}
                className="bg-green-600 hover:bg-green-700"
              >
                {addServiceMutation.isPending ? "Adding..." : "Add Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}