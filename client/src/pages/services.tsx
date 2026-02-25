import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, DollarSign, Edit, Upload, Image } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ServiceCardSkeleton, ButtonLoader } from "@/components/ui/loading-animations";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";

interface Service {
  id: number;
  name: string;
  price: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
}

const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  price: z.string().min(0.01, "Price must be greater than 0"),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  service?: Service;
  onClose: () => void;
}

function ServiceForm({ service, onClose }: ServiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(service?.image || "");

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name || "",
      price: service?.price || "0.00",
      description: service?.description || "",
      image: service?.image || "",
      isActive: service?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      if (service) {
        const response = await apiRequest("PUT", `/api/services/${service.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/services", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services/all"] });
      toast({
        title: t('common.success'),
        description: service ? t('services.updateSuccess') : t('services.createSuccess'),
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    mutation.mutate(data);
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiRequest("POST", "/api/upload/service-image", formData);

      if (response.ok) {
        const data = await response.json();
        setImagePreview(data.imageUrl);
        form.setValue('image', data.imageUrl);
        toast({
          title: t('common.success'),
          description: t('services.imageUploadSuccess'),
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: t('common.error'),
        description: error?.message || t('common.error'),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: t('common.error'),
          description: t('services.invalidFileType'),
          variant: "destructive",
        });
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        toast({
          title: t('common.error'),
          description: t('services.fileTooLarge'),
          variant: "destructive",
        });
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Show file info
      toast({
        title: t('common.processingImage'),
        description: t('services.uploading', { name: file.name }),
      });

      handleImageUpload(file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[60vh] px-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('services.form.name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('services.form.namePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('services.form.price')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('services.form.description')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('services.form.descriptionPlaceholder')}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('services.form.image')}</FormLabel>
                <div className="space-y-4">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Service preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-amber-200 shadow-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 shadow-lg"
                        onClick={() => {
                          setImagePreview("");
                          form.setValue('image', "");
                          toast({
                            title: t('common.imageRemoved'),
                            description: t('common.imageRemoved'),
                          });
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2"
                    >
                      {isUploading ? (
                        <ButtonLoader>{t('common.updating')}</ButtonLoader>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          {t('common.chooseImage')}
                        </>
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Max 5MB • JPEG, PNG, GIF, WebP
                    </span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                  />

                  {/* Hidden field to store image URL */}
                  <Input type="hidden" {...field} />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>{t('services.form.active')}</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    {t('services.form.activeDesc')}
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t bg-white sticky bottom-0">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <ButtonLoader>{service ? t('common.updating') : t('common.creating')}</ButtonLoader>
            ) : (
              service ? t('common.update') : t('common.create')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Services() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const { isConnected } = useWebSocket(); // Initialize WebSocket connection
  const { t } = useLanguage();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();

  // Check if user has access to this page
  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("services")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services/all"],
    staleTime: 5 * 1000, // 5 seconds
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/services/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services/all"] });
      toast({
        title: t('common.success'),
        description: t('common.deleteSuccess') || 'Service deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingService(undefined);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(undefined);
  };

  const handleDelete = (id: number) => {
    if (confirm(t('services.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('services.title')}</h1>
            <p className="text-gray-600">{t('services.subtitle')}</p>
          </div>
          <Button disabled className="bg-purple-600">
            <Plus className="h-4 w-4 mr-2" />
            {t('services.addService')}
          </Button>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('services.title')}</h1>
          <p className="text-gray-600">{t('services.subtitle')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('services.addService')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingService ? t('services.editService') : t('services.addNewService')}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              <ServiceForm service={editingService} onClose={handleCloseDialog} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Service Image */}
                  <div className="flex-shrink-0">
                    {service.image ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-amber-200 shadow-sm">
                        <img
                          src={service.image}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                          <Image className="h-6 w-6 text-amber-600" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center shadow-sm">
                        <Image className="h-6 w-6 text-amber-600" />
                      </div>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </div>
                    <div className="flex items-center text-2xl font-bold text-amber-600 mt-2">
                      <DollarSign className="h-5 w-5" />
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {service.description && (
              <CardContent className="pt-0">
                <p className="text-gray-600">{service.description}</p>
              </CardContent>
            )}
          </Card>
        ))}

        {services.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">{t('services.noServices')}</h3>
              <p className="mb-4">{t('services.noServicesDesc')}</p>
              <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('services.addFirstService')}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}