import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, DollarSign, TrendingUp, TrendingDown, Calendar, Receipt, Download, BarChart3, Users, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { z } from "zod";
import type { Invoice } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";

interface InvoiceWithCleaner extends Invoice {
  cleaner: { id: number; name: string } | null;
}

interface Expense {
  id: number;
  description: string;
  amount: string;
  category: string;
  date: string;
  receipt?: string;
  userId: number;
}

interface Debt {
  id: number;
  creditorName: string;
  amount: string;
  description?: string;
  dueDate: string;
  priority: string;
  category: string;
  status: string;
  userId: number;
}

const createExpenseSchema = (t: any) => z.object({
  description: z.string().min(1, t("expenses.descriptionRequired")),
  amount: z.string().min(1, t("expenses.amountRequired")),
  category: z.string().min(1, t("expenses.categoryRequired")),
  date: z.string().min(1, t("expenses.dateRequired")),
  receipt: z.string().optional(),
});

type ExpenseFormData = {
  description: string;
  amount: string;
  category: string;
  date: string;
  receipt?: string;
};

const incomeCategories = [
];

export default function Accounting() {
  const [dateRange, setDateRange] = useState("thisMonth");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const { t } = useLanguage();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();

  // Check if user has access to this page
  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("accounting")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<InvoiceWithCleaner[]>({
    queryKey: ["/api/invoices"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });

  const { data: debts = [], isLoading: debtsLoading } = useQuery<Debt[]>({
    queryKey: ["/api/debts"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(createExpenseSchema(t)),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: format(new Date(), "yyyy-MM-dd"),
      receipt: "",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const response = await apiRequest("POST", "/api/expenses", {
        ...data,
        amount: parseFloat(data.amount).toFixed(2),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setShowExpenseDialog(false);
      form.reset();
      toast({
        title: t("common.success"),
        description: t("accounting.expenseRecordedSuccess"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter data by date range
  const [salaryEmployeeFilter, setSalaryEmployeeFilter] = useState("");

  // Pagination states for all tabs
  const [salaryCurrentPage, setSalaryCurrentPage] = useState(1);
  const [salaryItemsPerPage, setSalaryItemsPerPage] = useState(10);

  const [invoicesCurrentPage, setInvoicesCurrentPage] = useState(1);
  const [invoicesItemsPerPage, setInvoicesItemsPerPage] = useState(10);

  const [invoiceDetailsCurrentPage, setInvoiceDetailsCurrentPage] = useState(1);
  const [invoiceDetailsItemsPerPage, setInvoiceDetailsItemsPerPage] = useState(10);

  const [expensesCurrentPage, setExpensesCurrentPage] = useState(1);
  const [expensesItemsPerPage, setExpensesItemsPerPage] = useState(10);

  const [materialsCurrentPage, setMaterialsCurrentPage] = useState(1);
  const [materialsItemsPerPage, setMaterialsItemsPerPage] = useState(10);

  // Reset pages when filters change
  useEffect(() => {
    setSalaryCurrentPage(1);
    setInvoicesCurrentPage(1);
    setInvoiceDetailsCurrentPage(1);
    setExpensesCurrentPage(1);
    setMaterialsCurrentPage(1);
  }, [salaryEmployeeFilter, startDate, endDate]);

  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.createdAt);
    return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate + "T23:59:59");
  });

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate + "T23:59:59");
  });

  // Calculate financial metrics
  const totalRevenue = filteredInvoices.reduce((sum, invoice) =>
    sum + parseFloat(invoice.totalAmount), 0);

  const totalExpenses = filteredExpenses.reduce((sum, expense) =>
    sum + parseFloat(expense.amount), 0);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Calculate unpaid debts (pending and not marked as paid)
  const unpaidDebts = debts.filter(debt => debt.status !== "paid").reduce((sum, debt) =>
    sum + parseFloat(debt.amount), 0);

  // Updated formula: Remaining Amount = Total Revenue - Total Daily Salary - Total Taxi - Total Expenses
  // We need to calculate daily salaries and taxi expenses from invoices
  const totalDailySalaries = filteredInvoices.reduce((sum, inv) => {
    const meta = inv.metadata as any;
    const invoiceType = meta?.invoiceType;

    // For daily invoices
    if (invoiceType === "daily") {
      return sum + parseFloat(meta?.dailySalary || "0");
    }

    // For group invoices
    if (invoiceType === "group") {
      // New format: individual salaries per employee
      if (meta?.employeeSalaries) {
        const salariesSum = Object.values(meta.employeeSalaries as Record<string, string>)
          .reduce((total, salary) => total + parseFloat(salary as string), 0);
        return sum + salariesSum;
      }
      // Old format: same salary for all employees
      if (meta?.employeePay && meta?.employeeNames) {
        const employeeCount = (meta.employeeNames as string[]).length;
        return sum + (parseFloat(meta.employeePay) * employeeCount);
      }
    }

    return sum;
  }, 0);

  // Calculate total taxi expenses from both expenses array and metadata
  const totalTaxiExpenses = filteredInvoices.reduce((sum, inv) => {
    const meta = inv.metadata as any;
    let taxi = 0;

    // First check expenses array for taxi
    let expensesArray: any[] = Array.isArray(inv.expenses) ? inv.expenses : [];
    if (typeof inv.expenses === 'string') {
      try { expensesArray = JSON.parse(inv.expenses); } catch (e) { }
    }

    if (Array.isArray(expensesArray)) {
      const taxiExp = expensesArray.find((e: any) =>
        e.name && String(e.name).toLowerCase().includes("taxi")
      );
      if (taxiExp) taxi = parseFloat(taxiExp.price || taxiExp.amount || "0");
    }

    // Fallback to metadata if not found in expenses
    if (taxi === 0) {
      taxi = parseFloat(meta?.taxiFare || meta?.taxi || "0");
    }

    return sum + taxi;
  }, 0);

  const totalMaterialsOrdered = filteredInvoices.reduce((sum, inv) => {
    const meta = inv.metadata as any;
    const materialsList = meta?.materials || [];
    const materialsSum = materialsList.reduce((mSum: number, m: any) => mSum + parseFloat(m.price || "0"), 0);
    const singlePrice = parseFloat(meta?.materialPrice || "0");
    return sum + materialsSum + (materialsList.length === 0 ? singlePrice : 0);
  }, 0);

  // Cash balance excludes uncollected credit sales (unpaidDebts) — only actual received cash
  const remainingAmount = totalRevenue - totalDailySalaries - totalTaxiExpenses - totalExpenses - unpaidDebts;

  // Revenue by service type
  const revenueByService = filteredInvoices.reduce((acc, invoice) => {
    invoice.services.forEach(service => {
      if (!acc[service.name]) {
        acc[service.name] = 0;
      }
      acc[service.name] += parseFloat(service.price) * service.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  // Expenses by category
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const now = new Date();

    switch (range) {
      case "thisMonth":
        setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "lastMonth":
        const lastMonth = subDays(startOfMonth(now), 1);
        setStartDate(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
        break;
      case "thisYear":
        setStartDate(format(new Date(now.getFullYear(), 0, 1), "yyyy-MM-dd"));
        setEndDate(format(new Date(now.getFullYear(), 11, 31), "yyyy-MM-dd"));
        break;
      case "last30Days":
        setStartDate(format(subDays(now, 30), "yyyy-MM-dd"));
        setEndDate(format(now, "yyyy-MM-dd"));
        break;
    }
  };

  const onSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  const exportFinancialReport = () => {
    const reportData = {
      period: `${startDate} to ${endDate}`,
      revenue: totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      unpaidDebts,
      remainingAmount,
      revenueByService,
      expensesByCategory,
      invoices: filteredInvoices,
      expenses: filteredExpenses,
      debts: debts.filter(d => d.status !== "paid")
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${startDate}-${endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (invoicesLoading || expensesLoading || debtsLoading) {
    return <div className="p-6">{t("accounting.loadingAccountingData")}</div>;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t("accounting.title")}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              {t("accounting.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button variant="outline" onClick={exportFinancialReport} size="sm" className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              {t("accounting.exportReport")}
            </Button>
            <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("accounting.addExpense")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t("accounting.recordNewExpense")}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("accounting.description")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("accounting.enterExpenseDescription")} {...field} />
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
                          <FormLabel>{t("accounting.amount")} ({getCurrencySymbol()})</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("accounting.category")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("accounting.enterNewCategory")} {...field} />
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
                          <FormLabel>{t("accounting.date")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receipt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("accounting.receiptNotes")}</FormLabel>
                          <FormControl>
                            <Textarea placeholder={t("accounting.receiptPlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowExpenseDialog(false)}>
                        {t("accounting.cancel")}
                      </Button>
                      <Button type="submit" disabled={createExpenseMutation.isPending}>
                        {createExpenseMutation.isPending ? t("accounting.recording") : t("accounting.recordExpense")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t("accounting.selectDateRange")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">{t("accounting.thisMonth")}</SelectItem>
                  <SelectItem value="lastMonth">{t("accounting.lastMonth")}</SelectItem>
                  <SelectItem value="last30Days">{t("accounting.last30Days")}</SelectItem>
                  <SelectItem value="thisYear">{t("accounting.thisYear")}</SelectItem>
                  <SelectItem value="custom">{t("accounting.customRange")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-40">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="relative w-full sm:w-40">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {/* Total Revenue Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-800">{t("accounting.totalRevenue")}</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-green-700 mb-1">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-green-600/80 font-medium">
                {t("accounting.fromInvoices", { count: filteredInvoices.length.toString() })}
              </p>
            </CardContent>
          </Card>

          {/* Remaining Amount Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-800">{t("accounting.remainingAmount")} (Cash)</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className={`text-2xl font-bold mb-1 ${remainingAmount >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                {formatCurrency(remainingAmount)}
              </div>
              <p className="text-xs text-blue-600/80 font-medium">
                After expenses & uncollected credit sales
              </p>
            </CardContent>
          </Card>

          {/* Employee Daily Salary Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800">{t("accounting.employeeSalary") || "Employee Salary"}</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-amber-700 mb-1">
                {formatCurrency(totalDailySalaries)}
              </div>
              <p className="text-xs text-amber-600/80 font-medium">
                {t("accounting.totalPaidToEmployees") || "Total paid to employees"}
              </p>
            </CardContent>
          </Card>

          {/* Taxi Fee Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-orange-800">{t("accounting.taxiFee") || "Taxi Fee"}</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-orange-700 mb-1">
                {formatCurrency(totalTaxiExpenses)}
              </div>
              <p className="text-xs text-orange-600/80 font-medium">
                {t("accounting.totalTaxiExpenses") || "Total taxi expenses"}
              </p>
            </CardContent>
          </Card>

          {/* Materials Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-800">{t("accounting.materialsOrdered") || "Materials"}</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
                <Receipt className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-purple-700 mb-1">
                {formatCurrency(totalMaterialsOrdered)}
              </div>
              <p className="text-xs text-purple-600/80 font-medium">
                {t("accounting.totalMaterialsCost") || "Total materials cost"}
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-800">{t("accounting.totalExpenses")}</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-red-700 mb-1">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-red-600/80 font-medium">
                {t("accounting.otherExpenses") || "Other expenses"}
              </p>
            </CardContent>
          </Card>

          {/* Unpaid Debts Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-pink-50 via-rose-50 to-red-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-pink-800">{t("accounting.unpaidDebts") || "Unpaid Debts"}</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-pink-700 mb-1">
                {formatCurrency(unpaidDebts)}
              </div>
              <p className="text-xs text-pink-600/80 font-medium">
                {t("accounting.pendingPayments") || "Pending payments"}
              </p>
            </CardContent>
          </Card>

          {/* Total Combined Expenses Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/20 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">{t("accounting.allExpenses") || "All Expenses"}</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-slate-700 mb-1">
                {formatCurrency(totalDailySalaries + totalTaxiExpenses + totalExpenses)}
              </div>
              <p className="text-xs text-slate-600/80 font-medium">
                {t("accounting.salaryTaxiOther") || "Salary + Taxi + Other"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-gradient-to-r from-gray-50 to-slate-50 p-2 rounded-xl border border-gray-200 shadow-sm">
            <TabsTrigger
              value="invoices"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold transition-all duration-200 rounded-lg px-4 py-2"
            >
              {t("accounting.revenueDetails")}
            </TabsTrigger>
            <TabsTrigger
              value="invoiceDetails"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold transition-all duration-200 rounded-lg px-4 py-2"
            >
              {t("accounting.invoiceDetails")}
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold transition-all duration-200 rounded-lg px-4 py-2"
            >
              {t("accounting.expenseDetails")}
            </TabsTrigger>
            <TabsTrigger
              value="salaries"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold transition-all duration-200 rounded-lg px-4 py-2"
            >
              {t("accounting.salaryDetails")}
            </TabsTrigger>
            <TabsTrigger
              value="materials"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold transition-all duration-200 rounded-lg px-4 py-2"
            >
              {t("accounting.materialsDetails") || "Materials"}
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold transition-all duration-200 rounded-lg px-4 py-2"
            >
              {t("accounting.financialReports")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="salaries" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-emerald-900">{t("accounting.dailySalaryPayments")}</CardTitle>
                </div>
                <div className="w-full sm:w-64">
                  <Input
                    placeholder={t("accounting.filterByEmployee")}
                    value={salaryEmployeeFilter}
                    onChange={(e) => setSalaryEmployeeFilter(e.target.value)}
                    className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                        <TableHead className="font-bold text-emerald-900">{t("accounting.invoiceNumber")}</TableHead>
                        <TableHead className="font-bold text-emerald-900">{t("accounting.employeeName")}</TableHead>
                        <TableHead className="font-bold text-emerald-900">{t("accounting.employeeId")}</TableHead>
                        <TableHead className="font-bold text-emerald-900 text-right">{t("accounting.dailySalary")}</TableHead>
                        <TableHead className="font-bold text-emerald-900 text-right">{t("accounting.taxi")}</TableHead>
                        <TableHead className="font-bold text-emerald-900 text-right">{t("accounting.materialsOrdered")}</TableHead>
                        <TableHead className="font-bold text-emerald-900 text-center">{t("accounting.services")}</TableHead>
                        <TableHead className="font-bold text-emerald-900">{t("accounting.date")}</TableHead>
                        <TableHead className="font-bold text-emerald-900">{t("accounting.details")}</TableHead>
                        <TableHead className="font-bold text-emerald-900 text-right">{t("accounting.remaining")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const records = filteredInvoices.flatMap(inv => {
                          const isDaily = inv.metadata?.invoiceType === "daily";
                          const isGroup = inv.metadata?.invoiceType === "group";
                          const meta = inv.metadata as any;

                          let taxi = 0;
                          let expensesArray: any[] = Array.isArray(inv.expenses) ? inv.expenses : [];
                          if (typeof inv.expenses === 'string') {
                            try { expensesArray = JSON.parse(inv.expenses); } catch (e) { }
                          }

                          if (Array.isArray(expensesArray)) {
                            const taxiExp = expensesArray.find((e: any) =>
                              e.name && String(e.name).toLowerCase().includes("taxi")
                            );
                            if (taxiExp) taxi = parseFloat(taxiExp.price || taxiExp.amount || "0");
                          }

                          if (taxi === 0) {
                            taxi = parseFloat(meta?.taxiFare || meta?.taxi || "0");
                          }

                          const materialsList = meta?.materials || [];
                          const materialsCost = materialsList.reduce((sum: number, m: any) => sum + parseFloat(m.price || "0"), 0) + parseFloat(meta?.materialPrice || "0");

                          const remainingAmount = parseFloat(meta?.remainingAmount || meta?.totalNet || inv.totalAmount);

                          if (isGroup && (meta?.employees || meta?.employeeSalaries || meta?.employeePay)) {
                            const names = meta?.employeeNames || [];
                            // Support for multiple formats:
                            // 1. New format with employees array: [{name, salary}]
                            // 2. New format with employeeSalaries object: {name: salary}
                            // 3. Old format with employeePay: same salary for all
                            let employeeSalaries = meta?.employeeSalaries || {};
                            if (meta?.employees && Array.isArray(meta.employees)) {
                              // Convert employees array to employeeSalaries object
                              employeeSalaries = meta.employees.reduce((acc: any, emp: any) => {
                                acc[emp.name] = emp.salary;
                                return acc;
                              }, {});
                            }
                            const employeeIds = meta?.employeeIds || {}; // Employee IDs/codes
                            const employeePay = parseFloat(meta.employeePay || "0"); // Old format: same salary for all

                            const materialDetail = materialsList.length > 0
                              ? ` + Materials: ${materialsList.map((m: any) => m.name).join(", ")}`
                              : (meta?.materialName ? ` + Material: ${meta.materialName}` : "");

                            return names
                              .filter((name: string) => name.toLowerCase().includes(salaryEmployeeFilter.toLowerCase()))
                              .map((name: string, index: number) => {
                                // Use individual salary if available, otherwise fall back to old employeePay
                                const individualSalary = employeeSalaries[name]
                                  ? parseFloat(employeeSalaries[name])
                                  : employeePay;

                                return {
                                  id: `${inv.id}-group-${index}`,
                                  invoiceId: inv.id,
                                  employeeName: name,
                                  employeeId: employeeIds[name] || "",
                                  dailySalary: individualSalary,
                                  taxi: taxi,
                                  materialsCost: materialsCost,
                                  servicesCount: inv.services.length,
                                  date: format(new Date(inv.createdAt), "MMM d, yyyy"),
                                  details: `Group: ${inv.customerName}` + materialDetail,
                                  remaining: remainingAmount
                                };
                              });
                          } else {
                            // Daily or Fallback
                            const employeeName = meta?.employeeName || inv.cleaner?.name || "Employee";
                            if (!employeeName.toLowerCase().includes(salaryEmployeeFilter.toLowerCase())) return [];

                            const salary = parseFloat(meta?.dailySalary || "0");

                            return [{
                              id: `${inv.id}-salary`,
                              invoiceId: inv.id,
                              employeeName,
                              employeeId: meta?.employeeId || "",
                              dailySalary: salary,
                              taxi: taxi,
                              materialsCost: materialsCost,
                              servicesCount: inv.services.length,
                              date: format(new Date(inv.createdAt), "MMM d, yyyy"),
                              details: inv.services.map(s => s.name).join(", ") + (
                                materialsList.length > 0
                                  ? ` + Materials: ${materialsList.map((m: any) => m.name).join(", ")}`
                                  : (meta?.materialName ? ` + Material: ${meta.materialName}` : "")
                              ),
                              remaining: remainingAmount
                            }];
                          }
                        });

                        if (records.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                {t("accounting.noSalaryRecords")}
                              </TableCell>
                            </TableRow>
                          );
                        }

                        // Pagination logic
                        const totalRecords = records.length;
                        const totalPages = Math.ceil(totalRecords / salaryItemsPerPage);
                        const startIndex = (salaryCurrentPage - 1) * salaryItemsPerPage;
                        const endIndex = startIndex + salaryItemsPerPage;
                        const paginatedRecords = records.slice(startIndex, endIndex);

                        return paginatedRecords.map((record, idx) => (
                          <TableRow
                            key={record.id}
                            className={`hover:bg-emerald-50/50 transition-colors ${(startIndex + idx) % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            <TableCell className="font-bold text-emerald-700">#{record.invoiceId}</TableCell>
                            <TableCell className="font-semibold text-gray-900">{record.employeeName}</TableCell>
                            <TableCell className="text-gray-600 font-medium">
                              {record.employeeId ? (
                                <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded text-xs">
                                  {record.employeeId}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-amber-600 font-semibold">{formatCurrency(record.dailySalary)}</TableCell>
                            <TableCell className="text-right text-orange-600 font-semibold">{formatCurrency(record.taxi)}</TableCell>
                            <TableCell className="text-right text-purple-600 font-semibold">{formatCurrency(record.materialsCost)}</TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 font-medium px-2.5 py-1 rounded-full text-xs">
                                {record.servicesCount}
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-600 font-medium">{record.date}</TableCell>
                            <TableCell className="text-sm text-gray-700 max-w-xs truncate">{record.details}</TableCell>
                            <TableCell className="text-right font-bold text-green-600 text-base">{formatCurrency(record.remaining)}</TableCell>
                          </TableRow>
                        ));

                      })()}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {(() => {
                  const records = filteredInvoices.flatMap(inv => {
                    const isDaily = inv.metadata?.invoiceType === "daily";
                    const isGroup = inv.metadata?.invoiceType === "group";
                    const meta = inv.metadata as any;

                    let taxi = 0;
                    let expensesArray: any[] = Array.isArray(inv.expenses) ? inv.expenses : [];
                    if (typeof inv.expenses === 'string') {
                      try { expensesArray = JSON.parse(inv.expenses); } catch (e) { }
                    }

                    if (Array.isArray(expensesArray)) {
                      const taxiExp = expensesArray.find((e: any) =>
                        e.name && String(e.name).toLowerCase().includes("taxi")
                      );
                      if (taxiExp) taxi = parseFloat(taxiExp.price || taxiExp.amount || "0");
                    }

                    if (taxi === 0) {
                      taxi = parseFloat(meta?.taxiFare || meta?.taxi || "0");
                    }

                    const materialsList = meta?.materials || [];
                    const materialsCost = materialsList.reduce((sum: number, m: any) => sum + parseFloat(m.price || "0"), 0) + parseFloat(meta?.materialPrice || "0");
                    const remainingAmount = parseFloat(meta?.remainingAmount || meta?.totalNet || inv.totalAmount);

                    if (isGroup && (meta?.employeePay)) {
                      const names = meta?.employeeNames || [];
                      return names.filter((name: string) => name.toLowerCase().includes(salaryEmployeeFilter.toLowerCase()));
                    } else {
                      const employeeName = meta?.employeeName || inv.cleaner?.name || "Employee";
                      if (!employeeName.toLowerCase().includes(salaryEmployeeFilter.toLowerCase())) return [];
                      return [employeeName];
                    }
                  });

                  const totalRecords = records.length;
                  const totalPages = Math.ceil(totalRecords / salaryItemsPerPage);

                  if (totalRecords === 0) return null;

                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t bg-gradient-to-r from-emerald-50/30 to-teal-50/30">
                      {/* Items per page selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 font-medium">{t("common.show")}:</span>
                        <Select
                          value={salaryItemsPerPage.toString()}
                          onValueChange={(value) => {
                            setSalaryItemsPerPage(Number(value));
                            setSalaryCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-600">
                          {t("common.of")} {totalRecords} {t("common.records")}
                        </span>
                      </div>

                      {/* Page navigation */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSalaryCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={salaryCurrentPage === 1}
                          className="h-9"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {t("common.previous")}
                        </Button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (salaryCurrentPage <= 3) {
                              pageNum = i + 1;
                            } else if (salaryCurrentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = salaryCurrentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={salaryCurrentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSalaryCurrentPage(pageNum)}
                                className={`h-9 w-9 p-0 ${salaryCurrentPage === pageNum
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'hover:bg-emerald-50'
                                  }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSalaryCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={salaryCurrentPage === totalPages}
                          className="h-9"
                        >
                          {t("common.next")}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>

                      {/* Page info */}
                      <div className="text-sm text-gray-600 font-medium">
                        {t("common.page")} {salaryCurrentPage} {t("common.of")} {totalPages}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50">
              <CardHeader className="border-b border-purple-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-purple-900">{t("accounting.materialsDetails") || "Materials"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                        <TableHead className="font-bold text-purple-900">{t("accounting.materialName")}</TableHead>
                        <TableHead className="font-bold text-purple-900">{t("accounting.invoiceId")}</TableHead>
                        <TableHead className="font-bold text-purple-900 text-right">{t("accounting.materialPrice")}</TableHead>
                        <TableHead className="font-bold text-purple-900">{t("common.date")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const materialRows = filteredInvoices.flatMap(inv => {
                          const meta = inv.metadata as any;
                          const arrayMaterials = meta?.materials || [];
                          const singleMaterialName = meta?.materialName;

                          const rows = arrayMaterials.map((m: any, idx: number) => ({
                            id: `${inv.id}-mat-${idx}`,
                            name: m.name,
                            price: m.price,
                            invoiceId: inv.id,
                            date: inv.createdAt
                          }));

                          if (rows.length === 0 && singleMaterialName) {
                            rows.push({
                              id: `${inv.id}-mat-single`,
                              name: singleMaterialName,
                              price: meta?.materialPrice || "0",
                              invoiceId: inv.id,
                              date: inv.createdAt
                            });
                          }

                          return rows;
                        });

                        if (materialRows.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                {t("accounting.noMaterialsFound")}
                              </TableCell>
                            </TableRow>
                          );
                        }

                        // Pagination logic
                        const totalRecords = materialRows.length;
                        const startIndex = (materialsCurrentPage - 1) * materialsItemsPerPage;
                        const endIndex = startIndex + materialsItemsPerPage;
                        const paginatedMaterials = materialRows.slice(startIndex, endIndex);

                        return paginatedMaterials.map((row, idx) => (
                          <TableRow
                            key={row.id}
                            className={`hover:bg-purple-50/50 transition-colors ${(startIndex + idx) % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            <TableCell className="font-semibold text-gray-900">{row.name}</TableCell>
                            <TableCell className="text-purple-700 font-bold">#{row.invoiceId}</TableCell>
                            <TableCell className="font-bold text-right text-purple-600">{formatCurrency(parseFloat(row.price || "0"))}</TableCell>
                            <TableCell className="text-gray-600">{format(new Date(row.date), "MMM d, yyyy")}</TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {(() => {
                  const materialRows = filteredInvoices.flatMap(inv => {
                    const meta = inv.metadata as any;
                    const arrayMaterials = meta?.materials || [];
                    const singleMaterialName = meta?.materialName;
                    const rows = arrayMaterials.map((m: any, idx: number) => ({ id: `${inv.id}-${idx}` }));
                    if (rows.length === 0 && singleMaterialName) rows.push({ id: `${inv.id}-single` });
                    return rows;
                  });

                  if (materialRows.length === 0) return null;

                  const totalPages = Math.ceil(materialRows.length / materialsItemsPerPage);

                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t bg-gradient-to-r from-purple-50/30 to-pink-50/30">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 font-medium">{t("common.show")}:</span>
                        <Select
                          value={materialsItemsPerPage.toString()}
                          onValueChange={(value) => {
                            setMaterialsItemsPerPage(Number(value));
                            setMaterialsCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-600">
                          {t("common.of")} {materialRows.length} {t("common.records")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMaterialsCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={materialsCurrentPage === 1}
                          className="h-9"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {t("common.previous")}
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (materialsCurrentPage <= 3) {
                              pageNum = i + 1;
                            } else if (materialsCurrentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = materialsCurrentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={materialsCurrentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMaterialsCurrentPage(pageNum)}
                                className={`h-9 w-9 p-0 ${materialsCurrentPage === pageNum
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'hover:bg-purple-50'
                                  }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMaterialsCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={materialsCurrentPage === totalPages}
                          className="h-9"
                        >
                          {t("common.next")}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>

                      <div className="text-sm text-gray-600 font-medium">
                        {t("common.page")} {materialsCurrentPage} {t("common.of")} {totalPages}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="border-b border-green-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-green-900">{t("accounting.revenueByService")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {Object.entries(revenueByService).length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">{t("accounting.noServiceRevenueData")}</p>
                    ) : (
                      Object.entries(revenueByService).map(([service, revenue]) => (
                        <div key={service} className="flex justify-between items-center p-3 rounded-lg bg-white/60 hover:bg-white/90 transition-colors shadow-sm">
                          <span className="text-sm font-semibold text-gray-800">{service}</span>
                          <span className="font-bold text-green-700">{formatCurrency(revenue)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="border-b border-blue-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-blue-900">{t("accounting.recentInvoices")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {filteredInvoices.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">{t("accounting.noInvoicesFound")}</p>
                    ) : (
                      filteredInvoices.slice((invoicesCurrentPage - 1) * invoicesItemsPerPage, invoicesCurrentPage * invoicesItemsPerPage).map((invoice) => (
                        <div key={invoice.id} className="flex justify-between items-center p-3 rounded-lg bg-white/60 hover:bg-white/90 transition-colors shadow-sm">
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{invoice.customerName}</div>
                            <div className="text-xs text-blue-600/70 font-medium mt-0.5">
                              {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                            </div>
                          </div>
                          <span className="font-bold text-blue-700">{formatCurrency(parseFloat(invoice.totalAmount))}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {filteredInvoices.length > 0 && (() => {
                    const totalPages = Math.ceil(filteredInvoices.length / invoicesItemsPerPage);
                    return (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{t("common.show")}:</span>
                          <Select value={invoicesItemsPerPage.toString()} onValueChange={(v) => { setInvoicesItemsPerPage(Number(v)); setInvoicesCurrentPage(1); }}>
                            <SelectTrigger className="w-16 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-gray-500">{t("common.of")} {filteredInvoices.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => setInvoicesCurrentPage(p => Math.max(1, p - 1))} disabled={invoicesCurrentPage === 1} className="h-8 px-2">
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (invoicesCurrentPage <= 3) pageNum = i + 1;
                            else if (invoicesCurrentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = invoicesCurrentPage - 2 + i;
                            return (
                              <Button key={pageNum} variant={invoicesCurrentPage === pageNum ? "default" : "outline"} size="sm"
                                onClick={() => setInvoicesCurrentPage(pageNum)}
                                className={`h-8 w-8 p-0 text-xs ${invoicesCurrentPage === pageNum ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'hover:bg-blue-50'}`}>
                                {pageNum}
                              </Button>
                            );
                          })}
                          <Button variant="outline" size="sm" onClick={() => setInvoicesCurrentPage(p => Math.min(totalPages, p + 1))} disabled={invoicesCurrentPage === totalPages} className="h-8 px-2">
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-gray-500">{t("common.page")} {invoicesCurrentPage} {t("common.of")} {totalPages}</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoiceDetails" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
              <CardHeader className="border-b border-blue-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-blue-900">{t("accounting.allInvoices")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                        <TableHead className="font-bold text-blue-900">{t("accounting.invoiceId")}</TableHead>
                        <TableHead className="font-bold text-blue-900">{t("accounting.customerName")}</TableHead>
                        <TableHead className="font-bold text-blue-900">{t("accounting.cleaner")}</TableHead>
                        <TableHead className="font-bold text-blue-900">{t("accounting.services")}</TableHead>
                        <TableHead className="font-bold text-blue-900 text-right">{t("accounting.totalAmount")}</TableHead>
                        <TableHead className="font-bold text-blue-900">{t("accounting.date")}</TableHead>
                        <TableHead className="font-bold text-blue-900">{t("accounting.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        if (filteredInvoices.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                {t("accounting.noInvoicesFound")}
                              </TableCell>
                            </TableRow>
                          );
                        }

                        const totalRecords = filteredInvoices.length;
                        const startIndex = (invoiceDetailsCurrentPage - 1) * invoiceDetailsItemsPerPage;
                        const endIndex = startIndex + invoiceDetailsItemsPerPage;
                        const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

                        return paginatedInvoices.map((invoice, idx) => (
                          <TableRow
                            key={invoice.id}
                            className={`hover:bg-blue-50/50 transition-colors ${(startIndex + idx) % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            <TableCell className="font-bold text-blue-700">#{invoice.id}</TableCell>
                            <TableCell className="font-semibold">{invoice.customerName}</TableCell>
                            <TableCell>{invoice.cleaner?.name || t("accounting.unknown")}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {invoice.services.map((service) => (
                                  <div key={service.id}>{service.name}</div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              {formatCurrency(parseFloat(invoice.totalAmount))}
                            </TableCell>
                            <TableCell>{format(new Date(invoice.createdAt), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              <Badge variant={invoice.status === "completed" ? "default" : "secondary"}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {filteredInvoices.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t bg-gradient-to-r from-blue-50/30 to-indigo-50/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 font-medium">{t("common.show")}:</span>
                      <Select
                        value={invoiceDetailsItemsPerPage.toString()}
                        onValueChange={(value) => {
                          setInvoiceDetailsItemsPerPage(Number(value));
                          setInvoiceDetailsCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">
                        {t("common.of")} {filteredInvoices.length} {t("common.records")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInvoiceDetailsCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={invoiceDetailsCurrentPage === 1}
                        className="h-9"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {t("common.previous")}
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, Math.ceil(filteredInvoices.length / invoiceDetailsItemsPerPage)) }, (_, i) => {
                          const totalPages = Math.ceil(filteredInvoices.length / invoiceDetailsItemsPerPage);
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (invoiceDetailsCurrentPage <= 3) {
                            pageNum = i + 1;
                          } else if (invoiceDetailsCurrentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = invoiceDetailsCurrentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={invoiceDetailsCurrentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setInvoiceDetailsCurrentPage(pageNum)}
                              className={`h-9 w-9 p-0 ${invoiceDetailsCurrentPage === pageNum
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'hover:bg-blue-50'
                                }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInvoiceDetailsCurrentPage(prev => Math.min(Math.ceil(filteredInvoices.length / invoiceDetailsItemsPerPage), prev + 1))}
                        disabled={invoiceDetailsCurrentPage === Math.ceil(filteredInvoices.length / invoiceDetailsItemsPerPage)}
                        className="h-9"
                      >
                        {t("common.next")}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    <div className="text-sm text-gray-600 font-medium">
                      {t("common.page")} {invoiceDetailsCurrentPage} {t("common.of")} {Math.ceil(filteredInvoices.length / invoiceDetailsItemsPerPage)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
                <CardHeader className="border-b border-red-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-red-900">{t("accounting.expensesByCategory")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {Object.entries(expensesByCategory).length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">{t("accounting.noExpenseData")}</p>
                    ) : (
                      Object.entries(expensesByCategory).map(([category, amount]) => (
                        <div key={category} className="flex justify-between items-center p-3 rounded-lg bg-white/60 hover:bg-white/90 transition-colors shadow-sm">
                          <span className="text-sm font-semibold text-gray-800">{category}</span>
                          <span className="font-bold text-red-700">{formatCurrency(amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                <CardHeader className="border-b border-orange-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-orange-900">{t("accounting.recentExpenses")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {filteredExpenses.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">{t("accounting.noExpensesFound")}</p>
                    ) : (
                      filteredExpenses.slice((expensesCurrentPage - 1) * expensesItemsPerPage, expensesCurrentPage * expensesItemsPerPage).map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-3 rounded-lg bg-white/60 hover:bg-white/90 transition-colors shadow-sm">
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{expense.description}</div>
                            <div className="text-xs text-orange-600/70 font-medium mt-0.5">
                              {format(new Date(expense.date), "MMM d, yyyy")} • {expense.category}
                            </div>
                          </div>
                          <span className="font-bold text-red-700">{formatCurrency(parseFloat(expense.amount))}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {filteredExpenses.length > 0 && (() => {
                    const totalPages = Math.ceil(filteredExpenses.length / expensesItemsPerPage);
                    return (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{t("common.show")}:</span>
                          <Select value={expensesItemsPerPage.toString()} onValueChange={(v) => { setExpensesItemsPerPage(Number(v)); setExpensesCurrentPage(1); }}>
                            <SelectTrigger className="w-16 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-gray-500">{t("common.of")} {filteredExpenses.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => setExpensesCurrentPage(p => Math.max(1, p - 1))} disabled={expensesCurrentPage === 1} className="h-8 px-2">
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (expensesCurrentPage <= 3) pageNum = i + 1;
                            else if (expensesCurrentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = expensesCurrentPage - 2 + i;
                            return (
                              <Button key={pageNum} variant={expensesCurrentPage === pageNum ? "default" : "outline"} size="sm"
                                onClick={() => setExpensesCurrentPage(pageNum)}
                                className={`h-8 w-8 p-0 text-xs ${expensesCurrentPage === pageNum ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'hover:bg-orange-50'}`}>
                                {pageNum}
                              </Button>
                            );
                          })}
                          <Button variant="outline" size="sm" onClick={() => setExpensesCurrentPage(p => Math.min(totalPages, p + 1))} disabled={expensesCurrentPage === totalPages} className="h-8 px-2">
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-gray-500">{t("common.page")} {expensesCurrentPage} {t("common.of")} {totalPages}</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
              <CardHeader className="border-b border-cyan-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-cyan-900">{t("accounting.financialStatements")}</CardTitle>
                    <p className="text-xs text-cyan-700 mt-1">{t("accounting.incomeStatement")}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-hidden rounded-xl border border-cyan-100 bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-cyan-100 to-teal-100 border-b-2 border-cyan-200 hover:from-cyan-100 hover:to-teal-100">
                        <TableHead className="font-bold text-cyan-900 text-base">{t("accounting.account")}</TableHead>
                        <TableHead className="text-right font-bold text-cyan-900 text-base">{t("accounting.amount")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-green-50/50 transition-colors">
                        <TableCell className="font-bold text-gray-900 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            {t("accounting.totalRevenue")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-bold text-lg">{formatCurrency(totalRevenue)}</TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-amber-50/50 transition-colors bg-gray-50/30">
                        <TableCell className="pl-8 text-gray-700 font-medium py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600">−</span>
                            {t("accounting.employeeDailySalary")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-amber-600 font-semibold">({formatCurrency(totalDailySalaries)})</TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-orange-50/50 transition-colors">
                        <TableCell className="pl-8 text-gray-700 font-medium py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-orange-600">−</span>
                            {t("accounting.taxiExpenses")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-orange-600 font-semibold">({formatCurrency(totalTaxiExpenses)})</TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-red-50/50 transition-colors bg-gray-50/30">
                        <TableCell className="pl-8 text-gray-700 font-medium py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-red-600">−</span>
                            {t("accounting.otherExpensesLabel")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-semibold">({formatCurrency(totalExpenses)})</TableCell>
                      </TableRow>
                      {unpaidDebts > 0 && (
                        <TableRow className="hover:bg-pink-50/50 transition-colors">
                          <TableCell className="pl-8 text-gray-700 font-medium py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-pink-600">−</span>
                              Credit Sales — Uncollected (Receivable)
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-pink-600 font-semibold">({formatCurrency(unpaidDebts)})</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="border-t-2 border-cyan-300 bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 transition-colors">
                        <TableCell className="font-bold text-gray-900 py-5 text-base">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${remainingAmount >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                            Cash Balance (Collected)
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-bold text-2xl py-5 ${remainingAmount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatCurrency(remainingAmount)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">{t("accounting.totalRevenueLabel")}</p>
                    <p className="text-xl font-bold text-green-800">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 border border-red-200">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">{t("accounting.totalExpensesLabel")}</p>
                    <p className="text-xl font-bold text-red-800">{formatCurrency(totalDailySalaries + totalTaxiExpenses + totalExpenses + unpaidDebts)}</p>
                  </div>
                  <div className={`p-4 rounded-xl bg-gradient-to-br border ${remainingAmount >= 0 ? 'from-blue-100 to-cyan-100 border-blue-200' : 'from-red-100 to-rose-100 border-red-200'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${remainingAmount >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Cash Balance</p>
                    <p className={`text-xl font-bold ${remainingAmount >= 0 ? 'text-blue-800' : 'text-red-800'}`}>{formatCurrency(remainingAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}