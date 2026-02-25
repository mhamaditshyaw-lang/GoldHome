import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Receipt, Plus, Trash2 } from "lucide-react";
import { User } from "@shared/schema";

interface GroupInvoiceFormProps {
  onClose: () => void;
}

const groupInvoiceFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  employees: z.array(z.object({
    name: z.string().min(1, "Employee name is required"),
    employeeId: z.string().optional(),
    salary: z.string().min(1, "Salary is required"),
  })).min(1, "At least one employee is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type GroupInvoiceFormData = z.infer<typeof groupInvoiceFormSchema>;

export default function GroupInvoiceForm({ onClose }: GroupInvoiceFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const user = authManager.getState().user;

  // Fetch team members to get their salaries
  const { data: teamMembers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<GroupInvoiceFormData>({
    resolver: zodResolver(groupInvoiceFormSchema),
    defaultValues: {
      customerName: "",
      employees: [{ name: "", employeeId: "", salary: "" }],
      totalAmount: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const employees = form.watch("employees") || [{ name: "", employeeId: "", salary: "" }];

  const createGroupInvoiceMutation = useMutation({
    mutationFn: async (data: GroupInvoiceFormData) => {
      const filteredEmployees = data.employees.filter(emp => emp.name.trim() && emp.salary.trim());
      const employeeNames = filteredEmployees.map(emp => emp.name);
      const employeeSalaries = filteredEmployees.reduce((acc, emp) => {
        acc[emp.name] = emp.salary;
        return acc;
      }, {} as Record<string, string>);
      const employeeIds = filteredEmployees.reduce((acc, emp) => {
        if (emp.employeeId?.trim()) {
          acc[emp.name] = emp.employeeId;
        }
        return acc;
      }, {} as Record<string, string>);

      // Calculate average salary for services display
      const totalSalaries = filteredEmployees.reduce((sum, emp) => sum + parseFloat(emp.salary), 0);
      const avgSalary = filteredEmployees.length > 0 ? (totalSalaries / filteredEmployees.length).toFixed(2) : "0.00";

      const response = await apiRequest("POST", "/api/invoices", {
        customerName: data.customerName,
        createdAt: data.date,
        services: [
          {
            id: 1,
            name: "Group Service",
            price: avgSalary,
            quantity: filteredEmployees.length,
          }
        ],
        totalAmount: parseFloat(data.totalAmount).toFixed(2),
        cleanerId: user?.id || 1,
        status: "completed",
        notes: data.notes || "",
        metadata: {
          invoiceType: "group",
          employeeNames: employeeNames,
          employeeSalaries: employeeSalaries, // Store individual salaries
          employeeIds: employeeIds, // Store employee IDs/codes
          numberOfEmployees: filteredEmployees.length.toString(),
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: t("common.success") || "Success",
        description: t("invoices.groupInvoiceCreatedSuccess"),
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error") || "Error",
        description: error.message || t("invoices.failedToCreateGroupInvoice"),
        variant: "destructive",
      });
    },
  });

  const handleAddEmployee = () => {
    const currentEmployees = form.getValues("employees") || [];
    form.setValue("employees", [...currentEmployees, { name: "", employeeId: "", salary: "" }]);
  };

  const handleRemoveEmployee = (index: number) => {
    const currentEmployees = form.getValues("employees") || [];
    form.setValue("employees", currentEmployees.filter((_, i) => i !== index));
  };

  const handleEmployeeChange = (index: number, field: 'name' | 'employeeId' | 'salary', value: string) => {
    const currentEmployees = form.getValues("employees") || [];
    const newEmployees = [...currentEmployees];
    newEmployees[index][field] = value;

    // Auto-fill salary when name matches a team member
    if (field === 'name' && value.trim()) {
      const matchedMember = teamMembers.find(member =>
        member.name.toLowerCase() === value.trim().toLowerCase()
      );
      if (matchedMember && matchedMember.dailySalary) {
        newEmployees[index].salary = matchedMember.dailySalary.toString();
      }
    }

    form.setValue("employees", newEmployees);
  };

  const onSubmit = (data: GroupInvoiceFormData) => {
    createGroupInvoiceMutation.mutate(data);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gold-100 mb-4">
            <Receipt className="h-6 w-6 text-gold-600" />
          </div>
          <DialogTitle className="text-center text-lg font-medium text-gray-900">
            Create Group Invoice
          </DialogTitle>
          <p className="text-center text-sm text-gray-500">
            Add invoice for multiple employees
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer/Job Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter customer or job name" {...field} />
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
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      onChange={(e) => {
                        console.log("Group list date changed:", e.target.value);
                        field.onChange(e.target.value);
                      }}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Employees Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base font-semibold">Employees & Daily Salary</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEmployee}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Employee
                </Button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {employees.map((employee, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder={`Employee ${index + 1} name`}
                        value={employee.name}
                        onChange={(e) => handleEmployeeChange(index, 'name', e.target.value)}
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 bg-white"
                      />
                      <Input
                        placeholder="Employee ID/Code (optional)"
                        value={employee.employeeId || ""}
                        onChange={(e) => handleEmployeeChange(index, 'employeeId', e.target.value)}
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 bg-white"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Daily salary (e.g., 50.00)"
                        value={employee.salary}
                        onChange={(e) => handleEmployeeChange(index, 'salary', e.target.value)}
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 bg-white"
                      />
                    </div>
                    {employees.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEmployee(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 mt-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount</FormLabel>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Add any notes about this invoice"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createGroupInvoiceMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {createGroupInvoiceMutation.isPending ? "Creating..." : "Create Group Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
