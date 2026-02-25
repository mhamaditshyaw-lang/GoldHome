import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, LogIn, UserPlus, Leaf } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CoralNavigationProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
}

export function CoralNavigation({ onGetStarted, onLogin, onRegister }: CoralNavigationProps) {
  const [location] = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300 group-hover:scale-105">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Mali ALTUNI
              </span>
            </div>
          </Link>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            {location === '/' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogin}
                  className="hidden sm:flex items-center space-x-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-emerald-400 transition-all duration-300"
                  data-testid="button-login-nav"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('coral.signIn')}</span>
                </Button>
                <Button
                  size="sm"
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
                  data-testid="button-get-started-nav"
                >
                  {t('coral.getStarted')}
                </Button>
              </>
            )}
            
            {location === '/auth' && (
              <Link href="/">
                <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50" data-testid="button-home-nav">
                  <Home className="w-4 h-4 mr-2" />
                  {t('coral.home')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
