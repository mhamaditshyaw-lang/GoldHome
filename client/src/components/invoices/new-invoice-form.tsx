import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, User, Calendar, Clock, Plus, Trash2 } from "lucide-react";
import { ButtonLoader } from "@/components/ui/loading-animations";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service } from "@shared/schema";
import { cn } from "@/lib/utils";

// Schema for Daily Employee
const dailyEmployeeSchema = z.object({
  type: z.literal("daily"),
  customerName: z.string().min(1, "Customer name is required"),
  employeeName: z.string().min(1, "Employee name is required"),
  address: z.string().min(1, "Address is required"),
  flatNumber: z.string().optional(),
  numberOfCustomers: z.string().min(1, "Number of customers is required"),
  date: z.string().min(1, "Date is required"),
  startingTime: z.string().min(1, "Starting time is required"),
  finishingTime: z.string().min(1, "Finishing time is required"),
  cleaningMaterialsOrdered: z.boolean().default(false),
  services: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.string(),
    quantity: z.number(),
  })).min(1, "At least one service is required"),
  extraTime: z.string().optional().default("0"),
  department: z.string().optional(),
  dailySalary: z.string().min(1, "Daily salary is required"),
  taxiFare: z.string().default("0"),
  materials: z.array(z.object({
    name: z.string(),
    price: z.string(),
  })).default([]),
  remainingAmount: z.string(),
  totalAmount: z.string(),
});

// Schema for Group Employee
const groupEmployeeSchema = z.object({
  type: z.literal("group"),
  groupName: z.string().min(1, "Group name is required"),
  address: z.string().min(1, "Address is required"),
  numberOfCustomers: z.string().default("0"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  maleCount: z.string().default("0"),
  femaleCount: z.string().default("0"),
  employees: z.array(z.object({
    name: z.string().min(1, "Employee name is required"),
    salary: z.string().min(1, "Salary is required"),
  })).min(1, "At least one employee is required"),
  startingHr: z.string().min(1, "Starting hour is required"),
  endHr: z.string().min(1, "End hour is required"),
  foodExpense: z.string().default("0"),
  workDuration: z.string().min(1, "Work duration is required"),
  extraTimeHr: z.string().default("0"),
  services: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.string(),
    quantity: z.number(),
  })).min(1, "At least one service is required"),
  amountReceived: z.string().min(1, "Amount received is required"),
  employeePay: z.string().min(1, "Employee pay is required"),
  taxiFare: z.string().default("0"),
  cleaningMaterialsOrdered: z.boolean().default(false),
  materials: z.array(z.object({
    name: z.string(),
    price: z.string(),
  })).default([]),
  totalNet: z.string().default("0"),
  notes: z.string().optional(),
});

type DailyEmployeeData = z.infer<typeof dailyEmployeeSchema>;
type GroupEmployeeData = z.infer<typeof groupEmployeeSchema>;
type InvoiceFormData = DailyEmployeeData | GroupEmployeeData;

interface InvoiceFormProps {
  onClose: () => void;
}

