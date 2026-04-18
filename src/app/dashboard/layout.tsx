"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import Sidebar from '@/components/Sidebar';
import PresenceBar from '@/components/attendance/PresenceBar';
import AppTour from '@/components/guide/AppTour';
import HelpCenter from '@/components/guide/HelpCenter';

// Map routes to the feature key required to access them
const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard/culture': 'nav_culture',
  '/dashboard/learning': 'nav_learning',
  '/dashboard/schedules': 'nav_schedules',
  '/dashboard/requests': 'nav_requests',
  '/dashboard/broadcasts': 'nav_broadcasts',
  '/dashboard/celebrations': 'nav_celebrations',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, can } = useAuth();
  const { isUserOnboarded, users } = useData();
  const router = useRouter();
  const pathname = usePathname();

  // Unified sidebar/mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Tour & Help Center state
  const [showTour, setShowTour] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    if (user && !isUserOnboarded(user)) {
      const isAllowedPath = pathname === '/dashboard/onboarding' || pathname.startsWith('/dashboard/learning/');
      if (!isAllowedPath) {
        router.push('/dashboard/onboarding');
        return;
      }
    }
    // Block direct URL access to permission-gated routes
    const requiredFeature = ROUTE_PERMISSION_MAP[pathname];
    if (requiredFeature && !can(requiredFeature)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, isUserOnboarded, pathname, router, can]);

  // Auto-show tour for first-time users on the main dashboard
  useEffect(() => {
    if (!user || pathname !== '/dashboard') return;
    
    // Get the full user from the users array (which includes hasSeenTour from DB)
    const fullUser = users.find(u => u.id === user.id);
    if (fullUser && !fullUser.hasSeenTour) {
      // Small delay so the dashboard renders first and tour targets are available
      const timer = setTimeout(() => setShowTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user, users, pathname]);

  if (!isAuthenticated) return null;

  const isOnboardingFlow = user && !isUserOnboarded(user);

  const handleRestartTour = () => {
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
      // Wait for navigation + render before starting tour
      setTimeout(() => setShowTour(true), 600);
    } else {
      setShowTour(true);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {!isOnboardingFlow && (
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      )}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          !isOnboardingFlow 
            ? (isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64') 
            : ''
        } overflow-hidden`}
      >
        <PresenceBar 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full relative">
          {children}
        </main>
      </div>

      {/* Tour Overlay */}
      {showTour && (
        <AppTour onComplete={() => setShowTour(false)} />
      )}

      {/* Help Center Slide-over */}
      <HelpCenter 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)}
        onRestartTour={handleRestartTour}
      />
    </div>
  );
}
