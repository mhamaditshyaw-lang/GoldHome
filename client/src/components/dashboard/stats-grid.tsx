import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, CheckCircle, Users, Star } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";

interface Stats {
  totalRevenue: number;
  totalExpenses?: number;
  jobsCompleted: number;
  monthlyExpenses: number;
  activeCleaners: number;
  workingNow: number;
  averageRating: number;
  totalEmployeeSalary?: number;
}

interface StatsGridProps {
  stats?: Stats;
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div className="ml-5 w-0 flex-1">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="text-center text-gray-500">Unable to load stats</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const netProfit = stats.totalRevenue - (stats.totalExpenses || stats.monthlyExpenses || 0);
  const avgPerJob = stats.jobsCompleted > 0 ? stats.totalRevenue / stats.jobsCompleted : 0;

  const statItems = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: Receipt,
      bgColor: "bg-gradient-to-r from-purple-500 to-purple-600",
      change: "+12%",
      changeText: "from last month",
      changeColor: "text-purple-600"
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats.totalExpenses || stats.monthlyExpenses || 0),
      icon: Receipt,
      bgColor: "bg-gradient-to-r from-purple-400 to-purple-500",
      change: "This month",
      changeText: "total expenses",
      changeColor: "text-purple-600"
    },
    {
      title: "Employee Daily Salary",
      value: formatCurrency(stats.totalEmployeeSalary || 0),
      icon: Users,
      bgColor: "bg-gradient-to-r from-amber-500 to-amber-600",
      change: "Total Amount",
      changeText: "paid to employees",
      changeColor: "text-amber-600"
    },
    {
      title: "Avg per Job",
      value: formatCurrency(avgPerJob),
      icon: Star,
      bgColor: "bg-gradient-to-r from-purple-600 to-purple-700",
      change: `${stats.jobsCompleted} jobs`,
      changeText: "completed",
      changeColor: "text-purple-600"
    }
  ];

  return (
    <div className="mt-4 sm:mt-6 md:mt-8">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="dashboard-card overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-lg flex items-center justify-center shadow-md`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                      <dd className="text-lg sm:text-xl font-bold text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
              <div className="bg-gradient-to-r from-purple-50 to-purple-50 dark:from-purple-900/10 dark:to-purple-900/10 px-4 sm:px-5 py-2 sm:py-3">
                <div className="text-xs sm:text-sm">
                  <span className={`${stat.changeColor} font-semibold`}>{stat.change}</span>
                  {stat.changeText && <span className="text-gray-500"> {stat.changeText}</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}