import React, { useEffect, useRef } from 'react';
import { useMobileKeyboard } from '@/hooks/use-mobile-keyboard';
import { cn } from '@/lib/utils';

interface MobileInputWrapperProps {
  children: React.ReactNode;
  className?: string;
  scrollToInput?: boolean;
}

export default function MobileInputWrapper({ 
  children, 
  className,
  scrollToInput = true 
}: MobileInputWrapperProps) {
  const { isKeyboardVisible, keyboardHeight } = useMobileKeyboard();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isKeyboardVisible && scrollToInput && wrapperRef.current) {
      // Scroll the input into view when keyboard appears
      setTimeout(() => {
        wrapperRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [isKeyboardVisible, scrollToInput]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'mobile-input-container transition-all duration-300',
        className
      )}
      style={{
        paddingBottom: isKeyboardVisible ? `${Math.min(keyboardHeight, 100)}px` : '0px',
        transform: isKeyboardVisible ? 'translateY(-20px)' : 'translateY(0px)',
      }}
    >
      {children}
    </div>
  );
}