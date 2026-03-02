import { Link, useLocation } from "wouter";
import {
  Home,
  Receipt,
  Users,
  DollarSign,
  BarChart3,
  X,
  Settings,
  Briefcase,
  Calculator,
  Calendar,
  UserCheck,
  Navigation,
  FileText,
  CreditCard,
  Shield,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Code,
  LogOut,
  History,
  Cloud,
  Database,
  ChevronUp,
} from "lucide-react";
import { authManager } from "@/lib/auth";
import { useState, useEffect } from "react";
import { AuthState } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import logoImage from "@assets/5267036859329016857_1752482052211_1762687045297.jpg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getNavigationSections = (t: any) => [
  {
    title: t("sidebar.overview"),
    items: [
      {
        name: t("navigation.dashboard"),
        href: "/dashboard",
        icon: BarChart3,
        settingKey: "dashboard",
      },
    ],
  },
  {
    title: t("sidebar.businessOperations"),
    items: [
      {
        name: t("sidebar.invoiceManagement"),
        href: "/invoices",
        icon: Receipt,
        settingKey: "invoices",
      },
      {
        name: t("sidebar.expenseManagement"),
        href: "/expenses",
        icon: CreditCard,
        settingKey: "expenses",
      },
      {
        name: t("sidebar.debtManagement"),
        href: "/debt",
        icon: CreditCard,
        settingKey: "debt",
      },
      {
        name: t("sidebar.paymentHistory"),
        href: "/payment-history",
        icon: History,
        settingKey: "payment_history",
      },
      {
        name: t("sidebar.headerFooter"),
        href: "/header-footer",
        icon: FileText,
        settingKey: "header_footer",
      },
      {
        name: t("navigation.accounting"),
        href: "/accounting",
        icon: Calculator,
        settingKey: "accounting",
      },
      {
        name: t("sidebar.serviceCatalog"),
        href: "/services",
        icon: Briefcase,
        settingKey: "services",
      },
    ],
  },
  {
    title: t("sidebar.schedulingAssignments"),
    items: [
      {
        name: t("sidebar.myBookings"),
        href: "/bookings",
        icon: Calendar,
        settingKey: "bookings",
      },
      {
        name: t("sidebar.bookingAssignments"),
        href: "/assign-bookings",
        icon: UserCheck,
        settingKey: "assign_bookings",
      },
    ],
  },
  {
    title: t("sidebar.teamTracking"),
    items: [
      {
        name: t("sidebar.realTimeTracking"),
        href: "/live-tracking",
        icon: Navigation,
        settingKey: "live_tracking",
      },
      {
        name: t("sidebar.teamManagement"),
        href: "/team",
        icon: Users,
        settingKey: "team",
      },
    ],
  },
  {
    title: t("sidebar.administration"),
    items: [
      {
        name: t("sidebar.adminPanel"),
        href: "/admin",
        icon: Users,
        settingKey: "admin",
      },
      {
        name: t("sidebar.systemSettings"),
        href: "/settings",
        icon: Settings,
        settingKey: "settings",
      },
      {
        name: t("sidebar.cloudflareDNS"),
        href: "/cloudflare-dns",
        icon: Cloud,
        settingKey: "cloudflare_dns",
      },
      {
        name: t("sidebar.backupRestore"),
        href: "/backup-restore",
        icon: Database,
        settingKey: "backup_restore",
      },
    ],
  },
  {
    title: t("sidebar.developerInfo"),
    items: [
      {
        name: t("sidebar.developer"),
        href: "/about-developer",
        icon: Code,
        settingKey: "developer",
      },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// ─── Nav Link ─────────────────────────────────────────────────────────────────

function NavLink({
  item,
  isActive,
  onClick,
  collapsed = false,
}: {
  item: { name: string; href: string; icon: React.ElementType };
  isActive: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={item.href}>
              <motion.span
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center justify-center p-2.5 rounded-xl cursor-pointer transition-all duration-200 mx-2",
                  isActive
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-700",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive ? "text-purple-600" : "",
                  )}
                  strokeWidth={1.75}
                />
              </motion.span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700 text-xs">
            <p>{item.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link href={item.href}>
      <motion.span
        whileHover={{ x: 1 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={cn(
          "group relative flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
          isActive
            ? "bg-purple-50 text-purple-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
        )}
        data-testid={`link-${item.name.replace(/\s+/g, "-").toLowerCase()}`}
      >
        {/* Active left-bar indicator */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-purple-600 rounded-r-full" />
        )}

        {/* Icon box */}
        <div
          className={cn(
            "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200",
            isActive
              ? "bg-purple-100"
              : "bg-transparent group-hover:bg-gray-100",
          )}
        >
          <Icon
            className={cn(
              "h-[16px] w-[16px] transition-colors duration-200",
              isActive
                ? "text-purple-600"
                : "text-gray-400 group-hover:text-gray-600",
            )}
            strokeWidth={1.75}
          />
        </div>

        {/* Label */}
        <span
          className={cn(
            "text-sm font-medium leading-none",
            isActive ? "text-purple-700" : "",
          )}
        >
          {item.name}
        </span>
      </motion.span>
    </Link>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  collapsed: sectionCollapsed,
  onToggle,
  sidebarCollapsed,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  sidebarCollapsed: boolean;
}) {
  if (sidebarCollapsed) {
    return <div className="h-px mx-3 my-2 bg-gray-100" />;
  }

  return (
    <button
      onClick={onToggle}
      className="group w-full flex items-center justify-between px-4 pt-5 pb-1.5 transition-colors"
    >
      <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.08em]">
        {title}
      </span>
      <motion.span
        animate={{ rotate: sectionCollapsed ? 0 : 90 }}
        transition={{ type: "spring", stiffness: 250, damping: 18 }}
        className="text-gray-300 group-hover:text-gray-400 transition-colors"
      >
        <ChevronRight className="h-3 w-3" />
      </motion.span>
    </button>
  );
}

// ─── Profile Card ─────────────────────────────────────────────────────────────

function ProfileCard({
  user,
  collapsed,
}: {
  user: AuthState["user"];
  collapsed: boolean;
}) {
  if (!user) return null;

  if (collapsed) {
    return (
      <div className="px-2 py-3 flex justify-center">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative cursor-default">
                <img
                  className="h-9 w-9 rounded-xl object-cover border border-gray-100 shadow-sm"
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7C3AED&color=fff`
                  }
                  alt={user.name}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-300 capitalize">{user.role}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-4 mb-1">
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/80">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img
              className="h-10 w-10 rounded-xl object-cover border border-gray-200 shadow-sm"
              src={
                user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7C3AED&color=fff`
              }
              alt={user.name}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
              {user.name}
            </p>
            <p className="text-[11px] text-gray-500 capitalize mt-0.5 font-medium">
              {user.role === "admin"
                ? "Administrator"
                : user.role === "supervisor"
                ? "Supervisor"
                : "Cleaner"}
            </p>
          </div>

          {/* Online dot */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [authState, setAuthState] = useState<AuthState>(authManager.getState());
  const { isPageEnabled } = useSettings();
  const { t } = useLanguage();

  const [isCollapsed, setIsCollapsed] = useState(false);
  // Start all sections expanded (MUI Minimal style — no collapsed by default)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  const toggleSection = (title: string) =>
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));

  const toggleSidebar = () => setIsCollapsed((v) => !v);

  const user = authState.user;
  const navigationSections = getNavigationSections(t);

  const filteredSections = navigationSections
    .map((section) => {
      let sectionEnabled = true;
      if (section.title === t("sidebar.businessOperations"))
        sectionEnabled = isPageEnabled("section_business_operations");
      else if (section.title === t("sidebar.schedulingAssignments"))
        sectionEnabled = isPageEnabled("section_scheduling_assignments");
      else if (section.title === t("sidebar.teamTracking"))
        sectionEnabled = isPageEnabled("section_team_tracking");

      if (!sectionEnabled) return { ...section, items: [] };

      return {
        ...section,
        items: section.items.filter((item) => {
          if (item.settingKey === "admin") return user?.role === "admin";
          if (item.settingKey === "settings")
            return user?.role === "admin" || user?.role === "supervisor";
          if (item.settingKey === "developer") return user?.role === "admin";
          return isPageEnabled(item.settingKey);
        }),
      };
    })
    .filter((s) => s.items.length > 0);

  // ── Shared nav render ────────────────────────────────────────────────────────

  const renderNav = (isMobile = false) => (
    <nav className="flex-1 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-gray-100">
      {filteredSections.map((section) => {
        const isSectionCollapsed = !!collapsedSections[section.title];
        return (
          <div key={section.title}>
            <SectionHeader
              title={section.title}
              collapsed={isSectionCollapsed}
              onToggle={() => toggleSection(section.title)}
              sidebarCollapsed={!isMobile && isCollapsed}
            />

            <AnimatePresence initial={false}>
              {!isSectionCollapsed && (
                <motion.div
                  initial={false}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 mt-0.5">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        isActive={location === item.href}
                        onClick={isMobile ? onClose : undefined}
                        collapsed={!isMobile && isCollapsed}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );

  // ── Logout ───────────────────────────────────────────────────────────────────

  const LogoutButton = ({ collapsed: c }: { collapsed: boolean }) => (
    <div
      className={cn(
        "flex-shrink-0 border-t border-gray-100 p-3",
        c ? "flex justify-center" : "",
      )}
    >
      {c ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => authManager.logout()}
                className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                data-testid="button-logout-collapsed"
              >
                <LogOut className="h-4.5 w-4.5" strokeWidth={1.75} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700 text-xs">
              Logout
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <button
          onClick={() => authManager.logout()}
          className="group flex items-center gap-3 w-full mx-0 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          data-testid="button-logout"
        >
          <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-transparent group-hover:bg-red-100 transition-colors">
            <LogOut className="h-[16px] w-[16px]" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-medium">Logout</span>
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile overlay backdrop ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-gray-900/40 backdrop-blur-[2px] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Sidebar ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[9999] w-72 md:hidden transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-xl">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 flex-shrink-0">
            <Link href="/welcome">
              <span className="flex items-center gap-3 cursor-pointer" onClick={onClose}>
                <div className="w-8 h-8 rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
                  <img src={logoImage} alt="Gold Home" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">
                    {t("sidebar.companyName")}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {t("sidebar.companySubtitle")}
                  </p>
                </div>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Mobile profile card */}
          <ProfileCard user={user} collapsed={false} />

          {/* Mobile nav */}
          {renderNav(true)}

          {/* Mobile logout */}
          <LogoutButton collapsed={false} />
        </div>
      </div>

      {/* ── Desktop Sidebar ──────────────────────────────────────────────────── */}
      <motion.div
        className="hidden md:flex md:flex-col flex-shrink-0"
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-screen bg-white border-r border-gray-100 overflow-hidden">

          {/* Desktop Logo + Toggle */}
          <div
            className={cn(
              "flex items-center flex-shrink-0 h-16 border-b border-gray-100 px-4",
              isCollapsed ? "justify-center" : "justify-between",
            )}
          >
            <AnimatePresence mode="wait">
              {!isCollapsed ? (
                <motion.div
                  key="logo-expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5 overflow-hidden"
                >
                  <Link href="/welcome">
                    <span className="flex items-center gap-2.5 cursor-pointer">
                      <div className="w-8 h-8 rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white flex-shrink-0">
                        <img
                          src={logoImage}
                          alt="Gold Home"
                          className="w-full h-full object-cover"
                          data-testid="img-logo-sidebar"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                          {t("sidebar.companyName")}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium truncate">
                          {t("sidebar.companySubtitle")}
                        </p>
                      </div>
                    </span>
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="logo-collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Link href="/welcome">
                    <div className="w-8 h-8 rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white cursor-pointer">
                      <img src={logoImage} alt="Gold Home" className="w-full h-full object-cover" />
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapse toggle */}
            {!isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                data-testid="button-toggle-sidebar"
              >
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <div className="flex justify-center pt-2 px-2">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                data-testid="button-expand-sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          )}

          {/* Desktop profile card */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ProfileCard user={user} collapsed={false} />
              </motion.div>
            )}
          </AnimatePresence>

          {isCollapsed && <ProfileCard user={user} collapsed={true} />}

          {/* Desktop nav */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-100">
            <nav className="pb-4">
              {filteredSections.map((section) => {
                const isSectionCollapsed = !!collapsedSections[section.title];
                return (
                  <div key={section.title}>
                    <SectionHeader
                      title={section.title}
                      collapsed={isSectionCollapsed}
                      onToggle={() => toggleSection(section.title)}
                      sidebarCollapsed={isCollapsed}
                    />
                    <AnimatePresence initial={false}>
                      {!isSectionCollapsed && (
                        <motion.div
                          initial={false}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-0.5 mt-0.5">
                            {section.items.map((item) => (
                              <NavLink
                                key={item.href}
                                item={item}
                                isActive={location === item.href}
                                collapsed={isCollapsed}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Desktop logout */}
          <LogoutButton collapsed={isCollapsed} />
        </div>
      </motion.div>
    </>
  );
}
