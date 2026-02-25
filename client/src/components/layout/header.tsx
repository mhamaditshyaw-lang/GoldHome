import { Bell, Menu, Settings, Globe, LogOut, Search } from "lucide-react";
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

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const [authState, setAuthState] = useState<AuthState>(authManager.getState());
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const { t, direction, language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();

  const languages = [
    { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'ku' as Language, name: 'Kurdish', nativeName: 'کوردی', flag: '🟡' }
  ];

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    const unsubscribeLogoutAnimation = authManager.subscribeToLogoutAnimation(setShowLogoutAnimation);
    return () => {
      unsubscribe();
      unsubscribeLogoutAnimation();
    };
  }, []);

  const handleLogout = () => {
    authManager.logout();
  };

  const handleLogoutAnimationComplete = () => {
    setShowLogoutAnimation(false);
    authManager.completeLogout();
  };

  const user = authState.user;

  return (
    <>
      <LogoutAnimation
        isVisible={showLogoutAnimation}
        onComplete={handleLogoutAnimationComplete}
      />
      <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
        <div className="flex-1 px-4 flex justify-between">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="p-2 hover:bg-gray-100 text-gray-600"
              data-testid="mobile-menu-button"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 md:px-8">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search task"
                className="pl-10 pr-12 h-10 bg-gray-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all rounded-xl"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100 shadow-sm">
                  <span className="text-xs">⌘</span>F
                </kbd>
              </div>
            </div>
          </div>

          <div className={`flex items-center md:ml-6 ${direction === 'rtl' ? 'mr-4 space-x-reverse space-x-4' : 'ml-4 space-x-4'}`}>
            <NotificationCenter />

            {/* Language Switcher */}
            <Menubar className="border-none bg-transparent p-0 h-auto">
              <MenubarMenu>
                <MenubarTrigger className="p-2 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent data-[state=open]:bg-gray-100" data-testid="language-switcher">
                  <Globe className="h-5 w-5 text-gray-600" />
                </MenubarTrigger>
                <MenubarContent align="end" className="min-w-[160px] bg-white border-gray-200">
                  {languages.map((lang) => (
                    <MenubarItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-50 ${language === lang.code ? 'bg-gray-50 text-emerald-600' : ''
                        }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{lang.nativeName}</span>
                        <span className="text-xs text-gray-500">{lang.name}</span>
                      </div>
                      {language === lang.code && (
                        <div className="ml-auto w-2 h-2 bg-gray-600 rounded-full"></div>
                      )}
                    </MenubarItem>
                  ))}
                </MenubarContent>
              </MenubarMenu>
            </Menubar>

            {/* Logout Button */}
            {user && (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                title={t('navigation.logout') || 'Logout'}
                data-testid="logout-button"
              >
                <LogOut className="h-5 w-5 text-gray-600" />
              </Button>
            )}

            <div className={`flex items-center ${direction === 'rtl' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
              {user && (
                <>
                  <img
                    className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6B7280&color=fff`}
                    alt={user.name}
                    data-testid="user-avatar"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
