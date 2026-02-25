import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { authManager } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@assets/a27int8hj-removebg-preview_1759559801086_1762687045298.png";

export default function Welcome() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [staffUser, setStaffUser] = useState(authManager.getState().user);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await authManager.initialize();
      setIsAuthChecking(false);
    };

    initAuth();

    const unsubscribeStaff = authManager.subscribe((state) => {
      setStaffUser(state.user);
      setIsAuthChecking(false);
    });

    return () => {
      unsubscribeStaff();
    };
  }, []);

  useEffect(() => {
    if (!isAuthChecking && staffUser) {
      setLocation("/dashboard");
    }
  }, [staffUser, isAuthChecking, setLocation]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-200 font-medium">{t('welcome.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.3, 1, 1.3], x: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-center">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              {t('welcome.title')}
            </span>
          </h1>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm mb-8"
        >
          <img src={heroImage} alt={t('welcome.title')} className="w-full h-auto drop-shadow-2xl" data-testid="img-hero-person" />
        </motion.div>

        {/* Text */}

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-xs"
        >
          <Button
            onClick={() => {
              if (staffUser) {
                setLocation("/dashboard");
              } else {
                setLocation("/auth");
              }
            }}
            data-testid="button-get-started"
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          >
            <span className="flex items-center justify-center gap-2">
              {staffUser ? t('welcome.goToDashboard') : t('welcome.getStarted')}
              <ArrowRight className="w-5 h-5" />
            </span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
