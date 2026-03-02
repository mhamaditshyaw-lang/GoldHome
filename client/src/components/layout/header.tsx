import { Bell, Menu, Settings, Globe, LogOut, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authManager } from "@/lib/auth";
import { useState, useEffect } from "react";
import { AuthState } from "@/lib/auth";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

import NotificationCenter from "@/components/notifications/notification-center";
import LogoutAnimation from "@/components/ui/logout-animation";

// ─── Page title lookup ────────────────────────────────────────────────────────

const PAGE_META: Record<string, { title: string; breadcrumb?: string }> = {
  "/dashboard":        { title: "Dashboard" },
  "/invoices":         { title: "Invoices",          breadcrumb: "Business Operations" },
  "/expenses":         { title: "Expenses",           breadcrumb: "Business Operations" },
  "/debt":             { title: "Debt Management",    breadcrumb: "Business Operations" },
  "/payment-history":  { title: "Payment History",    breadcrumb: "Business Operations" },
  "/accounting":       { title: "Accounting",         breadcrumb: "Business Operations" },
  "/services":         { title: "Services",           breadcrumb: "Business Operations" },
  "/header-footer":    { title: "Header & Footer",    breadcrumb: "Business Operations" },
  "/bookings":         { title: "Bookings",           breadcrumb: "Scheduling" },
  "/assign-bookings":  { title: "Assign Bookings",    breadcrumb: "Scheduling" },
  "/live-tracking":    { title: "Live Tracking",      breadcrumb: "Team" },
  "/team":             { title: "Team",               breadcrumb: "Team" },
  "/admin":            { title: "Admin Panel",        breadcrumb: "Administration" },
  "/admin/permissions":{ title: "Permissions",        breadcrumb: "Administration" },
  "/settings":         { title: "Settings",           breadcrumb: "Administration" },
  "/cloudflare-dns":   { title: "Cloudflare DNS",     breadcrumb: "Administration" },
  "/backup-restore":   { title: "Backup & Restore",   breadcrumb: "Administration" },
  "/analytics":        { title: "Analytics" },
  "/security-dashboard": { title: "Security",         breadcrumb: "Administration" },
  "/user-settings":    { title: "User Settings" },
  "/about-developer":  { title: "About Developer" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const [authState, setAuthState] = useState<AuthState>(authManager.getState());
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const { t, direction, language, setLanguage } = useLanguage();
  const [location] = useLocation();

  const languages = [
    { code: "en" as Language, name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "ku" as Language, name: "Kurdish", nativeName: "کوردی", flag: "🟡" },
  ];

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    const unsubscribeAnim = authManager.subscribeToLogoutAnimation(setShowLogoutAnimation);
    return () => {
      unsubscribe();
      unsubscribeAnim();
    };
  }, []);

  const handleLogout = () => authManager.logout();
  const handleLogoutAnimationComplete = () => {
    setShowLogoutAnimation(false);
    authManager.completeLogout();
  };

  const user = authState.user;
  const pageMeta = PAGE_META[location] || { title: "Dashboard" };

  return (
    <>
      <LogoutAnimation
        isVisible={showLogoutAnimation}
        onComplete={handleLogoutAnimationComplete}
      />

      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-100 shadow-[0_1px_0_0_rgb(0,0,0,0.04)]">
        <div className="flex-1 flex items-center px-4 sm:px-6 gap-4">

          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
            data-testid="mobile-menu-button"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>

          {/* ── Left: Page title (desktop only) ─────────────────────────── */}
          <div className="hidden md:flex items-center gap-2 min-w-0">
            {pageMeta.breadcrumb && (
              <>
                <span className="text-xs text-gray-400 font-medium truncate">
                  {pageMeta.breadcrumb}
                </span>
                <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
              </>
            )}
            <h1 className="text-sm font-semibold text-gray-800 truncate">
              {pageMeta.title}
            </h1>
          </div>

          {/* ── Center: Search bar ───────────────────────────────────────── */}
          <div className="flex-1 flex justify-center px-2 max-w-md mx-auto">
            <div className="relative w-full hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                strokeWidth={1.75}
              />
              <Input
                placeholder={t("header.searchPlaceholder") || "Search…"}
                className="pl-9 pr-10 h-9 bg-gray-50 border-gray-100 focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-200 transition-all rounded-xl text-sm placeholder:text-gray-400"
              />
              <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center gap-0.5 rounded-md border border-gray-200 bg-white px-1.5 font-mono text-[10px] font-medium text-gray-400 shadow-sm">
                <span className="text-[11px]">⌘</span>F
              </kbd>
            </div>
          </div>

          {/* ── Right: Controls ──────────────────────────────────────────── */}
          <div className="flex items-center gap-1 ml-auto flex-shrink-0">

            {/* Notification bell */}
            <NotificationCenter />

            {/* Language switcher */}
            <Menubar className="border-none bg-transparent p-0 h-auto shadow-none">
              <MenubarMenu>
                <MenubarTrigger
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer border-none bg-transparent data-[state=open]:bg-gray-100 h-9 w-9 flex items-center justify-center"
                  data-testid="language-switcher"
                >
                  <Globe className="h-4.5 w-4.5" strokeWidth={1.75} />
                </MenubarTrigger>
                <MenubarContent
                  align="end"
                  className="min-w-[160px] bg-white border-gray-100 shadow-lg rounded-xl p-1"
                >
                  {languages.map((lang) => (
                    <MenubarItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition-colors ${
                        language === lang.code
                          ? "bg-purple-50 text-purple-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <div>
                        <p className="text-xs font-semibold">{lang.nativeName}</p>
                        <p className="text-[10px] text-gray-400">{lang.name}</p>
                      </div>
                      {language === lang.code && (
                        <span className="ml-auto w-1.5 h-1.5 bg-purple-600 rounded-full" />
                      )}
                    </MenubarItem>
                  ))}
                </MenubarContent>
              </MenubarMenu>
            </Menubar>

            {/* Logout */}
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all h-9 w-9 flex items-center justify-center"
                title={t("navigation.logout") || "Logout"}
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}

            {/* User avatar */}
            {user && (
              <div className="flex items-center ml-1">
                <div className="relative">
                  <img
                    className="h-8 w-8 rounded-xl object-cover border border-gray-200 shadow-sm cursor-pointer hover:ring-2 hover:ring-purple-200 transition-all"
                    src={
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7C3AED&color=fff`
                    }
                    alt={user.name}
                    data-testid="user-avatar"
                  />
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
