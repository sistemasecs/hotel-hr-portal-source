"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import PresenceBar from '@/components/attendance/PresenceBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 overflow-hidden">
        <PresenceBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
