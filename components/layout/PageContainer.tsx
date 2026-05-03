import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('px-6 py-12 space-y-8 max-w-lg mx-auto pb-24', className)}>
      {children}
    </div>
  );
}
