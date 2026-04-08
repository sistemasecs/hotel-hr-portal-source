"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user: authUser, isAdmin, logout, can } = useAuth();
  const { users } = useData();
  const { t } = useLanguage();

  const isAdminPage = pathname.startsWith('/dashboard/admin');

  if (!authUser) return null;

  const currentUser = users.find(u => u.id === authUser.id) || authUser;

  const navItems = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      featureKey: 'nav_dashboard',
      icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>)
    },
    {
      name: t('cultureHub'),
      href: '/dashboard/culture',
      featureKey: 'nav_culture',
      icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>)
    },
    {
      name: t('learningCenter'),
      href: '/dashboard/learning',
      featureKey: 'nav_learning',
      icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>)
    },
    {
      name: t('schedules'),
      href: '/dashboard/schedules',
      featureKey: 'nav_schedules',
      icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>)
    },
    {
      name: t('requests'),
      href: '/dashboard/requests',
      featureKey: 'nav_requests',
      icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>)
    },
    {
      name: t('announcements'),
      href: '/dashboard/broadcasts',
      featureKey: 'nav_broadcasts',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.167H3.3a1.598 1.598 0 01-1.3-1.583V9.52a1.598 1.598 0 011.3-1.583h1.136l2.147-6.167A1.76 1.76 0 0111 2.358v3.524zM12.867 19.605a8.96 8.96 0 000-15.212M15.717 16.756a5.963 5.963 0 000-9.512" />
        </svg>
      )
    },
    {
      name: t('celebrations'),
      href: '/dashboard/celebrations',
      featureKey: 'nav_celebrations',
      icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>)
    },
  ];

  const adminNavItems: { name: string; tab?: string; href?: string; featureKey: string | null; icon: React.ReactNode }[] = [
    { name: t('backToDashboard'), href: '/dashboard', featureKey: null, icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>) },
    { name: t('staffDirectory'), tab: 'Directory', featureKey: 'admin_directory', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>) },
    { name: t('hierarchy'), tab: 'Hierarchy', featureKey: 'admin_hierarchy', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>) },
    { name: t('manageDepartments'), tab: 'Departments', featureKey: 'admin_departments', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>) },
    { name: t('complianceOverview'), tab: 'Training', featureKey: 'admin_training', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
    { name: t('cultureHubEvents'), tab: 'Events', featureKey: 'admin_events', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>) },
    { name: t('recognition'), tab: 'Recognition', featureKey: 'admin_recognition', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>) },
    { name: t('attendance'), tab: 'Attendance', featureKey: 'admin_attendance', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
    { name: t('vacationManagement'), tab: 'Vacations', featureKey: 'admin_vacations', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>) },
    { name: t('documentTemplates'), tab: 'Documents', featureKey: 'admin_documents', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>) },
    { name: t('activityLog'), tab: 'Activity', featureKey: 'admin_activity', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>) },
    { name: t('holidays'), tab: 'Holidays', featureKey: 'admin_holidays', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>) },
    { name: 'Roles & Permisos', tab: 'Roles', featureKey: 'admin_roles', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>) },
    ...(currentUser.name === 'Carlos Lara' ? [{ name: t('settings'), tab: 'Settings', featureKey: 'admin_settings', icon: (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) }] : []),
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-3 right-3 z-50 p-2 bg-slate-900 text-white rounded-md shadow-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div className={`w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight">El Carmen Hotel</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
            {isAdminPage ? t('hrAdmin') : t('employeePortal')}
          </p>
        </div>

        <Link href="/dashboard/profile" onClick={handleLinkClick} className="block p-6 border-b border-slate-800 hover:bg-slate-800 transition-colors group">
          <div className="flex items-center space-x-3">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className={`w-10 h-10 rounded-full ${currentUser.avatarFit === 'contain' ? 'object-contain bg-slate-100' : 'object-cover'}`} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold group-hover:bg-primary-500 transition-colors">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium group-hover:text-primary-300 transition-colors">{currentUser.name}</p>
              <p className="text-xs text-slate-400">{currentUser.role} • {currentUser.department}</p>
            </div>
          </div>
        </Link>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {!isAdminPage ? (
            <>
              {navItems.filter(item => can(item.featureKey)).map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
                return (
                  <Link key={item.name} href={item.href} onClick={handleLinkClick}
                    className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                  >
                    {item.icon}{item.name}
                  </Link>
                );
              })}
              {isAdmin && can('admin_panel') && (
                <Link href="/dashboard/admin" onClick={handleLinkClick}
                  className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${pathname.startsWith('/dashboard/admin') ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{t('hrAdmin')}</span>
                </Link>
              )}
            </>
          ) : (
            <>
              {adminNavItems.filter(item => item.featureKey === null || can(item.featureKey)).map((item) => {
                const currentTab = searchParams.get('tab') || 'Directory';
                const isActive = item.href ? pathname === item.href : (pathname === '/dashboard/admin' && currentTab === item.tab);
                return (
                  <Link key={item.name} href={item.href || `/dashboard/admin?tab=${item.tab}`} onClick={handleLinkClick}
                    className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                  >
                    {item.icon}{item.name}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            {t('signOut')}
          </button>
        </div>
      </div>
    </>
  );
}
