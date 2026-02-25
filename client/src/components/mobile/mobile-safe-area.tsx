import React from 'react';
import { useMobileKeyboard, useIsMobile } from '@/hooks/use-mobile-keyboard';
import { cn } from '@/lib/utils';

interface MobileSafeAreaProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileSafeArea({ children, className }: MobileSafeAreaProps) {
  const { isKeyboardVisible, viewportHeight } = useMobileKeyboard();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn(
        'flex flex-col transition-all duration-300 ease-in-out',
        className
      )}
      style={{
        height: `${viewportHeight}px`,
        maxHeight: `${viewportHeight}px`,
        overflow: 'hidden'
      }}
    >
      <div 
        className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch"
        style={{
          paddingBottom: isKeyboardVisible ? '20px' : '0px',
        }}
      >
        {children}
      </div>
    </div>
  );
}