import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Invoice } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Receipt } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";

interface InvoiceWithCleaner extends Invoice {
  cleaner: { id: number; name: string } | null;
}

interface RecentInvoicesProps {
  invoices?: InvoiceWithCleaner[];
  isLoading: boolean;
}

const getServiceTypeImage = (serviceType: string) => {
  if (serviceType.toLowerCase().includes('kitchen')) {
    return "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100";
  }
  if (serviceType.toLowerCase().includes('bathroom')) {
    return "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100";
  }
  if (serviceType.toLowerCase().includes('office')) {
    return "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100";
  }
  return "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100";
};

export default function RecentInvoices({ invoices, isLoading }: RecentInvoicesProps) {
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Card className="bg-white border-none shadow-sm rounded-[2rem] h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <Card className="bg-white border-none shadow-sm rounded-[2rem] h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Invoices</h3>
          </div>
          <div className="text-center text-gray-500 py-8">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent invoices found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-none shadow-sm rounded-[2rem] h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Recent Invoices</h3>
          <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-sm font-medium">
            See All
          </Button>
        </div>
        <div className="flow-root">
          <ul className="divide-y divide-gray-100">
            {invoices.slice(0, 5).map((invoice) => (
              <li key={invoice.id} className="py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <Receipt className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {invoice.customerName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {formatDistanceToNow(new Date(invoice.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      ID: #{invoice.id}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}