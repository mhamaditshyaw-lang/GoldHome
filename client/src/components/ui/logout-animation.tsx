import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, CheckCircle } from "lucide-react";

interface LogoutAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function LogoutAnimation({ isVisible, onComplete }: LogoutAnimationProps) {
  const [stage, setStage] = useState<'logging-out' | 'success' | 'complete'>('logging-out');

  useEffect(() => {
    if (isVisible) {
      // Start with logging out stage
      setStage('logging-out');
      
      // After 1.5 seconds, show success
      const successTimer = setTimeout(() => {
        setStage('success');
      }, 1500);

      // After 2.5 seconds total, complete the animation
      const completeTimer = setTimeout(() => {
        setStage('complete');
        onComplete();
      }, 2500);

      return () => {
        clearTimeout(successTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gold-50 via-white to-gold-100"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    rotate: stage === 'logging-out' ? 360 : 0,
                    scale: stage === 'success' ? 0 : 1
                  }}
                  transition={{ 
                    rotate: { duration: 1, repeat: stage === 'logging-out' ? Infinity : 0, ease: "linear" },
                    scale: { duration: 0.3, delay: stage === 'success' ? 0 : 0 }
                  }}
                  className="w-16 h-16 mx-auto bg-gradient-to-r from-gold-400 to-gold-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <LogOut className="h-8 w-8 text-white" />
                </motion.div>
                
                <AnimatePresence>
                  {stage === 'success' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "backOut" }}
                      className="absolute inset-0 w-16 h-16 mx-auto bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <CheckCircle className="h-8 w-8 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-2"
            >
              <motion.h2
                animate={{ 
                  color: stage === 'success' ? '#059669' : '#D97706'
                }}
                className="text-2xl font-bold"
              >
                {stage === 'logging-out' && 'Logging Out...'}
                {stage === 'success' && 'Successfully Logged Out!'}
                {stage === 'complete' && 'Redirecting...'}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600"
              >
                {stage === 'logging-out' && 'Securing your session...'}
                {stage === 'success' && 'Thank you for using Home Gold'}
                {stage === 'complete' && 'Taking you back to home...'}
              </motion.p>
            </motion.div>

            {/* Animated dots */}
            {stage === 'logging-out' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center space-x-1 mt-6"
              >
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                    className="w-2 h-2 bg-gold-500 rounded-full"
                  />
                ))}
              </motion.div>
            )}

            {/* Success checkmark animation */}
            {stage === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
                className="mt-6"
              >
                <motion.div
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 rgba(34, 197, 94, 0.7)",
                      "0 0 0 10px rgba(34, 197, 94, 0)",
                      "0 0 0 20px rgba(34, 197, 94, 0)",
                    ]
                  }}
                  transition={{ duration: 1, repeat: 2 }}
                  className="w-4 h-4 bg-green-500 rounded-full mx-auto"
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}