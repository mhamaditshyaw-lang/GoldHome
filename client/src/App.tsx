import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { authManager, type AuthState } from "./lib/auth";
import { LanguageProvider } from "@/contexts/LanguageContext";

import Welcome from "@/pages/welcome";
import CoralWelcome from "@/pages/coral-welcome";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import LoadingPage from "@/pages/loading";
import Team from "@/pages/team";
import Services from "@/pages/services";
import Invoices from "@/pages/invoices";
import Admin from "@/pages/admin";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import UserSettings from "@/pages/user-settings";
import AdminPermissions from "@/pages/admin-permissions";
import AboutDeveloper from "@/pages/about-developer";
import SecurityDashboard from "@/pages/security-dashboard";
import HeaderFooterManagement from "@/pages/header-footer-management";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Accounting from "@/pages/accounting";
import Expenses from "@/pages/expenses";
import Bookings from '@/pages/bookings';
import AssignBookings from '@/pages/assign-bookings';
import LiveTrackingPage from '@/pages/live-tracking';
import NotFound from "@/pages/not-found";
import { LanguageAwareRouter } from "./components/LanguageAwareRouter";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileSafeArea from "@/components/mobile/mobile-safe-area";
import MobileFormFix from "@/components/mobile/mobile-form-fix";
import DebtManagement from "@/pages/debt";
import PaymentHistory from "@/pages/payment-history";
import CloudflareDNS from "@/pages/cloudflare-dns";
import BackupRestore from "@/pages/backup-restore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

import { useSettings } from "@/hooks/use-settings";

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [authState, setAuthState] = useState(authManager.getState());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isPageEnabled } = useSettings();
  const [location] = useLocation();

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  if (!authState.isAuthenticated) {
    return <Auth />;
  }

  // Define mapping of paths to setting keys
  const pathToKey: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/live-tracking': 'live_tracking',
    '/invoices': 'invoices',
    '/bookings': 'bookings',
    '/assign-bookings': 'assign_bookings',
    '/services': 'services',
    '/team': 'team',
    '/admin': 'admin',
    '/admin/permissions': 'admin',
    '/security-dashboard': 'security_dashboard',
    '/analytics': 'analytics',
    '/accounting': 'accounting',
    '/expenses': 'expenses',
    '/debt': 'debt',
    '/payment-history': 'payment_history',
    '/settings': 'settings',
    '/user-settings': 'user_settings',
    '/header-footer': 'header_footer',
    '/about-developer': 'developer',
    '/cloudflare-dns': 'cloudflare_dns',
    '/backup-restore': 'backup_restore'
  };

  const currentKey = pathToKey[location];
  const user = authState.user;

  // Check permissions
  if (currentKey) {
    if (currentKey === 'admin' && user?.role !== 'admin') {
      return <NotFound />;
    }
    if (currentKey === 'settings' && user?.role !== 'admin' && user?.role !== 'supervisor') {
      return <NotFound />;
    }
    if (currentKey === 'developer' && user?.role !== 'admin') {
      return <NotFound />;
    }

    // Section-level checks
    const businessOpsPages = ['invoices', 'expenses', 'debt', 'payment_history', 'header_footer', 'accounting', 'services'];
    if (businessOpsPages.includes(currentKey) && !isPageEnabled("section_business_operations")) {
      return <NotFound />;
    }

    const schedulingPages = ['bookings', 'assign_bookings'];
    if (schedulingPages.includes(currentKey) && !isPageEnabled("section_scheduling_assignments")) {
      return <NotFound />;
    }

    const teamTrackingPages = ['live_tracking', 'team'];
    if (teamTrackingPages.includes(currentKey) && !isPageEnabled("section_team_tracking")) {
      return <NotFound />;
    }

    if (!isPageEnabled(currentKey)) {
      return <NotFound />;
    }
  }

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <MobileSafeArea>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} onClose={handleMobileMenuClose} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header onMobileMenuToggle={handleMobileMenuToggle} />
          <main className="flex-1 relative overflow-y-auto scrollbar-modern focus:outline-none bg-gray-50">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MobileSafeArea>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/welcome" component={Welcome} />
      <Route path="/auth" component={Auth} />
      <Route path="/login" component={Auth} />
      <Route path="/loading" component={LoadingPage} />

      {/* All protected routes wrapped in a single ProtectedRoute to maintain sidebar state */}
      <Route>
        {(params) => {
          const protectedPaths = [
            '/dashboard', '/live-tracking', '/invoices', '/bookings', '/assign-bookings',
            '/services', '/team', '/admin',
            '/admin/permissions', '/security-dashboard', '/analytics', '/accounting',
            '/expenses', '/debt', '/payment-history', '/settings', '/user-settings', '/header-footer', '/about-developer', '/cloudflare-dns', '/backup-restore'
          ];

          const currentPath = window.location.pathname;

          if (protectedPaths.some(path => currentPath === path)) {
            return (
              <ProtectedRoute>
                <Switch>
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/live-tracking" component={LiveTrackingPage} />
                  <Route path="/invoices" component={Invoices} />
                  <Route path="/bookings" component={Bookings} />
                  <Route path="/assign-bookings" component={AssignBookings} />
                  <Route path="/services" component={Services} />
                  <Route path="/team" component={Team} />
                  <Route path="/admin" component={Admin} />
                  <Route path="/admin/permissions" component={AdminPermissions} />
                  <Route path="/security-dashboard" component={SecurityDashboard} />
                  <Route path="/analytics" component={Analytics} />
                  <Route path="/accounting" component={Accounting} />
                  <Route path="/expenses" component={Expenses} />
                  <Route path="/debt" component={DebtManagement} />
                  <Route path="/payment-history" component={PaymentHistory} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/user-settings" component={UserSettings} />
                  <Route path="/header-footer" component={HeaderFooterManagement} />
                  <Route path="/about-developer" component={AboutDeveloper} />
                  <Route path="/cloudflare-dns" component={CloudflareDNS} />
                  <Route path="/backup-restore" component={BackupRestore} />
                  <Route component={NotFound} />
                </Switch>
              </ProtectedRoute>
            );
          }

          return <NotFound />;
        }}
      </Route>
    </Switch>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState("Starting app...");

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setDebugInfo("Initializing auth manager...");
        console.log("App: Starting initialization...");

        // Initialize auth manager with timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initialization timeout')), 5000)
        );

        await Promise.race([
          authManager.initialize(),
          timeoutPromise
        ]);

        setDebugInfo("Initialization complete!");
        console.log("App: Initialization complete, setting initialized to true");
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setDebugInfo(`Init failed: ${(error as Error).message}`);
        setIsInitialized(true); // Still show the app even if initialization fails
      }
    };

    initializeApp();
  }, []);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-white">Loading...</p>
            <p className="text-gray-300 text-sm">{debugInfo}</p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  console.log("App: Rendering main application...");

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <MobileFormFix />
            <Toaster />
            <LanguageAwareRouter>
              <div className="min-h-screen bg-gray-50">
                <AppRouter />
              </div>
            </LanguageAwareRouter>
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;