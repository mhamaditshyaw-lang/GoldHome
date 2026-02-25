import { motion } from "framer-motion";

// Service booking loading animation
export function ServiceBookingLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <div className="relative">
        <motion.div
          className="w-16 h-16 border-4 border-gold-200 rounded-full"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-gold-600 rounded-full"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <p className="text-lg font-medium text-gray-700">Processing Your Service Request</p>
        <p className="text-sm text-gray-500">Please wait while we prepare your booking...</p>
      </motion.div>
    </div>
  );
}

// Service selection loading animation
export function ServiceSelectionLoader() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-gold-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Service card loading skeleton
export function ServiceCardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <motion.div
                className="h-4 bg-gray-200 rounded w-32"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
              <motion.div
                className="h-3 bg-gray-200 rounded w-24"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1 + 0.3,
                }}
              />
            </div>
            <motion.div
              className="h-6 bg-gray-200 rounded w-16"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1 + 0.6,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Button loading state
export function ButtonLoader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center space-x-2">
      <motion.div
        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <span>{children}</span>
    </div>
  );
}

// Progress steps animation
export function ServiceProgressSteps({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: "Select Service", icon: "🏠" },
    { label: "Customer Info", icon: "👤" },
    { label: "Booking Details", icon: "📋" },
    { label: "Confirmation", icon: "✅" },
  ];

  return (
    <div className="flex items-center justify-center space-x-4 mb-6">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <motion.div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index < currentStep
                ? "bg-gold-500 border-gold-500 text-white"
                : index === currentStep
                ? "bg-gold-50 border-gold-500 text-gold-500"
                : "bg-gray-50 border-gray-300 text-gray-400"
            }`}
            animate={{
              scale: index === currentStep ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: index === currentStep ? Infinity : 0,
              repeatType: "reverse",
            }}
          >
            {index < currentStep ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                ✓
              </motion.div>
            ) : (
              <span className="text-sm">{step.icon}</span>
            )}
          </motion.div>
          <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <motion.div
              className={`w-8 h-0.5 mx-2 ${
                index < currentStep ? "bg-gold-500" : "bg-gray-300"
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: index < currentStep ? 1 : 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Success animation
export function ServiceBookingSuccess() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-8 space-y-4"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          ✓
        </motion.div>
      </motion.div>
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p className="text-lg font-medium text-gray-700">Service Booked Successfully!</p>
        <p className="text-sm text-gray-500">Your cleaning service has been scheduled</p>
      </motion.div>
    </motion.div>
  );
}

// Service card animation
export function AnimatedServiceCard({ 
  children, 
  isSelected, 
  onClick 
}: { 
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? "ring-2 ring-gold-500" : ""
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}