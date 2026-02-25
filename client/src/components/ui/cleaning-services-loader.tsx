import { motion } from "framer-motion";
import { Sparkles, Home, Droplets, Wind } from "lucide-react";

interface CleaningServicesLoaderProps {
  title?: string;
  subtitle?: string;
}

export function CleaningServicesLoader({ 
  title = "Preparing Your Cleaning Services",
  subtitle = "Please wait while we get everything ready..."
}: CleaningServicesLoaderProps) {
  const cleaningItems = [
    {
      icon: Home,
      name: "Deep Clean",
      description: "Complete home cleaning with attention to detail",
      color: "from-blue-400 to-blue-600",
      position: { x: 0, y: 0 }
    },
    {
      icon: Sparkles,
      name: "Regular Clean",
      description: "Weekly maintenance cleaning service",
      color: "from-purple-400 to-purple-600",
      position: { x: 1, y: 0 }
    },
    {
      icon: Droplets,
      name: "Bathroom",
      description: "Specialized bathroom deep cleaning",
      color: "from-teal-400 to-teal-600",
      position: { x: 0, y: 1 }
    },
    {
      icon: Wind,
      name: "Post-Construction",
      description: "Construction cleanup and restoration",
      color: "from-green-400 to-green-600",
      position: { x: 1, y: 1 }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gold-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {title}
          </h1>
          <p className="text-lg text-gray-600">
            {subtitle}
          </p>
        </motion.div>

        {/* Cleaning Services Grid */}
        <div className="grid grid-cols-2 gap-6 md:gap-8 mb-12">
          {cleaningItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.2,
                type: "spring",
                stiffness: 100
              }}
              className="relative group"
            >
              {/* Card Background */}
              <div className={`
                relative h-64 md:h-80 rounded-3xl bg-gradient-to-br ${item.color} 
                shadow-lg hover:shadow-xl transition-all duration-300 
                transform hover:scale-105 overflow-hidden
              `}>
                {/* Decorative shapes */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-4 w-16 h-16 bg-white/15 rounded-2xl rotate-45"></div>
                
                {/* Content */}
                <div className="relative p-6 h-full flex flex-col justify-between text-white">
                  <div>
                    <motion.div
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="w-12 h-12 md:w-16 md:h-16 mb-4"
                    >
                      <item.icon className="w-full h-full" />
                    </motion.div>
                    
                    <h3 className="text-xl md:text-2xl font-bold mb-2">
                      {item.name}
                    </h3>
                    <p className="text-sm md:text-base text-white/80 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Action button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm border border-white/30"
                  >
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      →
                    </motion.div>
                  </motion.div>
                </div>

                {/* Animated overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.3 + 1 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
          
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gray-600 text-center"
          >
            Loading your personalized cleaning experience...
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}