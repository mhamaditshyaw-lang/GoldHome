
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Setting {
  id: number;
  key: string;
  value: any;
  description: string | null;
  category: string;
  updatedAt: string;
}

export function useCurrency() {
  const { data: settings = [] } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
    select: (data) => data || [],
  });

  const currency = "DQI";

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return "0 DQI";
    }
    
    return `${Math.round(numAmount).toLocaleString('en-US')} DQI`;
  };

  const getCurrencySymbol = () => {
    return "DQI";
  };

  const getCurrencyCode = () => {
    return currency;
  };

  return {
    currency,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyCode,
  };
}
