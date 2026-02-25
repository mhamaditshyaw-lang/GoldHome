import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, DollarSign, Receipt, Trash2, Edit, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";

interface Expense {
  id: number;
  description: string;
  amount: string;
  category: string;
  date: string;
  receipt?: string;
  userId: number;
}

type ExpenseFormData = {
  description: string;
  amount: string;
  category: string;
  date: string;
  receipt?: string;
};

export default function Expenses() {
  const { t } = useLanguage();
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("expenses")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  const expenseSchema = z.object({
    description: z.string().min(1, t('expenses.descriptionRequired')),
    amount: z.string().min(1, t('expenses.amountRequired')),
    category: z.string().min(1, t('expenses.categoryRequired')),
    date: z.string().min(1, t('expenses.dateRequired')),
    receipt: z.string().optional(),
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: format(new Date(), "yyyy-MM-dd"),
      receipt: "",
    },
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    staleTime: 5 * 60 * 1000,
    refetchInterval: false,
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: t('expenses.success'),
        description: t('expenses.expenseAddedSuccess'),
      });
      setShowExpenseDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t('expenses.error'),
        description: error instanceof Error ? error.message : t('expenses.failedToAddExpense'),
        variant: "destructive",
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      if (!editingExpense) throw new Error("No expense to update");
      return apiRequest("PATCH", `/api/expenses/${editingExpense.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: t('expenses.success'),
        description: t('expenses.expenseUpdatedSuccess'),
      });
      setShowExpenseDialog(false);
      setEditingExpense(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t('expenses.error'),
        description: error instanceof Error ? error.message : t('expenses.failedToUpdateExpense'),
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: t('expenses.success'),
        description: t('expenses.expenseDeletedSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('expenses.error'),
        description: error instanceof Error ? error.message : t('expenses.failedToDeleteExpense'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ExpenseFormData) => {
    if (editingExpense) {
      updateExpenseMutation.mutate(data);
    } else {
      addExpenseMutation.mutate(data);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.reset({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      receipt: expense.receipt || "",
    });
    setShowExpenseDialog(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm(t('expenses.confirmDelete'))) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const openAddDialog = () => {
    setEditingExpense(null);
    form.reset({
      description: "",
      amount: "",
      category: "",
      date: format(new Date(), "yyyy-MM-dd"),
      receipt: "",
    });
    setShowExpenseDialog(true);
  };

  const filteredExpenses = expenses.filter(expense => 
    categoryFilter === "all" || expense.category === categoryFilter
  );

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('expenses.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('expenses.subtitle')}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('expenses.addExpense')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? t('expenses.editExpense') : t('expenses.addNewExpense')}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('expenses.description')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('expenses.descriptionPlaceholder')} {...field} />
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
                          <FormLabel>{t('expenses.amount')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder={t('expenses.amountPlaceholder')}
                              {...field}
                            />
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
                          <FormLabel>{t('expenses.category')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('expenses.categoryPlaceholder')} {...field} />
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
                          <FormLabel>{t('expenses.date')}</FormLabel>
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
                          <FormLabel>{t('expenses.receiptNotes')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('expenses.receiptNotesPlaceholder')}
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowExpenseDialog(false)}
                      >
                        {t('expenses.cancel')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={addExpenseMutation.isPending || updateExpenseMutation.isPending}
                      >
                        {editingExpense ? t('expenses.update') : t('expenses.add')} {t('expenses.addExpenseButton').split(' ')[1]}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {t('expenses.totalExpenses')}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(totalExpenses)}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Receipt className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {t('expenses.totalRecords')}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {filteredExpenses.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {t('expenses.thisMonth')}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {filteredExpenses.filter(expense => 
                        new Date(expense.date).getMonth() === new Date().getMonth()
                      ).length} {t('expenses.expenses')}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  {t('expenses.filterByCategory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('expenses.allCategories')}</SelectItem>
                    {Array.from(new Set(expenses.map(expense => expense.category))).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('expenses.expensesByCategory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(expensesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{category}</span>
                      <Badge variant="secondary" className="text-red-600">
                        {formatCurrency(amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('expenses.allExpenses')}</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <div className="text-center py-4">{t('expenses.loadingExpenses')}</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('expenses.noExpensesFound')}</h3>
                <p className="text-gray-500 mb-4">
                  {categoryFilter === "all" 
                    ? t('expenses.getStartedMessage')
                    : t('expenses.noCategoryExpenses', { category: categoryFilter })
                  }
                </p>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('expenses.addFirstExpense')}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('expenses.date')}</TableHead>
                    <TableHead>{t('expenses.description')}</TableHead>
                    <TableHead>{t('expenses.category')}</TableHead>
                    <TableHead className="text-right">{t('expenses.amount')}</TableHead>
                    <TableHead className="text-right">{t('expenses.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(parseFloat(expense.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-700"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}