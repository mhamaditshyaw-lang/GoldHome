import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema } from "@shared/schema";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Receipt } from "lucide-react";

interface InvoiceFormProps {
  onClose: () => void;
}

export default function InvoiceForm({ onClose }: InvoiceFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const user = authManager.getState().user;

  const invoiceFormSchema = z.object({
    customerName: z.string().min(1, t("forms.required")),
    amount: z.string().min(1, t("invoices.amountRequired")),
    location: z.string().min(1, t("forms.required")),
    date: z.string().min(1, t("forms.required")),
    notes: z.string().optional(),
    cleanerId: z.number(),
    status: z.string(),
    serviceType: z.string().min(1, t("forms.required")),
  });

  type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

  const serviceTypes = [
    { key: "regularHouseClean", label: t("invoices.serviceTypes.regularHouseClean") },
    { key: "deepClean", label: t("invoices.serviceTypes.deepClean") },
    { key: "kitchenDeepClean", label: t("invoices.serviceTypes.kitchenDeepClean") },
    { key: "bathroomDeepClean", label: t("invoices.serviceTypes.bathroomDeepClean") },
    { key: "officeClean", label: t("invoices.serviceTypes.officeClean") },
    { key: "moveInMoveOut", label: t("invoices.serviceTypes.moveInMoveOut") },
    { key: "postConstructionClean", label: t("invoices.serviceTypes.postConstructionClean") },
    { key: "cleaningAndTransfer", label: t("invoices.serviceTypes.cleaningAndTransfer") },
    { key: "mirHouseCleaning", label: t("invoices.serviceTypes.mirHouseCleaning") },
  ];

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerName: "",
      amount: "",
      location: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
      cleanerId: user?.id || 1,
      status: "completed",
      serviceType: "",
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const response = await apiRequest("POST", "/api/invoices", {
        customerName: data.customerName,
        totalAmount: parseFloat(data.amount).toFixed(2),
        createdAt: data.date,
        cleanerId: data.cleanerId,
        status: data.status,
        notes: data.notes || "",
        location: data.location,
        services: [
          {
            id: 0,
            name: data.serviceType,
            price: parseFloat(data.amount).toFixed(2),
            quantity: 1
          }
        ],
        metadata: {
          invoiceType: "manual",
          serviceType: data.serviceType
        }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: t("invoices.invoiceSuccess"),
        description: t("invoices.invoiceSuccessDescription"),
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: t("invoices.invoiceError"),
        description: error.message || t("invoices.invoiceErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gold-100 mb-4">
            <Receipt className="h-6 w-6 text-gold-600" />
          </div>
          <DialogTitle className="text-center text-lg font-medium text-gray-900">
            {t("invoices.createNewInvoice")}
          </DialogTitle>
          <p className="text-center text-sm text-gray-500">
            {t("invoices.addNewInvoiceDescription")}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("invoices.customerNameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("invoices.customerNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("invoices.amountLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t("invoices.amountPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.date")}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      onChange={(e) => {
                        console.log("Invoice form date changed:", e.target.value);
                        field.onChange(e.target.value);
                      }}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("invoices.serviceLocationLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("invoices.serviceLocationPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("invoices.serviceType")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("common.pleaseSelect")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceTypes.map((service) => (
                        <SelectItem key={service.key} value={service.key}>
                          {service.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("invoices.notesLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("invoices.notesPlaceholder")}
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                {t("invoices.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={createInvoiceMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {createInvoiceMutation.isPending ? t("invoices.creatingButton") : t("invoices.createButton")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}