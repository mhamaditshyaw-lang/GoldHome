import { Link, useLocation } from "wouter";
import {
  Home,
  Receipt,
  Users,
  MapPin,
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
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Code,
  LogOut,
  History,
  Cloud,
  Database,
  Smartphone,
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

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [authState, setAuthState] = useState<AuthState>(authManager.getState());
  const { isPageEnabled } = useSettings();
  const { t } = useLanguage();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const allCollapsed = getNavigationSections(t).reduce(
      (acc, section) => {
        acc[section.title] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
    setCollapsedSections(allCollapsed);
  }, []);

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const expandAllSections = () => {
    setCollapsedSections({});
  };

  const collapseAllSections = () => {
    const allSections = getNavigationSections(t).reduce(
      (acc, section) => {
        acc[section.title] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
    setCollapsedSections(allSections);
  };

  const user = authState.user;
  const navigationSections = getNavigationSections(t);

  const filteredNavigationSections = navigationSections
    .map((section) => {
      // Section level permission check
      let sectionEnabled = true;
      if (section.title === t("sidebar.businessOperations")) {
        sectionEnabled = isPageEnabled("section_business_operations");
      } else if (section.title === t("sidebar.schedulingAssignments")) {
        sectionEnabled = isPageEnabled("section_scheduling_assignments");
      } else if (section.title === t("sidebar.teamTracking")) {
        sectionEnabled = isPageEnabled("section_team_tracking");
      }

      if (!sectionEnabled) {
        return { ...section, items: [] };
      }

      return {
        ...section,
        items: section.items.filter((item) => {
          if (item.settingKey === "admin") {
            return user?.role === "admin";
          }
          if (item.settingKey === "settings") {
            return user?.role === "admin" || user?.role === "supervisor";
          }
          if (item.settingKey === "developer") {
            return user?.role === "admin";
          }
          return isPageEnabled(item.settingKey);
        }),
      };
    })
    .filter((section) => section.items.length > 0);

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    await authManager.logout();
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[9999] w-72 md:hidden transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col flex-grow h-full shadow-xl border-r border-gray-200 bg-white">
          {/* Mobile header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <Link href="/welcome">
              <span
                className="flex items-center cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handleLinkClick}
              >
                <div className="w-11 h-11 rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
                  <img src={logoImage} alt={t("sidebar.logoAlt")} className="w-full h-full object-cover" data-testid="img-logo-sidebar-mobile" />
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                    {t("sidebar.companyName")}
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    {t("sidebar.companySubtitle")}
                  </p>
                </div>
              </span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
              data-testid="button-close-mobile-sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-2 flex-grow flex flex-col overflow-y-auto">
            <nav className="flex-1 px-3 space-y-1.5 pb-4">
              {filteredNavigationSections.map((section, index) => {
                const isSectionCollapsed = collapsedSections[section.title];
                return (
                  <div key={section.title}>
                    {index > 0 && <div className="h-px my-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />}
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2.5 transition-all rounded-lg hover:bg-gray-50"
                      data-testid={`button-toggle-section-${section.title.replace(/\s+/g, "-").toLowerCase()}-mobile`}
                    >
                      <span>{section.title}</span>
                      <motion.div
                        animate={{ rotate: isSectionCollapsed ? 0 : 90 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </motion.div>
                    </button>
                    <AnimatePresence initial={false}>
                      {!isSectionCollapsed && (
                        <motion.div
                          initial={false}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-1 mt-1">
                            {section.items.map((item) => {
                              const isActive = location === item.href;
                              const Icon = item.icon;

                              return (
                                <Link key={item.name} href={item.href}>
                                  <motion.span
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleLinkClick}
                                    className={cn(
                                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200",
                                      isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                    )}
                                    data-testid={`link-${item.name.replace(/\s+/g, "-").toLowerCase()}-mobile`}
                                  >
                                    {Icon && (
                                      <Icon
                                        className={cn(
                                          "mr-3 h-5 w-5 transition-all duration-200",
                                          isActive
                                            ? "text-primary"
                                            : "text-gray-400 group-hover:text-gray-600",
                                        )}
                                      />
                                    )}
                                    <span className="font-medium">{item.name}</span>
                                  </motion.span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>
          </div>

          {user && (
            <div className="flex-shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="p-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border transition-all" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}>
                  <div className="relative">
                    <img
                      className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                      src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6B7280&color=fff`
                      }
                      alt={user.name}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs font-medium text-gray-300 capitalize">
                      {user.role}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="p-2 text-gray-300 hover:text-white rounded-lg transition-all"
                    data-testid="button-logout-mobile"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden md:flex md:flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "md:w-20" : "md:w-72",
        )}
      >
        <div className="flex flex-col flex-grow h-screen shadow-sm border-r border-gray-200 bg-white">
          {/* Desktop header */}
          <div
            className={cn(
              "flex items-center flex-shrink-0 px-5 py-5 transition-all duration-300",
              isCollapsed ? "justify-center" : "justify-between",
            )}
          >
            <Link href="/welcome">
              <span className="flex items-center cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-11 h-11 rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
                  <img src={logoImage} alt={t("sidebar.logoAlt")} className="w-full h-full object-cover" data-testid="img-logo-sidebar" />
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-3 overflow-hidden"
                    >
                      <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap tracking-tight">
                        {t("sidebar.companyName")}
                      </h1>
                      <p className="text-xs text-gray-500 whitespace-nowrap font-medium">
                        {t("sidebar.companySubtitle")}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </span>
            </Link>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    data-testid="button-toggle-sidebar"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-5 right-2 z-20"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2 text-gray-300 hover:text-white rounded-lg transition-all"
                data-testid="button-expand-sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          <div className="mt-2 flex-grow flex flex-col overflow-y-auto">
            <nav className="flex-1 px-3 space-y-1.5 pb-4">
              {filteredNavigationSections.map((section, index) => {
                const isSectionCollapsed = collapsedSections[section.title];
                return (
                  <div key={section.title}>
                    {index > 0 && !isCollapsed && (
                      <div className="h-px my-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
                    )}
                    {!isCollapsed ? (
                      <>
                        <button
                          onClick={() => toggleSection(section.title)}
                          className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2.5 transition-all rounded-lg hover:bg-gray-50 mb-1"
                        >
                          <span>{section.title}</span>
                          <motion.div
                            animate={{ rotate: isSectionCollapsed ? 0 : 90 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </motion.div>
                        </button>
                        <AnimatePresence initial={false}>
                          {!isSectionCollapsed && (
                            <motion.div
                              initial={false}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-1 mt-1">
                                {section.items.map((item) => {
                                  const isActive = location === item.href;
                                  const Icon = item.icon;

                                  return (
                                    <Link key={item.name} href={item.href}>
                                      <motion.span
                                        whileHover={{ x: 2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                          "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200",
                                          isActive
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                        )}
                                        data-testid={`link-${item.name.replace(/\s+/g, "-").toLowerCase()}-desktop`}
                                      >
                                        {Icon && (
                                          <Icon
                                            className={cn(
                                              "mr-3 h-5 w-5 transition-all duration-200",
                                              isActive
                                                ? "text-emerald-600"
                                                : "text-gray-400 group-hover:text-gray-600",
                                            )}
                                          />
                                        )}
                                        <span className="font-medium">{item.name}</span>
                                      </motion.span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <TooltipProvider delayDuration={0}>
                        <div className="space-y-1">
                          {section.items.map((item) => {
                            const isActive = location === item.href;
                            const Icon = item.icon;

                            return (
                              <Tooltip key={item.name}>
                                <TooltipTrigger asChild>
                                  <Link href={item.href}>
                                    <motion.span
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className={cn(
                                        "group flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200",
                                        isActive
                                          ? "text-white"
                                          : "text-gray-300 hover:text-white",
                                      )}
                                      style={isActive ? { backgroundColor: "rgba(255,255,255,0.15)" } : {}}
                                      onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
                                      onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = "")}
                                      data-testid={`link-${item.name.replace(/\s+/g, "-").toLowerCase()}-collapsed`}
                                    >
                                      {Icon && (
                                        <Icon
                                          className={cn(
                                            "h-5 w-5 transition-all duration-200",
                                            isActive
                                              ? "text-white"
                                              : "text-gray-400 group-hover:text-gray-200",
                                          )}
                                        />
                                      )}
                                    </motion.span>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="bg-gray-900 text-white border-gray-700"
                                >
                                  <p>{item.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </TooltipProvider>
                    )}
                  </div>
                );
              })}
            </nav>
          </div >

          {user && (
            <div className="flex-shrink-0 border-t border-gray-100 p-4">
              {!isCollapsed && (
                <></>
              )}

              <div>
                {isCollapsed ? (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-center">
                          <img
                            className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                            src={
                              user.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6B7280&color=fff`
                            }
                            alt={user.name}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="bg-gray-900 text-white border-gray-700"
                      >
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-gray-300 capitalize">{user.role}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
                    <div className="relative">
                      <img
                        className="h-10 w-10 rounded-full object-cover border border-gray-100"
                        src={
                          user.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=047857&color=fff`
                        }
                        alt={user.name}
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs font-medium text-gray-500 capitalize">
                        {user.username || user.role}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      data-testid="button-logout-desktop"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
          }
        </div>
      </div>
    </>
  );
}
