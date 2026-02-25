import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Receipt, Calendar, User, Phone, MapPin, Clock, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { Invoice } from "@shared/schema";
import { exportInvoiceToPDF } from "@/lib/pdf-export";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";

interface InvoiceWithCleaner extends Invoice {
  cleaner: { id: number; name: string } | null;
}

interface UserInvoiceDetailsProps {
  invoice: InvoiceWithCleaner;
  onClose: () => void;
}

export default function UserInvoiceDetails({ invoice, onClose }: UserInvoiceDetailsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Get header/footer settings from database
      let customSettings = null;
      try {
        const settingsResponse = await fetch('/api/invoice-settings');
        if (settingsResponse.ok) {
          customSettings = await settingsResponse.json();
        }
      } catch (error) {
        console.log('Could not fetch settings, using defaults');
      }

      // Create settings with database values or defaults
      const settings = customSettings ? {
        companyName: "Mali Altwni Company",
        headerText: customSettings.headerText || '',
        footerText: customSettings.footerText || '',
        primaryColor: "#FFD700",
        secondaryColor: "#FFA500",
        accentColor: "#333333",
        templateStyle: "professional",
        showCompanyInfo: true,
        showCustomerInfo: true,
        showServiceDetails: true,
        headerImage: customSettings.headerImage || null,
        footerImage: customSettings.footerImage || null,
        headerWidth: customSettings.headerWidth || '100',
        headerHeight: customSettings.headerHeight || '80',
        footerWidth: customSettings.footerWidth || '100',
        footerHeight: customSettings.footerHeight || '60'
      } : undefined;

      // Convert invoice to the expected format for PDF export
      const invoiceData = {
        ...invoice,
        createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : invoice.createdAt,
        notes: invoice.notes || undefined,
        expenses: invoice.expenses || undefined
      };
      await exportInvoiceToPDF(invoiceData, settings);
      toast({
        title: t("invoices.exportSuccessful"),
        description: t("invoices.invoicePDFDownloaded"),
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t("invoices.exportFailed"),
        description: t("invoices.failedToExportInvoice"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const subtotal = invoice.services.reduce((sum, service) =>
    sum + (parseFloat(service.price) * service.quantity), 0);

  // Extract materials from metadata
  const meta = invoice.metadata as any;
  const materialsList = meta?.materials || [];
  const singleMaterialName = meta?.materialName;
  const singleMaterialPrice = meta?.materialPrice || "0";

  const displayMaterials = [...materialsList];
  if (displayMaterials.length === 0 && singleMaterialName) {
    displayMaterials.push({ name: singleMaterialName, price: singleMaterialPrice });
  }

  const totalMaterialsCost = displayMaterials.reduce((sum, m) => sum + parseFloat(m.price || "0"), 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{t("invoiceDetails.title")}</DialogTitle>
            <Badge className={getStatusColor(invoice.status)}>
              {t(`invoices.${invoice.status}`)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t("invoiceDetails.invoiceNumber")}{invoice.id}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {t("invoices.created")} {format(new Date(invoice.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gold-600">
                    {formatCurrency(invoice.totalAmount)}
                  </div>
                  <p className="text-sm text-gray-600">{t("invoiceDetails.totalAmount")}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Customer & Service Provider Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {t("invoiceDetails.customerInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>{t("invoiceDetails.name")}</strong> {invoice.customerName}</p>
                  <p><strong>{t("invoiceDetails.date")}</strong> {format(new Date(invoice.createdAt), "PPP")}</p>
                  <p><strong>{t("invoiceDetails.status")}</strong> <Badge className={getStatusColor(invoice.status)}>{t(`invoices.${invoice.status}`)}</Badge></p>
                  <p><strong>{t("invoices.createdBy")}:</strong> {invoice.cleaner?.name || t("invoices.unknownCleaner")}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Receipt className="h-4 w-4 mr-2" />
                  {t("invoiceDetails.serviceProvider")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">{invoice.cleaner?.name || t("invoices.unknownCleaner")}</p>
                    <p className="text-sm text-gray-600">{t("invoiceDetails.cleaningProfessional")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services Provided */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("invoiceDetails.servicesProvided")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(service.price)} × {service.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(parseFloat(service.price) * service.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Materials Section */}
          {displayMaterials.length > 0 && (
            <Card className="border-purple-100 bg-purple-50/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-purple-700 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  {t("accounting.materialsDetails") || "Materials Detailed"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayMaterials.map((material, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{material.name}</h4>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-purple-600">
                          {formatCurrency(parseFloat(material.price || "0"))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Separator className="bg-purple-100" />
                  <div className="flex justify-between items-center px-2 py-1">
                    <span className="text-sm font-semibold text-purple-700">{t("accounting.materialsOrdered") || "Total Materials"}</span>
                    <span className="font-bold text-purple-700">{formatCurrency(totalMaterialsCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expenses / Salary */}
          {invoice.expenses && invoice.expenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("accounting.salaryDetails") || "Expense Breakdown"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.expenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{expense.name}</h4>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-red-600">
                          {formatCurrency(parseFloat(expense.price))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Calculation Summary */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("invoiceDetails.invoiceSummary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between font-medium">
                  <span>{t("invoiceDetails.subtotal")}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {totalMaterialsCost > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>{t("accounting.materialsOrdered")}</span>
                    <span>- {formatCurrency(totalMaterialsCost)}</span>
                  </div>
                )}
                <Separator />

                {/* Highlighted Summary Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                    <p className="text-sm text-gray-600">{t("invoiceDetails.total")}</p>
                    <p className="font-bold text-lg text-amber-700">{formatCurrency(invoice.totalAmount)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600">{t("accounting.dailySalary")}</p>
                    <p className="font-bold text-lg text-blue-700">
                      {invoice.metadata?.dailySalary
                        ? formatCurrency(parseFloat(invoice.metadata.dailySalary as string))
                        : "-"
                      }
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm text-gray-600">{t("accounting.remaining")}</p>
                    <p className="font-bold text-lg text-green-700">
                      {invoice.metadata?.remainingAmount
                        ? formatCurrency(parseFloat(invoice.metadata.remainingAmount as string))
                        : "-"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Information */}
          {invoice.metadata && Object.keys(invoice.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  {t("accounting.details") || "Additional Information"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invoice.metadata.invoiceType && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("invoices.serviceType")}</p>
                      <p className="font-medium text-blue-600">{invoice.metadata.invoiceType.toUpperCase()}</p>
                    </div>
                  )}
                  {invoice.metadata.employeeName && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("accounting.employeeName")}</p>
                      <p className="font-medium">{invoice.metadata.employeeName}</p>
                    </div>
                  )}
                  {invoice.metadata.numberOfEmployees && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("accounting.numberOfEmployees") || "Total Staff"}</p>
                      <p className="font-medium">{invoice.metadata.numberOfEmployees}</p>
                    </div>
                  )}
                  {invoice.metadata.numberOfCustomers && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("invoices.newInvoice.numberOfCustomers")}</p>
                      <p className="font-medium">{invoice.metadata.numberOfCustomers}</p>
                    </div>
                  )}
                  {invoice.metadata.startingTime && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("invoices.newInvoice.startingTime")}</p>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        <p className="font-medium">{invoice.metadata.startingTime}</p>
                      </div>
                    </div>
                  )}
                  {invoice.metadata.finishingTime && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("invoices.newInvoice.finishingTime")}</p>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        <p className="font-medium">{invoice.metadata.finishingTime}</p>
                      </div>
                    </div>
                  )}
                  {invoice.metadata.department && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("invoices.newInvoice.department")}</p>
                      <p className="font-medium">{invoice.metadata.department}</p>
                    </div>
                  )}
                  {invoice.metadata.cleaningMaterialsOrdered && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                      <p className="text-xs text-purple-500 uppercase tracking-wider">{t("invoices.newInvoice.cleaningMaterials")}</p>
                      <p className="font-medium text-purple-700">{t("common.yes") || "Yes"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {invoice.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("invoiceDetails.additionalNotes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="px-6">
              {t("ui.close")}
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-purple-600 hover:bg-purple-700 px-6 shadow-md transition-all hover:shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? t("forms.uploading") : t("invoiceDetails.exportPDF")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}