export default function NewInvoiceForm({ onClose }: InvoiceFormProps) {
  const [invoiceType, setInvoiceType] = useState<"daily" | "group" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedAttemptedGroup, setIsSubmittedAttemptedGroup] = useState(false);
  const [isSubmittedAttemptedDaily, setIsSubmittedAttemptedDaily] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authManager.getState().user;
  const { formatCurrency } = useCurrency();
  const { t, language } = useLanguage();

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Daily Employee Form
  const dailyForm = useForm<DailyEmployeeData>({
    resolver: zodResolver(dailyEmployeeSchema),
    mode: "onChange",
    defaultValues: {
      type: "daily",
      customerName: "",
      employeeName: "",
      address: "",
      flatNumber: "",
      numberOfCustomers: "",
      date: new Date().toISOString().split('T')[0],
      startingTime: "",
      finishingTime: "",
      cleaningMaterialsOrdered: false,
      services: [{ id: 0, name: "", price: "0", quantity: 1 }],
      extraTime: "0",
      department: "",
      dailySalary: "",
      taxiFare: "0",
      materials: [],
      remainingAmount: "0",
      totalAmount: "0",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: dailyForm.control,
    name: "services",
  });

  // Group Employee Form
  const groupForm = useForm<GroupEmployeeData>({
    resolver: zodResolver(groupEmployeeSchema),
    mode: "onChange",
    defaultValues: {
      type: "group",
      groupName: "",
      address: "",
      numberOfCustomers: "0",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      maleCount: "0",
      femaleCount: "0",
      employees: [{ name: "", salary: "" }],
      startingHr: "",
      endHr: "",
      foodExpense: "0",
      workDuration: "",
      extraTimeHr: "0",
      services: [{ id: 0, name: "", price: "0", quantity: 1 }],
      amountReceived: "0",
      employeePay: "0",
      taxiFare: "0",
      cleaningMaterialsOrdered: false,
      materials: [],
      totalNet: "0",
      notes: "",
    },
  });

  const { fields: groupServiceFields, append: groupServiceAppend, remove: groupServiceRemove } = useFieldArray({
    control: groupForm.control,
    name: "services",
  });

  const { fields: dailyMaterialFields, append: dailyMaterialAppend, remove: dailyMaterialRemove } = useFieldArray({
    control: dailyForm.control,
    name: "materials",
  });

  const { fields: groupMaterialFields, append: groupMaterialAppend, remove: groupMaterialRemove } = useFieldArray({
    control: groupForm.control,
    name: "materials",
  });

  // Reset form when language changes
  useEffect(() => {
    setInvoiceType(null);
  }, [language]);

  // Calculate Group Total Net
  const calculateGroupNet = () => {
    const groupServicesList = groupForm.getValues("services") || [];
    const received = groupServicesList.reduce((sum, s) => sum + (parseFloat(s.price || "0") * (s.quantity || 1)), 0);

    // Update amount received automatically based on services
    groupForm.setValue("amountReceived", received.toFixed(2));

    const food = parseFloat(groupForm.getValues("foodExpense") || "0");
    const taxi = parseFloat(groupForm.getValues("taxiFare") || "0");
    const materialsList = groupForm.getValues("materials") || [];
    const totalMaterials = materialsList.reduce((sum, m) => sum + parseFloat(m.price || "0"), 0);
    const employees = groupForm.getValues("employees") || [];
    const numEmployees = employees.length;

    // Total employee pay = sum of all individual salaries
    const totalEmployeePay = employees.reduce((sum, emp) => sum + parseFloat(emp.salary || "0"), 0);
    const net = received - food - taxi - totalMaterials - totalEmployeePay;

    groupForm.setValue("totalNet", net.toFixed(2));
  };

  // Calculate remaining amount for daily employee
  const calculateRemaining = () => {
    const servicesList = dailyForm.getValues("services") || [];
    const totalAmount = servicesList.reduce((sum, s) => sum + (parseFloat(s.price || "0") * (s.quantity || 1)), 0);
    const dailySalary = parseFloat(dailyForm.getValues("dailySalary") || "0");
    const taxiFare = parseFloat(dailyForm.getValues("taxiFare") || "0");
    const materialsList = dailyForm.getValues("materials") || [];
    const totalMaterials = materialsList.reduce((sum, m) => sum + parseFloat(m.price || "0"), 0);
    const remaining = totalAmount - dailySalary - taxiFare - totalMaterials;
    dailyForm.setValue("remainingAmount", remaining.toFixed(2));
    dailyForm.setValue("totalAmount", totalAmount.toFixed(2));
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      setIsSubmitting(true);

      let payload: any = {
        type: data.type,
        cleanerId: user?.id || 1,
        status: "completed",
      };

      if (data.type === "daily") {
        const dailyData = data as DailyEmployeeData;
        const totalAmount = parseFloat(dailyData.totalAmount || "0");
        const salary = parseFloat(dailyData.dailySalary || "0");
        const taxi = parseFloat(dailyData.taxiFare || "0");
        const remaining = totalAmount - salary - taxi;

        payload = {
          ...payload,
          createdAt: dailyData.date,
          customerName: dailyData.customerName,
          services: dailyData.services,
          expenses: [
            {
              id: 1,
              name: "Daily Salary",
              price: salary.toString(),
            },
            {
              id: 2,
              name: "Taxi Fare",
              price: taxi.toString(),
            },
          ],
          totalAmount: totalAmount.toFixed(2),
          notes: `Address: ${dailyData.address}${dailyData.flatNumber ? ', ' + dailyData.flatNumber : ''}\nCustomers: ${dailyData.numberOfCustomers}${dailyData.department ? ', Dept: ' + dailyData.department : ''}, Extra Time: ${dailyData.extraTime || "0"}, Materials Ordered: ${dailyData.cleaningMaterialsOrdered ? "Yes" : "No"}`,
          metadata: {
            invoiceType: "daily",
            employeeName: dailyData.employeeName,
            numberOfCustomers: dailyData.numberOfCustomers,
            startingTime: dailyData.startingTime,
            finishingTime: dailyData.finishingTime,
            cleaningMaterialsOrdered: dailyData.cleaningMaterialsOrdered,
            extraTime: dailyData.extraTime || "0",
            department: dailyData.department,
            dailySalary: salary.toFixed(2),
            taxiFare: taxi.toFixed(2),
            materials: dailyData.materials || [],
            remainingAmount: (remaining - (dailyData.materials || []).reduce((sum, m) => sum + parseFloat(m.price || "0"), 0)).toFixed(2),
          },
        };
      } else {
        const groupData = data as GroupEmployeeData;
        const totalAmount = groupData.services.reduce((sum, s) => sum + (parseFloat(s.price || "0") * (s.quantity || 1)), 0);
        const totalNet = parseFloat(groupData.totalNet || "0");
        const numEmployees = groupData.employees.length;
        const totalEmployeePay = groupData.employees.reduce((sum, emp) => sum + parseFloat(emp.salary || "0"), 0);
        const employeeNames = groupData.employees.map(emp => emp.name);
        const employeeSalaries = groupData.employees.reduce((acc, emp) => {
          acc[emp.name] = emp.salary;
          return acc;
        }, {} as Record<string, string>);

        payload = {
          ...payload,
          createdAt: groupData.startDate,
          customerName: groupData.groupName,
          services: groupData.services,
          expenses: [
            { id: 1, name: `Employee Pay (${numEmployees} staff)`, price: totalEmployeePay.toString() },
            { id: 2, name: "Food Expense", price: groupData.foodExpense },
            { id: 3, name: "Taxi Fare", price: groupData.taxiFare },
            { id: 4, name: "Materials", price: (groupData.materials || []).reduce((sum, m) => sum + parseFloat(m.price || "0"), 0).toString() },
          ],
          totalAmount: totalAmount.toFixed(2),
          notes: `Address: ${groupData.address}\nCustomers: ${groupData.numberOfCustomers || "0"}\nEmployees: ${employeeNames.join(", ")}\nDuration: ${groupData.workDuration} hrs, Extra: ${groupData.extraTimeHr} hrs\nTotal Employee Pay: ${totalEmployeePay.toFixed(2)}\nNet Profit: ${totalNet.toFixed(2)}`,
          metadata: {
            invoiceType: "group",
            address: groupData.address,
            numberOfCustomers: groupData.numberOfCustomers,
            startDate: groupData.startDate,
            endDate: groupData.endDate,
            maleCount: groupData.maleCount,
            femaleCount: groupData.femaleCount,
            employees: groupData.employees,
            employeeNames: employeeNames,
            employeeSalaries: employeeSalaries,
            startingHr: groupData.startingHr,
            endHr: groupData.endHr,
            foodExpense: groupData.foodExpense,
            workDuration: groupData.workDuration,
            extraTimeHr: groupData.extraTimeHr,
            amountReceived: totalAmount.toFixed(2),
            employeePay: groupData.employeePay, // Individual daily pay
            totalEmployeePay: totalEmployeePay.toFixed(2),
            taxiFare: groupData.taxiFare,
            cleaningMaterialsOrdered: groupData.cleaningMaterialsOrdered,
            materials: groupData.materials || [],
            remainingAmount: totalNet.toFixed(2),
          },
        };
      }

      const response = await apiRequest("POST", "/api/invoices", payload);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      toast({
        title: t("invoices.invoiceSuccess"),
        description: t("invoices.newInvoice.invoiceSuccessMessage"),
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: t("invoices.invoiceError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitDaily = (data: DailyEmployeeData) => {
    setIsSubmittedAttemptedDaily(true);
    const errors = dailyForm.formState.errors;
    
    // Logic Guard
    if (Object.keys(errors).length > 0 || !data.customerName || !data.employeeName || !data.address || !data.numberOfCustomers || !data.dailySalary || !data.startingTime || !data.finishingTime) {
      toast({
        title: "هەڵە هەیە!",
        description: "تکایە هەموو خانە سوورەکان پڕ بکەرەوە!",
        variant: "destructive",
      });
      return; // STOP the process here. Do not call the backend.
    }

    // Ensure remaining amount is calculated before submission
    const servicesList = data.services || [];
    const totalAmount = servicesList.reduce((sum, s) => sum + (parseFloat(s.price || "0") * (s.quantity || 1)), 0);
    const dailySalary = parseFloat(data.dailySalary || "0");
    const taxiFare = parseFloat(data.taxiFare || "0");
    const materialsList = data.materials || [];
    const totalMaterials = materialsList.reduce((sum, m) => sum + parseFloat(m.price || "0"), 0);
    const remaining = totalAmount - dailySalary - taxiFare - totalMaterials;

    // Ensure all values are properly set
    const completeData: DailyEmployeeData = {
      ...data,
      totalAmount: totalAmount.toFixed(2),
      remainingAmount: remaining.toFixed(2),
    };

    console.log("Invoice Data:", completeData);
    createInvoiceMutation.mutate(completeData);
  };

  const onSubmitGroup = (data: GroupEmployeeData) => {
    setIsSubmittedAttemptedGroup(true);
    const errors = groupForm.formState.errors;
    
    // Logic Guard
    if (Object.keys(errors).length > 0 || !data.groupName || !data.address || data.employees.some(e => !e.salary) || !data.startingHr || !data.endHr || !data.workDuration) {
      toast({
        title: "هەڵە هەیە!",
        description: "تکایە هەموو خانە سوورەکان پڕ بکەرەوە!",
        variant: "destructive",
      });
      return; // STOP the process here. Do not call the backend.
    }

    createInvoiceMutation.mutate(data);
  };

  // Force form to re-render when language changes by including it in all form renders
  const renderKey = `form-${language}-${invoiceType}`;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader></DialogHeader>

        <div key={renderKey}>
          {/* Type Selection */}
          {invoiceType === null ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t("invoices.newInvoice.selectInvoiceType")}</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setInvoiceType("daily")}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900">{t("invoices.newInvoice.dailyEmployee")}</div>
                  <div className="text-sm text-gray-500">{t("invoices.newInvoice.dailyDescription")}</div>
                </button>
                <button
                  onClick={() => setInvoiceType("group")}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900">{t("invoices.newInvoice.groupEmployee")}</div>
                  <div className="text-sm text-gray-500">{t("invoices.newInvoice.groupDescription")}</div>
                </button>
              </div>
            </div>
          ) : invoiceType === "daily" ? (
            // Daily Employee Form
            <Form {...dailyForm} key={`daily-${language}`}>
              <form 
                onSubmit={dailyForm.handleSubmit(onSubmitDaily, () => {
                  setIsSubmittedAttemptedDaily(true);
                  toast({
                    title: "هەڵە هەیە!",
                    description: "تکایە هەموو خانە سوورەکان پڕ بکەرەوە!",
                    variant: "destructive",
                  });
                })} 
                className="space-y-6"
              >
                {/* Employee Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("invoices.newInvoice.employeeInfo")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={dailyForm.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("invoices.newInvoice.customerName")} *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("invoices.newInvoice.customerNamePlaceholder")} 
                              {...field} 
                              data-testid="input-customer-name" 
                              className={cn(
                                "transition-all duration-200",
                                isSubmittedAttemptedDaily && !field.value && "border-red-600 bg-red-50 animate-shake"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dailyForm.control}
                      name="employeeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("invoices.newInvoice.employeeName")} *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("invoices.newInvoice.employeeNamePlaceholder")} 
                              {...field} 
                              data-testid="input-employee-name" 
                              className={cn(
                                "transition-all duration-200",
                                isSubmittedAttemptedDaily && !field.value && "border-red-600 bg-red-50 animate-shake"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={dailyForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.address")} *</FormLabel>
                            <FormControl>
                              <Input 
                              placeholder={t("invoices.newInvoice.addressPlaceholder")} 
                              {...field} 
                              data-testid="input-address" 
                              className={cn(
                                "transition-all duration-200",
                                isSubmittedAttemptedDaily && !field.value && "border-red-600 bg-red-50 animate-shake"
                              )}
                            />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dailyForm.control}
                        name="flatNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.flatUnit")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("invoices.newInvoice.flatPlaceholder")} {...field} data-testid="input-flat" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={dailyForm.control}
                      name="numberOfCustomers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("invoices.newInvoice.numberOfCustomers")} *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder={t("invoices.newInvoice.numberOfCustomersPlaceholder")} 
                              {...field} 
                              data-testid="input-customers" 
                              className={cn(
                                "transition-all duration-200",
                                isSubmittedAttemptedDaily && !field.value && "border-red-600 bg-red-50 animate-shake"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dailyForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("invoices.newInvoice.department")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("invoices.newInvoice.departmentPlaceholder")} {...field} data-testid="input-department" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Date & Time */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("invoices.newInvoice.dateTime")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={dailyForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("invoices.newInvoice.date")} *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              onChange={(e) => {
                                console.log("Date changed:", e.target.value);
                                field.onChange(e.target.value);
                              }}
                              value={field.value || ""}
                              data-testid="input-date"
                              className={cn(
                                "transition-all duration-200",
                                isSubmittedAttemptedDaily && !field.value && "border-red-600 bg-red-50 animate-shake"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={dailyForm.control}
                        name="startingTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.startingTime")} *</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                onChange={(e) => {
                                  console.log("Starting time changed:", e.target.value);
                                  field.onChange(e.target.value);
                                }}
                                value={field.value || ""}
                                data-testid="input-start-time"
                                className={cn(
                                  "transition-all duration-200",
                                  isSubmittedAttemptedDaily && !field.value && "border-red-600 bg-red-50 animate-shake"
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dailyForm.control}
                        name="finishingTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.finishingTime")} *</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                onChange={(e) => {
                                  console.log("Finishing time changed:", e.target.value);
                                  field.onChange(e.target.value);
                                }}
                                value={field.value || ""}
                                data-testid="input-finish-time"
                                className={cn(
                                  "transition-all duration-200",
                                  isSubmittedAttemptedDaily && !field.value && "border-red-600 bg-red-50 animate-shake"
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Work Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("invoices.newInvoice.workDetails")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={dailyForm.control}
                      name="cleaningMaterialsOrdered"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked && dailyMaterialFields.length === 0) {
                                  dailyMaterialAppend({ name: "", price: "0" });
                                }
                                setTimeout(calculateRemaining, 0);
                              }}
                              data-testid="checkbox-materials"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">{t("invoices.newInvoice.cleaningMaterials")}</FormLabel>
                        </FormItem>
                      )}
                    />

                    {dailyForm.watch("cleaningMaterialsOrdered") && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between px-1">
                          <FormLabel className="text-purple-700 font-semibold">{t("invoices.newInvoice.purchaseMaterials")}</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                            onClick={() => dailyMaterialAppend({ name: "", price: "0" })}
                          >
                            <Plus className="h-3 w-3 mr-1" /> {t("invoices.newInvoice.addMaterial") || "Add Material"}
                          </Button>
                        </div>

                        <div className="space-y-3 pl-2 border-l-2 border-purple-100">
                          {dailyMaterialFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-2 gap-3 p-3 bg-purple-50/30 rounded-lg relative group">
                              <FormField
                                control={dailyForm.control}
                                name={`materials.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">{t("invoices.newInvoice.materialType")}</FormLabel>
                                    <FormControl>
                                      <Input className="h-8 text-sm" placeholder={t("invoices.newInvoice.materialTypePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={dailyForm.control}
                                name={`materials.${index}.price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">{t("invoices.newInvoice.materialPrice")}</FormLabel>
                                    <div className="flex items-center gap-2">
                                      <FormControl>
                                        <Input
                                          className="h-8 text-sm"
                                          type="number"
                                          placeholder="0"
                                          {...field}
                                          onChange={(e) => {
                                            field.onChange(e);
                                            setTimeout(calculateRemaining, 0);
                                          }}
                                        />
                                      </FormControl>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                          dailyMaterialRemove(index);
                                          setTimeout(calculateRemaining, 0);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <FormField
                      control={dailyForm.control}
                      name="extraTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("invoices.newInvoice.extraTime")}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" step="0.5" {...field} data-testid="input-extra-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Services Section */}
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{t("invoices.newInvoice.services")}</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ id: 0, name: "", price: "0", quantity: 1 })}
                    >
                      <Plus className="h-4 w-4 mr-1" /> {t("invoices.newInvoice.addService")}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50 relative">
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 text-red-500"
                            onClick={() => {
                              remove(index);
                              setTimeout(() => calculateRemaining(), 0);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        <FormField
                          control={dailyForm.control}
                          name={`services.${index}.id`}
                          render={({ field: serviceIdField }) => (
                            <FormItem>
                              <FormLabel>{t("invoices.newInvoice.service")} *</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  const selectedService = services?.find(s => s.id.toString() === value);
                                  if (selectedService) {
                                    serviceIdField.onChange(selectedService.id);
                                    dailyForm.setValue(`services.${index}.name`, selectedService.name);
                                    dailyForm.setValue(`services.${index}.price`, selectedService.price.toString());
                                    setTimeout(() => calculateRemaining(), 0);
                                  }
                                }}
                                value={serviceIdField.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("invoices.newInvoice.selectService")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {services?.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                      {s.name} ({formatCurrency(parseFloat(s.price))})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={dailyForm.control}
                            name={`services.${index}.price`}
                            render={({ field: priceField }) => (
                              <FormItem>
                                <FormLabel>{t("invoices.newInvoice.price")}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...priceField}
                                    onChange={(e) => {
                                      priceField.onChange(e);
                                      setTimeout(() => calculateRemaining(), 0);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={dailyForm.control}
                            name={`services.${index}.quantity`}
                            render={({ field: qtyField }) => (
                              <FormItem>
                                <FormLabel>{t("invoices.newInvoice.quantity")}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...qtyField}
                                    onChange={(e) => {
                                      qtyField.onChange(parseInt(e.target.value) || 1);
                                      setTimeout(() => calculateRemaining(), 0);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Financial Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("invoices.newInvoice.financialDetails")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={dailyForm.control}
                        name="dailySalary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.dailySalary")} *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setTimeout(() => calculateRemaining(), 0);
                                }}
                                data-testid="input-salary"
                                className={cn(
                                  "transition-all duration-200",
                                  isSubmittedAttemptedDaily && !field.value && "border-red-600 bg-red-50 animate-shake"
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dailyForm.control}
                        name="taxiFare"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.taxiFare")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setTimeout(() => calculateRemaining(), 0);
                                }}
                                data-testid="input-taxi-fare"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Display Calculated Remaining Amount */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-sm text-gray-600">{t("invoices.newInvoice.totalAmount")} ({t("invoices.newInvoice.services")})</p>
                        <p className="text-lg font-bold text-blue-600">
                          {dailyForm.watch("totalAmount") ? formatCurrency(parseFloat(dailyForm.watch("totalAmount"))) : formatCurrency(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t("invoices.newInvoice.remainingAmount")} ({t("invoices.newInvoice.totalAmount")} - {t("invoices.newInvoice.dailySalary")} - {t("invoices.newInvoice.taxiFare")})</p>
                        <p className="text-lg font-bold text-green-600">
                          {dailyForm.watch("remainingAmount") ? formatCurrency(parseFloat(dailyForm.watch("remainingAmount"))) : formatCurrency(0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInvoiceType(null)}
                    data-testid="button-back"
                  >
                    {t("invoices.newInvoice.back")}
                  </Button>
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => setIsSubmittedAttemptedDaily(true)}
                    disabled={createInvoiceMutation.isPending}
                    data-testid="button-create-invoice"
                  >
                    {createInvoiceMutation.isPending ? (
                      <ButtonLoader>{t("invoices.newInvoice.creating")}</ButtonLoader>
                    ) : (
                      t("invoices.newInvoice.createInvoice")
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            // Group Employee Form
            <Form {...groupForm} key={`group-${language}`}>
              <form 
                onSubmit={groupForm.handleSubmit(onSubmitGroup, () => {
                  setIsSubmittedAttemptedGroup(true);
                  toast({
                    title: "هەڵە هەیە!",
                    description: "تکایە هەموو خانە سوورەکان پڕ بکەرەوە!",
                    variant: "destructive",
                  });
                })} 
                className="space-y-6"
              >
                {/* Basic Group Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("invoices.newInvoice.groupInfo")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={groupForm.control}
                      name="groupName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("invoices.newInvoice.groupName")} *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("invoices.newInvoice.groupNamePlaceholder")} 
                              {...field} 
                              data-testid="input-group-name" 
                              className={cn(
                                "transition-all duration-200",
                                isSubmittedAttemptedGroup && !field.value && "border-red-600 bg-red-50 animate-shake"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={groupForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("invoices.newInvoice.address")} *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("invoices.newInvoice.addressPlaceholder")} 
                              {...field} 
                              data-testid="input-group-address" 
                              className={cn(
                                "transition-all duration-200",
                                isSubmittedAttemptedGroup && !field.value && "border-red-600 bg-red-50 animate-shake"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={groupForm.control}
                      name="numberOfCustomers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("invoices.newInvoice.numberOfCustomers")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              data-testid="input-group-number-of-customers"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={groupForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.startingDate")} *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                onChange={(e) => {
                                  console.log("Start date changed:", e.target.value);
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
                        control={groupForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.endDate")} *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                onChange={(e) => {
                                  console.log("End date changed:", e.target.value);
                                  field.onChange(e.target.value);
                                }}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Employee Counts & Names */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("invoices.newInvoice.staffDetails")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={groupForm.control}
                        name="maleCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.maleCount")}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} data-testid="input-male-count" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={groupForm.control}
                        name="femaleCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.femaleCount")}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} data-testid="input-female-count" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <FormLabel>{t("invoices.newInvoice.employeeNames")} *</FormLabel>
                      {groupForm.watch("employees").map((_, index) => (
                        <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                          <FormField
                            control={groupForm.control}
                            name={`employees.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">{t("invoices.newInvoice.employeeName")} {index + 1}</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder={`${t("invoices.newInvoice.employeeName")} ${index + 1}`} 
                                    {...field} 
                                    data-testid={`input-employee-name-${index}`} 
                                    className={cn(
                                      "transition-all duration-200",
                                      isSubmittedAttemptedGroup && !field.value && "border-red-600 bg-red-50 animate-shake"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={groupForm.control}
                            name={`employees.${index}.salary`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">{t("invoices.newInvoice.dailySalary")}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0" 
                                    {...field} 
                                    data-testid={`input-employee-salary-${index}`} 
                                    className={cn(
                                      "transition-all duration-200",
                                      isSubmittedAttemptedGroup && !field.value && "border-red-600 bg-red-50 animate-shake"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="col-span-2"
                              onClick={() => {
                                const employees = [...groupForm.getValues("employees")];
                                employees.splice(index, 1);
                                groupForm.setValue("employees", employees);
                                setTimeout(calculateGroupNet, 0);
                              }}
                            >
                              {t("invoices.newInvoice.remove")}
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const employees = [...groupForm.getValues("employees")];
                          employees.push({ name: "", salary: "" });
                          groupForm.setValue("employees", employees);
                          setTimeout(calculateGroupNet, 0);
                        }}
                        className="w-full border-dashed"
                      >
                        {t("invoices.newInvoice.addEmployee")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Work Duration & Timing */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("invoices.newInvoice.workTiming")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={groupForm.control}
                        name="startingHr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.startingHr")} *</FormLabel>
                            <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              data-testid="input-group-start-hr" 
                              className={cn(
                                "transition-all duration-200",
                                isSubmittedAttemptedGroup && !field.value && "border-red-600 bg-red-50 animate-shake"
                              )}
                            />
                          </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={groupForm.control}
                        name="endHr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.endHr")} *</FormLabel>
                            <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              data-testid="input-group-end-hr" 
                              className={cn(
                                "transition-all duration-200",
                                isSubmittedAttemptedGroup && !field.value && "border-red-600 bg-red-50 animate-shake"
                              )}
                            />
                          </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={groupForm.control}
                        name="workDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.workDuration")} *</FormLabel>
                            <FormControl>
                            <Input 
                              type="number" 
                              step="0.5" 
                              placeholder="0" 
                              {...field} 
                              data-testid="input-group-duration" 
                              className={cn(
                                "transition-all duration-200",
                                isSubmittedAttemptedGroup && !field.value && "border-red-600 bg-red-50 animate-shake"
                              )}
                            />
                          </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={groupForm.control}
                        name="extraTimeHr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.extraTimeHr")}</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.5" placeholder="0" {...field} data-testid="input-group-extra-hr" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Services Section */}
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{t("invoices.newInvoice.services")}</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        groupServiceAppend({ id: 0, name: "", price: "0", quantity: 1 });
                        setTimeout(() => calculateGroupNet(), 0);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> {t("invoices.newInvoice.addService")}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {groupServiceFields.map((field, index) => (
                      <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50 relative">
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 text-red-500"
                            onClick={() => {
                              groupServiceRemove(index);
                              setTimeout(() => calculateGroupNet(), 0);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        <FormField
                          control={groupForm.control}
                          name={`services.${index}.id`}
                          render={({ field: serviceIdField }) => (
                            <FormItem>
                              <FormLabel>{t("invoices.newInvoice.service")} *</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  const selectedService = services?.find(s => s.id.toString() === value);
                                  if (selectedService) {
                                    serviceIdField.onChange(selectedService.id);
                                    groupForm.setValue(`services.${index}.name`, selectedService.name);
                                    groupForm.setValue(`services.${index}.price`, selectedService.price.toString());
                                    setTimeout(() => calculateGroupNet(), 0);
                                  }
                                }}
                                value={serviceIdField.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("invoices.newInvoice.selectService")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {services?.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                      {s.name} ({formatCurrency(parseFloat(s.price))})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={groupForm.control}
                            name={`services.${index}.price`}
                            render={({ field: priceField }) => (
                              <FormItem>
                                <FormLabel>{t("invoices.newInvoice.price")}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...priceField}
                                    onChange={(e) => {
                                      priceField.onChange(e);
                                      setTimeout(() => calculateGroupNet(), 0);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={groupForm.control}
                            name={`services.${index}.quantity`}
                            render={({ field: qtyField }) => (
                              <FormItem>
                                <FormLabel>{t("invoices.newInvoice.quantity")}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...qtyField}
                                    onChange={(e) => {
                                      qtyField.onChange(parseInt(e.target.value) || 1);
                                      setTimeout(() => calculateGroupNet(), 0);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Financials & Materials */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("invoices.newInvoice.financialsAndMaterials")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={groupForm.control}
                        name="amountReceived"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.amountReceived")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                readOnly
                                className="bg-gray-100"
                                data-testid="input-amount-received"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={groupForm.control}
                        name="employeePay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.employeePay")} *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => { field.onChange(e); setTimeout(calculateGroupNet, 0); }}
                                data-testid="input-group-employee-pay"
                                className={cn(
                                  "transition-all duration-200",
                                  isSubmittedAttemptedGroup && !field.value && "border-red-600 bg-red-50 animate-shake"
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={groupForm.control}
                        name="foodExpense"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.foodExpense")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                {...field}
                                onChange={(e) => { field.onChange(e); setTimeout(calculateGroupNet, 0); }}
                                data-testid="input-group-food"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={groupForm.control}
                        name="taxiFare"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("invoices.newInvoice.taxiFare")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                {...field}
                                onChange={(e) => { field.onChange(e); setTimeout(calculateGroupNet, 0); }}
                                data-testid="input-group-taxi"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={groupForm.control}
                      name="cleaningMaterialsOrdered"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked && groupMaterialFields.length === 0) {
                                  groupMaterialAppend({ name: "", price: "0" });
                                }
                                setTimeout(calculateGroupNet, 0);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">{t("invoices.newInvoice.cleaningMaterials")}</FormLabel>
                        </FormItem>
                      )}
                    />

                    {groupForm.watch("cleaningMaterialsOrdered") && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between px-1">
                          <FormLabel className="text-purple-700 font-semibold">{t("invoices.newInvoice.purchaseMaterials")}</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                            onClick={() => groupMaterialAppend({ name: "", price: "0" })}
                          >
                            <Plus className="h-3 w-3 mr-1" /> {t("invoices.newInvoice.addMaterial") || "Add Material"}
                          </Button>
                        </div>

                        <div className="space-y-3 pl-2 border-l-2 border-purple-100">
                          {groupMaterialFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-2 gap-3 p-3 bg-purple-50/30 rounded-lg relative group">
                              <FormField
                                control={groupForm.control}
                                name={`materials.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">{t("invoices.newInvoice.materialType")}</FormLabel>
                                    <FormControl>
                                      <Input className="h-8 text-sm" placeholder={t("invoices.newInvoice.materialTypePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={groupForm.control}
                                name={`materials.${index}.price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">{t("invoices.newInvoice.materialPrice")}</FormLabel>
                                    <div className="flex items-center gap-2">
                                      <FormControl>
                                        <Input
                                          className="h-8 text-sm"
                                          type="number"
                                          placeholder="0"
                                          {...field}
                                          onChange={(e) => {
                                            field.onChange(e);
                                            setTimeout(calculateGroupNet, 0);
                                          }}
                                        />
                                      </FormControl>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                          groupMaterialRemove(index);
                                          setTimeout(calculateGroupNet, 0);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-600 font-medium">Total Remaining Profit</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(parseFloat(groupForm.watch("totalNet") || "0"))}
                      </p>
                      <p className="text-xs text-purple-500 mt-1">
                        (Received - Food - Taxi - Materials - (Employee Salaries × {groupForm.watch("employees").length} Employees))
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setInvoiceType(null)}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => setIsSubmittedAttemptedGroup(true)}
                    disabled={createInvoiceMutation.isPending}
                  >
                    {createInvoiceMutation.isPending ? <ButtonLoader>Creating...</ButtonLoader> : "Create Group Invoice"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog >
  );
}
