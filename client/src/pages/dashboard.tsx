import { useQuery, useMutation } from "@tanstack/react-query";
import RecentInvoices from "@/components/dashboard/recent-invoices";
import StatsCards from "@/components/dashboard/widgets/stats-cards";
import NewInvoiceForm from "@/components/invoices/new-invoice-form";
import MobileSimulator from "@/components/mobile/mobile-simulator";
import InvoiceChart from "@/components/dashboard/widgets/invoice-chart";
import LocationSharing from "@/components/tracking/LocationSharing";
import { authManager } from "@/lib/auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/use-currency";
import { useSettings } from "@/hooks/use-settings";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  TrendingUp,
  Briefcase,
  Receipt,
  Calendar,
  Clock,
  Phone,
  MapPin,
  CheckCircle,
  Navigation,
  ArrowUpRight,
  Sparkles,
  Activity,
  Wallet,
  ClipboardList,
  Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerBooking {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  location: string | null;
  services: { id: number; name: string; price: string; quantity: number }[];
  totalAmount: string;
  notes: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  status: string;
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
}

interface StatsData {
  totalRevenue: number;
  totalExpenses: number;
  monthlyExpenses: number;
  jobsCompleted: number;
  activeCleaners: number;
  workingNow: number;
  totalDebt: number;
  totalEmployeeSalary: number;
  averageRating: number;
}

