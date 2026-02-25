import { useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { customerAuthManager } from "@/lib/customer-auth";
import { useLanguage } from "@/contexts/LanguageContext";

import {
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  LogIn,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import MobileInputWrapper from "@/components/mobile/mobile-input-wrapper";
import logoImage from "@assets/5267036859329016857_1752482052211_1762687045297.jpg";

export default function Auth() {
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, direction } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

      try {
      // Trim input to avoid accidental leading/trailing whitespace causing auth failures
      const identifierTrimmed = loginData.identifier.trim();
      const passwordTrimmed = loginData.password.trim();

      if (
        !identifierTrimmed.includes("@") &&
        !identifierTrimmed.includes("+")
      ) {
        try {
          await authManager.login(identifierTrimmed, passwordTrimmed);
          setLocation("/dashboard");
          toast({
            title: t("auth.welcomeStaff"),
            description: t("auth.staffLoginSuccess"),
          });
          return;
        } catch (error) {
          // continue to customer login
        }
      }

      try {
        await customerAuthManager.login(
          identifierTrimmed,
          passwordTrimmed,
        );
        setLocation("/customer-dashboard");
        toast({
          title: t("auth.welcomeCustomer"),
          description: t("auth.customerLoginSuccess"),
        });
      } catch (error) {
        toast({
          title: t("auth.loginFailed"),
          description: t("auth.invalidCredentials"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("auth.loginFailed"),
        description:
          error instanceof Error ? error.message : t("auth.invalidCredentials"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden form-container bg-gradient-to-br from-background via-background to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950"
      dir={direction}
    >
      {/* Lightweight animated background: single blurred gradient layer (much cheaper than many DOM nodes) */}
      <div
        className="absolute inset-0 auth-bg"
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          {/* Back to Home Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-back"
              className="text-foreground hover:bg-background/50 border border-border rounded-lg"
            >
              <ArrowLeft
                className={`h-4 w-4 ${direction === "rtl" ? "ml-2" : "mr-2"}`}
              />
              {t("common.back")}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-xl border-0 bg-white dark:bg-slate-800 backdrop-blur-xl overflow-hidden card-modern">
              {/* Header with Logo */}
              <CardHeader className="text-center pb-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-700 dark:to-slate-600 border-b border-purple-200 dark:border-purple-800">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="mx-auto w-20 h-20 rounded-2xl mb-4 border-4 border-purple-500 shadow-lg shadow-purple-500/30 overflow-hidden bg-white"
                >
                  <img
                    src={logoImage}
                    alt="Mali ALTUWI Logo"
                    width={80}
                    height={80}
                    decoding="async"
                    className="w-full h-full object-cover"
                    data-testid="img-logo-auth"
                  />
                </motion.div>

                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <span className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent">
                    Mali ALTUWI
                  </span>
                </CardTitle>

                <CardDescription className="text-gray-600 dark:text-gray-300 text-base">
                  {t("auth.loginTitle")}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <MobileInputWrapper>
                    <div className="space-y-2">
                      <Label
                        htmlFor="login-identifier"
                        className="text-gray-700 dark:text-gray-200 font-medium"
                      >
                        {t("auth.phoneOrUsername")}
                      </Label>
                      <div className="relative">
                        <Lock
                          className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${direction === "rtl" ? "right-3" : "left-3"}`}
                        />
                        <Input
                          id="login-identifier"
                          value={loginData.identifier}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              identifier: e.target.value,
                            })
                          }
                          className={`${direction === "rtl" ? "pr-11 text-right" : "pl-11"} h-11 border-gray-300 dark:border-slate-600 dark:bg-slate-900 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-400/20 transition-all`}
                          required
                          autoComplete="username"
                          inputMode="text"
                          data-testid="input-login-identifier"
                        />
                      </div>
                    </div>
                  </MobileInputWrapper>

                  <MobileInputWrapper>
                    <div className="space-y-2">
                      <Label
                        htmlFor="login-password"
                        className="text-gray-700 dark:text-gray-200 font-medium"
                      >
                        {t("auth.password")}
                      </Label>
                      <div className="relative">
                        <Lock
                          className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10 ${direction === "rtl" ? "right-3" : "left-3"}`}
                        />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              password: e.target.value,
                            })
                          }
                          className={`${direction === "rtl" ? "pr-11 pl-11 text-right" : "pl-11 pr-11"} h-11 border-gray-300 dark:border-slate-600 dark:bg-slate-900 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-400/20 transition-all`}
                          required
                          autoComplete="current-password"
                          data-testid="input-login-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 z-10 ${direction === "rtl" ? "left-3" : "right-3"} transition-colors`}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </MobileInputWrapper>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-600 dark:to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:hover:from-purple-700 dark:hover:to-purple-800 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/40"
                    disabled={loading}
                    data-testid="button-submit-login"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t("welcome.loading")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogIn className="w-5 h-5" />
                        <span>{t("auth.loginButton")}</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
