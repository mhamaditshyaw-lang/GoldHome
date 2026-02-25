import React, { useEffect } from 'react';

// Component to fix mobile form issues
export default function MobileFormFix() {
  useEffect(() => {
    // Prevent page zoom on input focus for iOS Safari
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Fix iOS keyboard issues
    const fixIOSKeyboard = () => {
      // Force all inputs to be at least 16px to prevent zoom
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach((input: Element) => {
        const htmlInput = input as HTMLInputElement;
        const computedStyle = window.getComputedStyle(htmlInput);
        const fontSize = parseFloat(computedStyle.fontSize);
        
        if (fontSize < 16) {
          htmlInput.style.fontSize = '16px';
        }
      });
    };

    // Handle virtual keyboard on mobile
    const handleViewportChange = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Add event listeners
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    // Initial setup
    fixIOSKeyboard();
    handleViewportChange();

    // Visual viewport API support
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport!;
      
      const handleVisualViewportChange = () => {
        const viewport = visualViewport;
        document.documentElement.style.setProperty('--visual-viewport-height', `${viewport.height}px`);
        document.documentElement.style.setProperty('--visual-viewport-width', `${viewport.width}px`);
      };

      visualViewport.addEventListener('resize', handleVisualViewportChange);
      visualViewport.addEventListener('scroll', handleVisualViewportChange);
      
      // Initial call
      handleVisualViewportChange();

      return () => {
        document.removeEventListener('touchstart', preventZoom);
        document.removeEventListener('touchend', preventDoubleTapZoom);
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('orientationchange', handleViewportChange);
        visualViewport.removeEventListener('resize', handleVisualViewportChange);
        visualViewport.removeEventListener('scroll', handleVisualViewportChange);
      };
    }

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchend', preventDoubleTapZoom);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  return null;
}