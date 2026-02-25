import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useCurrency } from "@/hooks/use-currency";
import { format } from "date-fns";
import { DollarSign, Search, Calendar, FileText, TrendingDown, Wifi, WifiOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebSocket } from "@/hooks/use-websocket";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface PaymentHistoryRecord {
  id: number;
  debtId: number;
  amount: string;
  remainingBalance: string;
  notes?: string;
  createdAt: string;
  creditorName: string;
  category: string;
}

export default function PaymentHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();
  const { isConnected } = useWebSocket();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("payment-history")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  const { data: payments = [], isLoading } = useQuery<PaymentHistoryRecord[]>({
    queryKey: ["/api/payment-history"],
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.creditorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.notes ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || payment.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(payments.map(p => p.category)));
  
  const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const paymentCount = payments.length;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t("paymentHistory.title")}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-2">
                {t("paymentHistory.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2" data-testid="connection-status">
              {isConnected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-600 font-medium hidden sm:inline">
                    {t("paymentHistory.liveUpdates")}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500 hidden sm:inline">
                    {t("paymentHistory.connecting")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-700">
                  {t("paymentHistory.totalPaid")}
                </CardTitle>
                <div className="p-2 bg-green-200 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-700" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-900" data-testid="total-paid">
                {formatCurrency(totalPaid)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700">
                  {t("paymentHistory.totalPayments")}
                </CardTitle>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-700" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-blue-900" data-testid="payment-count">
                {paymentCount}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-700">
                  {t("paymentHistory.averagePayment")}
                </CardTitle>
                <div className="p-2 bg-purple-200 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-purple-700" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-purple-900" data-testid="average-payment">
                {formatCurrency(paymentCount > 0 ? totalPaid / paymentCount : 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("paymentHistory.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="select-category-filter"
              >
                <option value="all">{t("paymentHistory.allCategories")}</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {t("paymentHistory.records")} ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("paymentHistory.noRecords")}
                </h3>
                <p className="text-gray-500">
                  {t("paymentHistory.noRecordsDescription")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("paymentHistory.date")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("paymentHistory.creditor")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("paymentHistory.category")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("paymentHistory.amount")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("paymentHistory.remainingBalance")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("paymentHistory.notes")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => {
                      const isFullPayment = parseFloat(payment.remainingBalance) === 0;
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors" data-testid={`payment-record-${payment.id}`}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {format(new Date(payment.createdAt), "MMM d, yyyy")}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {format(new Date(payment.createdAt), "h:mm a")}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900" data-testid={`creditor-${payment.id}`}>
                              {payment.creditorName}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className="bg-blue-100 text-blue-800" data-testid={`category-${payment.id}`}>
                              {payment.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600" data-testid={`amount-${payment.id}`}>
                              {formatCurrency(parseFloat(payment.amount))}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm font-semibold ${isFullPayment ? 'text-green-600' : 'text-orange-600'}`} data-testid={`balance-${payment.id}`}>
                              {formatCurrency(parseFloat(payment.remainingBalance))}
                              {isFullPayment && (
                                <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                                  {t("paymentHistory.fullPaid")}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {payment.notes ? (
                              <div className="text-sm text-gray-600 max-w-xs truncate" title={payment.notes} data-testid={`notes-${payment.id}`}>
                                {payment.notes}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