interface DebtData {
  id: number;
  amount: string;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; dotColor: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dotColor: "bg-amber-400",
  },
  assigned: {
    label: "Assigned",
    className: "bg-violet-50 text-violet-700 border border-violet-200",
    dotColor: "bg-violet-500",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    dotColor: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border border-red-200",
    dotColor: "bg-red-400",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  isLoading: boolean;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  isLoading,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100/80 p-5 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        {/* Text section */}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
            {title}
          </p>
          {isLoading ? (
            <div className="h-7 w-28 bg-gray-100 rounded-lg animate-pulse mt-2 mb-1.5" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1.5 tracking-tight">
              {value}
            </p>
          )}
          <p className="text-[11px] sm:text-xs text-gray-400 mt-1 leading-tight">
            {subtitle}
          </p>
        </div>

        {/* Icon */}
        <div
          className={`${iconBg} p-2.5 sm:p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-200`}
        >
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onComplete,
  isPending,
}: {
  booking: CustomerBooking;
  onComplete: (id: number) => void;
  isPending: boolean;
}) {
  const initials = booking.customerName
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const status =
    STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-colors group cursor-default">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-xs font-bold text-violet-700 select-none">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {booking.customerName}
          </p>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {booking.address && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
            <p className="text-xs text-gray-500 truncate">{booking.address}</p>
          </div>
        )}

        {(booking.preferredDate || booking.preferredTime) && (
          <div className="flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
            <p className="text-xs text-gray-500">
              {booking.preferredDate &&
                format(new Date(booking.preferredDate), "MMM d")}
              {booking.preferredTime && ` · ${booking.preferredTime}`}
            </p>
          </div>
        )}

        {/* Services badges */}
        {booking.services && booking.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {booking.services.slice(0, 2).map((svc, i) => (
              <span
                key={i}
                className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md"
              >
                {svc.name}
              </span>
            ))}
            {booking.services.length > 2 && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                +{booking.services.length - 2}
              </span>
            )}
          </div>
        )}

        {booking.status === "assigned" && (
          <button
            onClick={() => onComplete(booking.id)}
            disabled={isPending}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {isPending ? "Processing…" : "Mark Complete"}
          </button>
        )}
      </div>

      {/* Location button */}
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 shrink-0"
        title="View location"
      >
        <Navigation className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function BookingSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();

  // Page-access guard
  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("dashboard")) {
      toast({
        title: t("common.error"),
        description: t("common.accessDenied") || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading]);

  const user = authManager.getState().user;
  const isCleanerRole = user?.role === "cleaner";

  // ── Data queries ──────────────────────────────────────────────────────────

  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: debts = [] } = useQuery<DebtData[]>({
    queryKey: ["/api/debts"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<any>({
    queryKey: ["/api/invoices"],
  });

  // Bookings – fetch for all roles (API returns relevant bookings per role)
  const { data: allBookings, isLoading: bookingsLoading } = useQuery<
    CustomerBooking[]
  >({
    queryKey: ["/api/customer/bookings"],
  });

  // ── Mutation: complete booking ─────────────────────────────────────────────

  const completeBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await fetch(`/api/customer/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Failed to complete booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Booking Completed",
        description: "Invoice created automatically.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete booking",
        variant: "destructive",
      });
    },
  });

  const handleCompleteBooking = (bookingId: number) => {
    if (
      confirm(
        "Mark this booking as completed? An invoice will be created automatically."
      )
    ) {
      completeBookingMutation.mutate(bookingId);
    }
  };

  // ── Computed values ───────────────────────────────────────────────────────

  const unpaidDebts = debts
    .filter((d) => d.status === "pending")
    .reduce((s, d) => s + Number(d.amount), 0);

  const remaining =
    (stats?.totalRevenue || 0) -
    (stats?.totalExpenses || 0) -
    (stats?.totalEmployeeSalary || 0) -
    unpaidDebts;

  const activeBookings =
    allBookings?.filter(
      (b) => b.status !== "completed" && b.status !== "cancelled"
    ) || [];

  const today = format(new Date(), "EEEE, MMM d, yyyy");
  const firstName = user?.name?.split(" ")[0] || "there";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/40 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* ━━━ PAGE HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {getGreeting()},{" "}
                <span className="text-violet-600">{firstName}</span>
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 ml-7">{today}</p>
          </div>

          {/* Active jobs pill — admin only */}
          {!isCleanerRole && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Activity className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {activeBookings.length} Active Job
                  {activeBookings.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isCleanerRole ? (

          /* ══ CLEANER VIEW ═══════════════════════════════════════════════════ */
          <div className="space-y-6">

            {/* Mini stats for cleaner */}
            <StatsCards
              totalProjects={24}
              endedProjects={10}
              runningProjects={12}
              pendingProjects={2}
              isLoading={statsLoading}
            />

            {/* My Assigned Bookings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="h-4 w-4 text-violet-600" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {t("dashboard.myAssignedBookings")}
                  </h2>
                </div>
                {activeBookings.length > 0 && (
                  <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full">
                    {activeBookings.length} pending
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-4">
                {bookingsLoading ? (
                  <BookingSkeleton />
                ) : activeBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-700">
                      {t("dashboard.noAssignedBookings")}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t("dashboard.noBookingsAssigned")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activeBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onComplete={handleCompleteBooking}
                        isPending={completeBookingMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live location sharing */}
            <LocationSharing autoStart={true} />

            {/* Recent invoices */}
            <RecentInvoices invoices={invoices} isLoading={invoicesLoading} />
          </div>

        ) : (

          /* ══ ADMIN / SUPERVISOR VIEW ════════════════════════════════════════ */
          <div className="space-y-6">

            {/* ── Metric Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title={t("dashboard.totalRevenue")}
                value={formatCurrency(stats?.totalRevenue || 0)}
                subtitle={t("dashboard.totalEarningsDesc")}
                icon={TrendingUp}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                isLoading={statsLoading}
              />
              <MetricCard
                title={t("dashboard.remainingAmount")}
                value={formatCurrency(remaining)}
                subtitle={t("dashboard.netProfitDesc")}
                icon={Wallet}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                isLoading={statsLoading}
              />
              <MetricCard
                title={t("dashboard.employeeSalary")}
                value={formatCurrency(stats?.totalEmployeeSalary || 0)}
                subtitle={t("dashboard.totalSalaryDesc")}
                icon={Briefcase}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                isLoading={statsLoading}
              />
              <MetricCard
                title={t("dashboard.totalExpenses")}
                value={formatCurrency(stats?.totalExpenses || 0)}
                subtitle={t("dashboard.operationalCostsDesc")}
                icon={Receipt}
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                isLoading={statsLoading}
              />
            </div>

            {/* ── Main Content: Chart + Bookings Panel ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Revenue Area Chart — 2/3 width */}
              <div className="lg:col-span-2">
                <InvoiceChart invoices={invoices} isLoading={invoicesLoading} />
              </div>

              {/* Active Jobs Panel — 1/3 width */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[420px]">
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                      <ClipboardList className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Active Jobs
                    </h2>
                  </div>
                  {activeBookings.length > 0 && (
                    <span className="text-[11px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                      {activeBookings.length}
                    </span>
                  )}
                </div>

                {/* Panel body — scrollable */}
                <div className="flex-1 overflow-y-auto">
                  {bookingsLoading ? (
                    <BookingSkeleton />
                  ) : activeBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Calendar className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-600">
                        No active jobs
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        All bookings are up to date
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-0.5">
                      {activeBookings.slice(0, 8).map((booking) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          onComplete={handleCompleteBooking}
                          isPending={completeBookingMutation.isPending}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Panel footer */}
                {activeBookings.length > 8 && (
                  <div className="px-4 py-3 border-t border-gray-50 shrink-0">
                    <button
                      onClick={() => setLocation("/bookings")}
                      className="text-xs text-violet-600 font-medium hover:text-violet-700 transition-colors flex items-center gap-1 group"
                    >
                      View all {activeBookings.length} bookings
                      <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Quick Summary Row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Jobs Completed",
                  value: stats?.jobsCompleted ?? 0,
                  icon: CheckCircle,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                  isLoading: statsLoading,
                },
                {
                  label: "Active Cleaners",
                  value: stats?.activeCleaners ?? 0,
                  icon: Users,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                  isLoading: statsLoading,
                },
                {
                  label: "Working Now",
                  value: stats?.workingNow ?? 0,
                  icon: Activity,
                  color: "text-violet-600",
                  bg: "bg-violet-50",
                  isLoading: statsLoading,
                },
                {
                  label: "Total Debt",
                  value: formatCurrency(stats?.totalDebt || 0),
                  icon: Receipt,
                  color: "text-rose-600",
                  bg: "bg-rose-50",
                  isLoading: statsLoading,
                  isString: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow duration-200"
                >
                  <div
                    className={`${item.bg} p-2.5 rounded-xl shrink-0`}
                  >
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 font-medium truncate">
                      {item.label}
                    </p>
                    {item.isLoading ? (
                      <div className="h-5 w-12 bg-gray-100 rounded animate-pulse mt-0.5" />
                    ) : (
                      <p className="text-base font-bold text-gray-900">
                        {(item as any).isString ? item.value : item.value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showInvoiceForm && (
        <NewInvoiceForm onClose={() => setShowInvoiceForm(false)} />
      )}
      <MobileSimulator
        isVisible={showMobileSimulator}
        onClose={() => setShowMobileSimulator(false)}
      />
    </div>
  );
}
