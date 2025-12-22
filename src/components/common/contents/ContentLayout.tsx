import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/LayoutPage';
import { cn } from '@/lib/utils';

interface ContentLayoutProps {
  children: ReactNode;
  className?: string;
}

export const ContentLayout = ({ 
  children, 
  className,
}: ContentLayoutProps) => {
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className={cn("flex-1 overflow-auto", className)}>
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContentLayout;
