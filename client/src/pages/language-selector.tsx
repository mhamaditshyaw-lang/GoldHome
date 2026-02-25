import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useState } from "react";
import logoImage from "@assets/5267036859329016857_1752482052211_1762687045297.jpg";

function LanguageSelector() {
  const [, setLocation] = useLocation();
  const { setLanguage } = useLanguage();
  const [hoveredLang, setHoveredLang] = useState<Language | null>(null);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setLocation("/auth");
  };

  const languages = [
    {
      code: 'en' as Language,
      name: 'English',
      nativeName: 'English',
      description: 'Continue in English',
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
      hoverGradient: 'from-blue-700 via-indigo-700 to-purple-700',
      glowColor: 'shadow-blue-500/50',
      emoji: '🌐'
    },
    {
      code: 'ku' as Language,
      name: 'Kurdish',
      nativeName: 'کوردی',
      description: 'بەردەوامبوون بە کوردی',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      hoverGradient: 'from-emerald-700 via-teal-700 to-cyan-700',
      glowColor: 'shadow-emerald-500/50',
      emoji: '🟢🔴⚪'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      {/* Back Button */}
      <div className="fixed top-6 left-6 z-50">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            data-testid="button-back"
            className="text-white hover:bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto w-full">
          
          {/* Logo & Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <motion.div 
              className="mx-auto w-24 h-24 rounded-3xl mb-6 border-4 border-white/20 shadow-2xl shadow-purple-500/30 overflow-hidden bg-white"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img src={logoImage} alt="Mali Altwni Logo" className="w-full h-full object-contain" data-testid="img-logo-language" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex items-center justify-center gap-3"
            >
              <Globe className="w-8 h-8 text-white" />
              <h1 className="text-4xl font-bold text-white">Choose Your Language</h1>
            </motion.div>
          </motion.div>

          {/* Language Options */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-4"
          >
            {languages.map((language, index) => (
              <motion.div
                key={language.code}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.15 }}
                onHoverStart={() => setHoveredLang(language.code)}
                onHoverEnd={() => setHoveredLang(null)}
              >
                <Button
                  onClick={() => handleLanguageSelect(language.code)}
                  data-testid={`button-language-${language.code}`}
                  className={`w-full p-8 bg-gradient-to-r ${hoveredLang === language.code ? language.hoverGradient : language.gradient} text-white font-semibold rounded-2xl shadow-2xl ${language.glowColor} border-0 group relative overflow-hidden transition-all duration-500 hover:shadow-3xl`}
                  size="lg"
                >
                  {/* Animated Background Shine */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: hoveredLang === language.code ? '100%' : '-100%' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  
                  {/* Content */}
                  <div className="relative flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="text-4xl"
                        animate={{ 
                          rotate: hoveredLang === language.code ? [0, -10, 10, -10, 0] : 0 
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {language.emoji}
                      </motion.div>
                      <div className="text-left">
                        <div className="text-2xl font-bold mb-1">
                          {language.nativeName}
                        </div>
                        <div className="text-sm text-white/80">
                          {language.description}
                        </div>
                      </div>
                    </div>
                    
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: hoveredLang === language.code ? 1 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </motion.div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { LanguageSelector };
export default LanguageSelector;
