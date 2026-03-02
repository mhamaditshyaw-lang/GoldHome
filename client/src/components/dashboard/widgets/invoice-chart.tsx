import { useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Invoice } from "@shared/schema";
import { subDays, format, isSameDay, parseISO } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp } from "lucide-react";

interface InvoiceChartProps {
  invoices: Invoice[];
  isLoading: boolean;
}

type Period = "7d" | "30d";

export default function InvoiceChart({ invoices, isLoading }: InvoiceChartProps) {
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>("7d");

  const days = period === "7d" ? 7 : 30;

  const data = Array.from({ length: days }).map((_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const dateStr =
      period === "7d" ? format(date, "EEE") : format(date, "d MMM");

    const dayTotal =
      invoices?.reduce((sum, invoice) => {
        const invoiceDate =
          typeof invoice.createdAt === "string"
            ? parseISO(invoice.createdAt)
            : new Date(invoice.createdAt);
        return isSameDay(invoiceDate, date)
          ? sum + Number(invoice.totalAmount)
          : sum;
      }, 0) || 0;

    return {
      name: dateStr,
      value: dayTotal,
      fullDate: format(date, "MMM d, yyyy"),
    };
  });

  const totalPeriodRevenue = data.reduce((s, d) => s + d.value, 0);
  const activeDays = data.filter((d) => d.value > 0).length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-gray-400 mb-0.5">
            {payload[0].payload.fullDate}
          </p>
          <p className="text-sm font-bold text-emerald-600">
            {formatCurrency(payload[0].value as number)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t("dashboard.invoiceCreationTrends")}
            </h3>
          </div>
          <p className="text-[13px] text-gray-500 mt-1.5 ml-9">
            {isLoading ? (
              <span className="inline-block h-4 w-40 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <span className="font-semibold text-gray-700">
                  {formatCurrency(totalPeriodRevenue)}
                </span>
                <span className="mx-1.5 text-gray-300">·</span>
                <span>{activeDays} active day{activeDays !== 1 ? "s" : ""}</span>
              </>
            )}
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg p-1 shrink-0">
          {(["7d", "30d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                period === p
                  ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="px-2 pb-5">
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                    <stop
                      offset="95%"
                      stopColor="#10B981"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  dy={8}
                  interval={period === "30d" ? 4 : 0}
                />

                <YAxis hide />

                <Tooltip
                  cursor={{
                    stroke: "#10B981",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  content={<CustomTooltip />}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="url(#emeraldGrad)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "#10B981",
                    stroke: "#fff",
                    strokeWidth: 2.5,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
