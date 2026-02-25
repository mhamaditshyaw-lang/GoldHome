import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CleaningServicesLoader } from "@/components/ui/cleaning-services-loader";
import { customerAuthManager } from "@/lib/customer-auth";
import { authManager } from "@/lib/auth";

export default function LoadingPage() {
  const [, setLocation] = useLocation();
  const [loadingText, setLoadingText] = useState("Preparing Your Experience");
  
  useEffect(() => {
    const loadingMessages = [
      "Preparing Your Experience",
      "Setting Up Your Dashboard",
      "Loading Cleaning Services", 
      "Finalizing Everything"
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingText(loadingMessages[messageIndex]);
    }, 2000);

    // Check authentication status after a brief loading period
    const authCheckTimeout = setTimeout(async () => {
      // Check for customer authentication first
      const customerAuth = customerAuthManager.getState();
      if (customerAuth.isAuthenticated) {
        setLocation("/customer-dashboard");
        return;
      }

      // Check for staff authentication
      const staffAuth = authManager.getState();
      if (staffAuth.isAuthenticated) {
        setLocation("/dashboard");
        return;
      }

      // No authentication found, redirect to welcome
      setLocation("/");
    }, 4000); // Show loading for 4 seconds minimum

    return () => {
      clearInterval(messageInterval);
      clearTimeout(authCheckTimeout);
    };
  }, [setLocation]);

  return (
    <CleaningServicesLoader 
      title={loadingText}
      subtitle="We're getting everything ready for you. This will just take a moment..."
    />
  );
}