import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Filter, Download, FileText, Calendar, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { exportInvoiceToPDF, exportInvoiceListToPDF } from "@/lib/pdf-export";
import { Invoice } from "@shared/schema";
import { format } from "date-fns";
import NewInvoiceForm from "@/components/invoices/new-invoice-form";
import GroupInvoiceForm from "@/components/invoices/group-invoice-form";
import UserInvoiceDetails from "@/components/invoices/user-invoice-details";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebSocket } from "@/hooks/use-websocket";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";

interface InvoiceWithCleaner extends Invoice {
  cleaner: { id: number; name: string } | null;
}


export default function Invoices() {
  const { t, language } = useLanguage();
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showGroupInvoiceForm, setShowGroupInvoiceForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilterType, setDateFilterType] = useState("this-month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<InvoiceWithCleaner | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Close form when language changes
  useEffect(() => {
    setShowInvoiceForm(false);
    setShowGroupInvoiceForm(false);
  }, [language]);

  // Initialize date filter based on selected type
  useEffect(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    switch (dateFilterType) {
      case "all-dates":
        setStartDate("");
        setEndDate("");
        break;
      case "today":
        const todayStr = today.toISOString().split('T')[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case "this-week":
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case "this-month":
        setStartDate(startOfMonth.toISOString().split('T')[0]);
        setEndDate(endOfMonth.toISOString().split('T')[0]);
        break;
      case "custom":
        // Keep existing dates for custom
        break;
    }
  }, [dateFilterType]);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { isConnected } = useWebSocket(); // Initialize WebSocket connection
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();

  // Check if user has access to this page
  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("invoices")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);


  const { data: invoices, isLoading } = useQuery<InvoiceWithCleaner[]>({
    queryKey: ["/api/invoices"],
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: false, // Let WebSocket handle updates
    refetchIntervalInBackground: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); // Refresh dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }); // Refresh accounting if expenses are involved
      toast({
        title: t('invoices.deleteSuccessful'),
        description: t('invoices.invoiceDeletedMessage'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('invoices.failedToDeleteInvoice'),
        variant: "destructive",
      });
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, startDate, endDate]);

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch =
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.services.some(service => service.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.cleaner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    // Date filtering
    const invoiceDate = new Date(invoice.createdAt);
    const invoiceDateOnly = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), invoiceDate.getDate());
    const startDateOnly = startDate ? new Date(startDate) : null;
    const endDateOnly = endDate ? new Date(endDate) : null;

    const matchesStartDate = !startDateOnly || invoiceDateOnly >= startDateOnly;
    const matchesEndDate = !endDateOnly || invoiceDateOnly <= endDateOnly;

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  }) ?? [];

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const handleExportSingle = async (invoice: InvoiceWithCleaner) => {
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

      const headerText = customSettings?.headerText || '';
      const footerText = customSettings?.footerText || '';
      const headerImage = customSettings?.headerImage || null;
      const footerImage = customSettings?.footerImage || null;
      const headerWidth = customSettings?.headerWidth || '100';
      const headerHeight = customSettings?.headerHeight || '80';
      const footerWidth = customSettings?.footerWidth || '100';
      const footerHeight = customSettings?.footerHeight || '60';

      // Convert types for PDF export
      const invoiceForPDF = {
        ...invoice,
        createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : invoice.createdAt,
        notes: invoice.notes ?? undefined,
        expenses: invoice.expenses ?? undefined
      };

      // Create settings with custom header/footer
      const settings = {
        companyName: "Mali Altwni Company",
        headerText,
        footerText,
        primaryColor: "#FFD700",
        secondaryColor: "#FFA500",
        accentColor: "#333333",
        templateStyle: "professional",
        showCompanyInfo: true,
        showCustomerInfo: true,
        showServiceDetails: true,
        headerImage,
        footerImage,
        headerWidth,
        headerHeight,
        footerWidth,
        footerHeight
      };

      await exportInvoiceToPDF(invoiceForPDF, settings);
      toast({
        title: t('invoices.exportSuccessful'),
        description: t('invoices.invoicePDFDownloaded'),
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t('invoices.exportFailed'),
        description: t('invoices.failedToExportInvoice'),
        variant: "destructive",
      });
    }
  };

  const handleExportAll = async () => {
    try {
      // Convert types for PDF export
      const invoicesForPDF = filteredInvoices.map(invoice => ({
        ...invoice,
        createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : invoice.createdAt,
        notes: invoice.notes ?? undefined,
        expenses: invoice.expenses ?? undefined
      }));
      await exportInvoiceListToPDF(invoicesForPDF);
      toast({
        title: t('invoices.exportSuccessful'),
        description: t('invoices.invoiceReportDownloaded'),
      });
    } catch (error) {
      console.error('Export report error:', error);
      toast({
        title: t('invoices.exportFailed'),
        description: t('invoices.failedToExportReport'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('invoices.invoiceManagement')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('invoices.manageTrackInvoices')}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Button
              variant="outline"
              onClick={handleExportAll}
              disabled={filteredInvoices.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('invoices.exportReport')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('invoices.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="invoice-search"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-white border border-gray-300" data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder={t('invoices.allStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('invoices.allStatus')}</SelectItem>
                    <SelectItem value="pending">{t('invoices.pending')}</SelectItem>
                    <SelectItem value="completed">{t('invoices.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('invoices.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date filter type selector */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Select value={dateFilterType} onValueChange={(value) => setDateFilterType(value)}>
                  <SelectTrigger className="w-full sm:w-48 bg-white border border-gray-300" data-testid="date-filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-dates">{t('invoices.allDates')}</SelectItem>
                    <SelectItem value="today">{t('invoices.today')}</SelectItem>
                    <SelectItem value="this-week">{t('invoices.thisWeek')}</SelectItem>
                    <SelectItem value="this-month">{t('invoices.thisMonth')}</SelectItem>
                    <SelectItem value="custom">{t('invoices.customRange')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Custom date range inputs - only show for custom type */}
                {dateFilterType === "custom" && (
                  <>
                    <div className="relative flex-1 sm:flex-none">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        type="date"
                        placeholder={t('invoices.startDate')}
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setDateFilterType("custom");
                        }}
                        className="pl-10 w-full sm:w-40 bg-white border border-gray-300 rounded-md"
                        data-testid="invoice-start-date"
                      />
                    </div>
                    <span className="text-sm text-gray-500">{t('invoices.to')}</span>
                    <div className="relative flex-1 sm:flex-none">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        type="date"
                        placeholder={t('invoices.endDate')}
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setDateFilterType("custom");
                        }}
                        className="pl-10 w-full sm:w-40 bg-white border border-gray-300 rounded-md"
                        data-testid="invoice-end-date"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices table */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('invoices.allInvoices')}</CardTitle>
            <div className="flex gap-2">
              <Button
                className="bg-purple-700 hover:bg-amber-700 text-white font-medium px-4 py-2"
                onClick={() => setShowInvoiceForm(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('invoices.createInvoice')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">{t('invoices.noInvoicesFound')}</div>
                <Button
                  className="bg-purple-700 hover:bg-amber-700 text-white font-medium px-4 py-2"
                  onClick={() => setShowInvoiceForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('invoices.createFirstInvoice')}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.customer')}</TableHead>
                    <TableHead>{t('invoices.serviceType')}</TableHead>
                    <TableHead>{t('invoices.createdBy')}</TableHead>
                    <TableHead>{t('invoices.amount')}</TableHead>
                    <TableHead>{t('invoices.status')}</TableHead>
                    <TableHead>{t('invoices.date')}</TableHead>
                    <TableHead>{t('invoices.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                      <TableCell className="font-medium" data-testid={`customer-name-${invoice.id}`}>
                        {invoice.customerName}
                      </TableCell>
                      <TableCell data-testid={`services-${invoice.id}`}>
                        {Array.isArray(invoice.services) && invoice.services.length > 0
                          ? invoice.services.map(s => s.name).join(", ")
                          : t('invoices.multipleServices')
                        }
                      </TableCell>
                      <TableCell className="text-sm text-gray-600" data-testid={`created-by-${invoice.id}`}>
                        {invoice.cleaner?.name || t('invoices.unknownCleaner')}
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`amount-${invoice.id}`}>
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell data-testid={`status-${invoice.id}`}>
                        <Badge className={getStatusColor(invoice.status)}>
                          {t(`invoices.${invoice.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`date-${invoice.id}`}>
                        {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoiceForDetails(invoice)}
                            title="View Details"
                            data-testid={`details-button-${invoice.id}`}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportSingle(invoice)}
                            title={t('invoices.exportInvoicePDF')}
                            data-testid={`export-button-${invoice.id}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(invoice.id)}
                            title={t('invoices.deleteInvoice')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-button-${invoice.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {filteredInvoices.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">Show:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-20 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">of {filteredInvoices.length} records</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-9">
                    <ChevronLeft className="h-4 w-4 mr-1" />Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-9 w-9 p-0 ${currentPage === pageNum ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'hover:bg-purple-50'}`}>
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-9">
                    Next<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600 font-medium">Page {currentPage} of {totalPages}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice form modal */}
      {showInvoiceForm && (
        <NewInvoiceForm key={`invoice-form-${language}`} onClose={() => setShowInvoiceForm(false)} />
      )}

      {/* Group invoice form modal */}
      {showGroupInvoiceForm && (
        <GroupInvoiceForm key={`group-invoice-form-${language}`} onClose={() => setShowGroupInvoiceForm(false)} />
      )}

      {/* Invoice details modal */}
      {selectedInvoiceForDetails && (
        <UserInvoiceDetails
          invoice={selectedInvoiceForDetails}
          onClose={() => setSelectedInvoiceForDetails(null)}
        />
      )}
    </div>
  );
}