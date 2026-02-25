import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CreditCard, Plus, Trash2, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";

const createDebtSchema = (t: any) => z.object({
  creditorName: z.string().min(1, t("debt.creditorName")),
  amount: z.string().min(1, t("debt.amount")).refine((val) => !isNaN(parseFloat(val)), t("debt.amountRequired")),
  description: z.string().optional(),
  dueDate: z.string().min(1, t("debt.dueDate")),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string().min(1, t("debt.category")),
});

type DebtFormData = {
  creditorName: string;
  amount: string;
  description?: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  category: string;
};

interface Debt {
  id: number;
  creditorName: string;
  amount: string;
  description?: string | null;
  dueDate: string;
  priority: "low" | "medium" | "high";
  category: string;
  status: "pending" | "paid";
  createdAt: string;
  updatedAt: string;
  userId: number;
}

function DebtCard({ debt, onMarkPaid, onDelete, isPending }: {
  debt: Debt;
  onMarkPaid: (debt: Debt) => void;
  onDelete: (id: number) => void;
  isPending: boolean;
}) {
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors" data-testid={`debt-record-${debt.id}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-lg">{debt.creditorName}</h4>
            <Badge className={getPriorityColor(debt.priority)}>
              {t(`debt.priority.${debt.priority}`)}
            </Badge>
            <Badge className={getStatusColor(debt.status)}>
              {t(`debt.status.${debt.status}`)}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">{t("debt.amount")}: </span>
              <span className="font-semibold text-gray-900">{formatCurrency(parseFloat(debt.amount))}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">{t("debt.category")}: </span>
              <span>{debt.category}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">{t("debt.dueDate")}: </span>
              <span>{format(new Date(debt.dueDate), "MMM d, yyyy")}</span>
            </div>
          </div>
          {debt.description && (
            <p className="text-sm text-gray-600 mt-2">{debt.description}</p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          {debt.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkPaid(debt)}
              disabled={isPending}
              data-testid={`button-mark-paid-${debt.id}`}
            >
              {t("debt.markPaid")}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(debt.id)}
            disabled={isPending}
            data-testid={`button-delete-${debt.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DebtManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("debt")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  const { data: debts = [], isLoading } = useQuery<Debt[]>({
    queryKey: ["/api/debts"],
  });

  const form = useForm<DebtFormData>({
    resolver: zodResolver(createDebtSchema(t)),
    defaultValues: {
      creditorName: "",
      amount: "",
      description: "",
      dueDate: "",
      priority: "medium",
      category: "",
    },
  });

  const createDebtMutation = useMutation({
    mutationFn: async (data: DebtFormData) => {
      const response = await apiRequest("POST", "/api/debts", {
        ...data,
        amount: parseFloat(data.amount).toFixed(2),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: t("toast.success"),
        description: t("debt.createdSuccess"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async ({ debtId, paymentAmount, notes }: { debtId: number; paymentAmount: number; notes?: string }) => {
      const debt = debts.find(d => d.id === debtId);
      if (!debt) throw new Error("Debt not found");

      const currentAmount = parseFloat(debt.amount);
      const remainingAmount = currentAmount - paymentAmount;

      // First, record the payment in payment history
      await apiRequest("POST", `/api/debts/${debtId}/payments`, {
        amount: paymentAmount.toFixed(2),
        remainingBalance: Math.max(0, remainingAmount).toFixed(2),
        notes: notes || null
      });

      // Then update the debt record
      if (remainingAmount <= 0) {
        const response = await apiRequest("PATCH", `/api/debts/${debtId}`, {
          status: "paid",
          amount: "0"
        });
        return response.json();
      } else {
        // Partial payment - update remaining amount
        const response = await apiRequest("PATCH", `/api/debts/${debtId}`, {
          amount: remainingAmount.toFixed(2),
        });
        return response.json();
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/debts", variables.debtId, "payments"] });
      const debt = debts.find(d => d.id === variables.debtId);
      const currentAmount = parseFloat(debt?.amount || "0");
      const remainingAmount = currentAmount - variables.paymentAmount;

      setShowPaymentDialog(false);
      setPaymentAmount("");
      setPaymentNotes("");
      setSelectedDebt(null);

      toast({
        title: t("toast.success"),
        description: remainingAmount <= 0
          ? t("debt.fullyPaidSuccess")
          : t("debt.partialPaymentSuccess", { remaining: formatCurrency(remainingAmount) }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDebtMutation = useMutation({
    mutationFn: async (debtId: number) => {
      const response = await apiRequest("DELETE", `/api/debts/${debtId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      toast({
        title: t("toast.success"),
        description: t("debt.deletedSuccess"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DebtFormData) => {
    createDebtMutation.mutate(data);
  };

  const handleMarkPaid = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.amount); // Default to full amount
    setPaymentNotes("");
    setShowPaymentDialog(true);
  };

  const handleProcessPayment = () => {
    if (!selectedDebt) return;

    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment <= 0) {
      toast({
        title: t("toast.error"),
        description: t("debt.invalidPaymentAmount"),
        variant: "destructive",
      });
      return;
    }

    const currentAmount = parseFloat(selectedDebt.amount);
    if (payment > currentAmount) {
      toast({
        title: t("toast.error"),
        description: t("debt.paymentExceedsAmount"),
        variant: "destructive",
      });
      return;
    }

    processPaymentMutation.mutate({
      debtId: selectedDebt.id,
      paymentAmount: payment,
      notes: paymentNotes.trim() || undefined
    });
  };

  const handleDelete = (debtId: number) => {
    if (confirm(t("debt.confirmDelete"))) {
      deleteDebtMutation.mutate(debtId);
    }
  };

  const filteredDebts = debts.filter(debt => {
    const statusMatch = filterStatus === "all" || debt.status === filterStatus;
    const priorityMatch = filterPriority === "all" || debt.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const totalDebt = debts
    .filter(debt => debt.status === "pending")
    .reduce((sum, debt) => sum + parseFloat(debt.amount), 0);

  const highPriorityDebts = debts.filter(debt => debt.priority === "high" && debt.status === "pending").length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t("debt.title")}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-2">
                {t("debt.subtitle")}
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("debt.addDebt")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("debt.addDebtFormTitle")}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="creditorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("debt.creditorName")}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-creditor-name" />
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
                          <FormLabel>{t("debt.amount")}</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} data-testid="input-amount" />
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
                          <FormLabel>{t("debt.category")}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t("debt.categoryPlaceholder")} data-testid="input-category" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("debt.dueDate")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-due-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("debt.priority")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-priority">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{t("debt.priority.low")}</SelectItem>
                              <SelectItem value="medium">{t("debt.priority.medium")}</SelectItem>
                              <SelectItem value="high">{t("debt.priority.high")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("debt.description")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="textarea-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={createDebtMutation.isPending} data-testid="button-submit-debt">
                        {createDebtMutation.isPending ? t("debt.addingDebt") : t("debt.addDebt")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddDialog(false)}
                        data-testid="button-cancel-debt"
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("debt.processPaymentTitle")}</DialogTitle>
            </DialogHeader>
            {selectedDebt && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t("debt.creditor")}</p>
                  <p className="font-semibold text-lg">{selectedDebt.creditorName}</p>
                  <p className="text-sm text-gray-600 mt-2">{t("debt.totalOutstanding")}</p>
                  <p className="font-bold text-2xl text-red-600">{formatCurrency(parseFloat(selectedDebt.amount))}</p>
                </div>

                <div>
                  <Label htmlFor="payment-amount">{t("debt.paymentAmount")}</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={t("debt.paymentAmountPlaceholder")}
                    data-testid="input-payment-amount"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t("debt.balanceAfter")}: {formatCurrency(Math.max(0, parseFloat(selectedDebt.amount) - parseFloat(paymentAmount || "0")))}
                  </p>
                </div>

                <div>
                  <Label htmlFor="payment-notes">{t("debt.paymentNotes")}</Label>
                  <Textarea
                    id="payment-notes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder={t("debt.paymentNotesPlaceholder")}
                    data-testid="textarea-payment-notes"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleProcessPayment}
                    disabled={processPaymentMutation.isPending}
                    className="flex-1"
                    data-testid="button-process-payment"
                  >
                    {processPaymentMutation.isPending ? t("debt.processingPayment") : t("debt.processPayment")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPaymentDialog(false);
                      setPaymentAmount("");
                      setPaymentNotes("");
                      setSelectedDebt(null);
                    }}
                    data-testid="button-cancel-payment"
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t("debt.totalOutstandingDebt")}</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t("debt.highPriorityDebts")}</p>
                  <p className="text-2xl font-bold text-orange-600">{highPriorityDebts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t("debt.totalDebtRecords")}</p>
                  <p className="text-2xl font-bold text-blue-600">{debts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="status-filter">{t("debt.filterStatus")}</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger data-testid="filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("debt.filterAllStatuses")}</SelectItem>
                    <SelectItem value="pending">{t("debt.status.pending")}</SelectItem>
                    <SelectItem value="paid">{t("debt.status.paid")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="priority-filter">{t("debt.filterPriority")}</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger data-testid="filter-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("debt.filterAllPriorities")}</SelectItem>
                    <SelectItem value="high">{t("debt.priority.high")}</SelectItem>
                    <SelectItem value="medium">{t("debt.priority.medium")}</SelectItem>
                    <SelectItem value="low">{t("debt.priority.low")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debt List */}
        <Card>
          <CardHeader>
            <CardTitle>{t("debt.debtRecords")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredDebts.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("debt.noDebtRecordsFound")}</h3>
                <p className="text-gray-600">{t("debt.addFirstDebtRecord")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDebts.map((debt) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    onMarkPaid={handleMarkPaid}
                    onDelete={handleDelete}
                    isPending={processPaymentMutation.isPending || deleteDebtMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}