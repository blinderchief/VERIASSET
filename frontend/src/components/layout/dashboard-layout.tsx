'use client';

import { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
}

export function DashboardLayout({ 
  children, 
  showSidebar = true,
  showFooter = true 
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header />
      <div className="flex pt-16">
        {showSidebar && <DashboardSidebar />}
        <main className={`flex-1 ${showSidebar ? 'ml-0 lg:ml-64' : ''}`}>
          {children}
        </main>
      </div>
      {showFooter && (
        <div className={showSidebar ? 'lg:ml-64' : ''}>
          <Footer />
        </div>
      )}
    </div>
  );
}
