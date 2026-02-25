import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Invoice } from "@shared/schema";
import { subDays, format, isSameDay, parseISO } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";

interface InvoiceChartProps {
    invoices: Invoice[];
    isLoading: boolean;
}

export default function InvoiceChart({ invoices, isLoading }: InvoiceChartProps) {
    const { formatCurrency } = useCurrency();
    const { t } = useLanguage();

    // Process data: Get last 7 days and sum invoice amounts for each day
    const data = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, "EEE"); // Mon, Tue, etc.

        // Sum invoices for this day
        const dayTotal = invoices?.reduce((sum, invoice) => {
            // Handle both string and Date objects for createdAt
            const invoiceDate = typeof invoice.createdAt === 'string'
                ? parseISO(invoice.createdAt)
                : new Date(invoice.createdAt);

            if (isSameDay(invoiceDate, date)) {
                return sum + Number(invoice.totalAmount);
            }
            return sum;
        }, 0) || 0;

        return {
            name: dateStr,
            value: dayTotal,
            fullDate: format(date, "MMM d, yyyy")
        };
    });

    if (isLoading) {
        return (
            <Card className="bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </Card>
        );
    }

    return (
        <Card className="bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {t('dashboard.invoiceCreationTrends')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                hide={true} // Hide Y axis for cleaner look
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800">
                                                <p className="text-xs text-gray-500 mb-1">{payload[0].payload.fullDate}</p>
                                                <p className="font-bold text-emerald-600">
                                                    {formatCurrency(payload[0].value as number)}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={40}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.value > 0 ? "url(#colorGradient)" : "#F3F4F6"}
                                    />
                                ))}
                            </Bar>
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
