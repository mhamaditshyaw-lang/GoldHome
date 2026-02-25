import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useQuery } from "@tanstack/react-query";

interface StatsData {
    totalRevenue: number;
    totalExpenses: number;
    monthlyExpenses: number;
    jobsCompleted: number;
}

export default function FinancialOverview() {
    const { formatCurrency } = useCurrency();
    const { data: stats, isLoading } = useQuery<StatsData>({
        queryKey: ["/api/dashboard/stats"],
    });

    if (isLoading) {
        return (
            <Card className="bg-emerald-900 text-white border-none shadow-sm rounded-[2rem] h-full p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </Card>
        );
    }

    const revenue = stats?.totalRevenue || 0;
    const expenses = stats?.totalExpenses || 0;
    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return (
        <Card className="bg-emerald-900 text-white border-none shadow-sm rounded-[2rem] h-full overflow-hidden relative">
            <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-emerald-100 text-sm font-medium mb-1">Net Profit</p>
                        <h3 className="text-3xl font-bold">{formatCurrency(netProfit)}</h3>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-800 p-1.5 rounded-full">
                                <TrendingUp className="h-3 w-3 text-emerald-400" />
                            </div>
                            <span className="text-sm text-emerald-100">Revenue</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(revenue)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-red-900/50 p-1.5 rounded-full">
                                <TrendingDown className="h-3 w-3 text-red-400" />
                            </div>
                            <span className="text-sm text-emerald-100">Expenses</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(expenses)}</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-emerald-800">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-emerald-200">Profit Margin</span>
                        <span className="font-bold text-white">{profitMargin.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-emerald-950/50 h-1.5 rounded-full mt-2">
                        <div
                            className="bg-emerald-400 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
                        />
                    </div>
                </div>
            </CardContent>

            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500 rounded-full blur-3xl opacity-10 -ml-10 -mb-10"></div>
        </Card>
    );
}
