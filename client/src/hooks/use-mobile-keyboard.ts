import { useState, useEffect } from 'react';

interface MobileKeyboardState {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  viewportHeight: number;
}

export function useMobileKeyboard(): MobileKeyboardState {
  const [keyboardState, setKeyboardState] = useState<MobileKeyboardState>({
    isKeyboardVisible: false,
    keyboardHeight: 0,
    viewportHeight: window.innerHeight,
  });

  useEffect(() => {
    let initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // If height difference is significant (more than 150px), keyboard is likely visible
      const isKeyboardVisible = heightDifference > 150;
      const keyboardHeight = isKeyboardVisible ? heightDifference : 0;

      setKeyboardState({
        isKeyboardVisible,
        keyboardHeight,
        viewportHeight: currentHeight,
      });

      // Adjust body style to prevent scrolling issues
      if (isKeyboardVisible) {
        document.body.style.height = `${currentHeight}px`;
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.height = '100%';
        document.body.style.overflow = 'auto';
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Small delay to allow keyboard to appear
        setTimeout(() => {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 300);
      }
    };

    const handleFocusOut = () => {
      // Reset viewport when keyboard disappears
      setTimeout(() => {
        window.scrollTo(0, 0);
        setKeyboardState(prev => ({
          ...prev,
          isKeyboardVisible: false,
          keyboardHeight: 0,
        }));
        document.body.style.height = '100%';
        document.body.style.overflow = 'auto';
      }, 300);
    };

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Listen for input focus/blur events
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Visual viewport API support (for newer browsers)
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport!;
      
      const handleVisualViewportChange = () => {
        const keyboardHeight = initialHeight - visualViewport.height;
        const isKeyboardVisible = keyboardHeight > 50;
        
        setKeyboardState({
          isKeyboardVisible,
          keyboardHeight: isKeyboardVisible ? keyboardHeight : 0,
          viewportHeight: visualViewport.height,
        });
      };

      visualViewport.addEventListener('resize', handleVisualViewportChange);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('focusout', handleFocusOut);
        visualViewport.removeEventListener('resize', handleVisualViewportChange);
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return keyboardState;
}

// Hook for checking if device is mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}