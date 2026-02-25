import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize mobile keyboard fix for better mobile experience
import { mobileKeyboardFix } from "./utils/mobile-keyboard-fix";

// Ensure the mobile fix is initialized on app start
if (typeof window !== 'undefined') {
  // Mobile keyboard fix initialization is handled in the class constructor
  mobileKeyboardFix;
}

// Safely import location tracker after DOM is ready
try {
  import("@/services/location-tracker").catch(error => {
    console.warn("Location tracker failed to load:", error);
  });
} catch (error) {
  console.warn("Location tracker import error:", error);
}

createRoot(document.getElementById("root")!).render(<App />);
