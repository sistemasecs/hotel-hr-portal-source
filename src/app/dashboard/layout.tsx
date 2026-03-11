"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import Sidebar from '@/components/Sidebar';
import PresenceBar from '@/components/attendance/PresenceBar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();
  const { isUserOnboarded } = useData();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    } else if (user && !isUserOnboarded(user)) {
      // Allow access to onboarding and specific learning modules
      const isAllowedPath = pathname === '/dashboard/onboarding' || pathname.startsWith('/dashboard/learning/');
      if (!isAllowedPath) {
        router.push('/dashboard/onboarding');
      }
    }
  }, [isAuthenticated, user, isUserOnboarded, pathname, router]);

  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  // If not onboarded and on the onboarding page, hide sidebar
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
