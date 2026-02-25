
import { ReactNode } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageAwareRouterProps {
  children: ReactNode;
}

export function LanguageAwareRouter({ children }: LanguageAwareRouterProps) {
  const { direction } = useLanguage();
  
  return (
    <div dir={direction} className="min-h-screen">
      {children}
    </div>
  );
}
