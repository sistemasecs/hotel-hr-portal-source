"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import Sidebar from '@/components/Sidebar';
import PresenceBar from '@/components/attendance/PresenceBar';

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
  const { isUserOnboarded } = useData();
  const router = useRouter();
  const pathname = usePathname();

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

  if (!isAuthenticated) return null;

  const isOnboardingFlow = user && !isUserOnboarded(user);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {!isOnboardingFlow && <Sidebar />}
      <div className={`flex-1 flex flex-col ${!isOnboardingFlow ? 'md:ml-64' : ''} overflow-hidden`}>
        <PresenceBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full relative">
          {children}
        </main>
      </div>
    </div>
  );
}
