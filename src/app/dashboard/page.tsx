"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

export default function DashboardPage() {
  const { user: authUser } = useAuth();
  const { events, userTrainings, trainingModules, employeesOfTheMonth, users } = useData();
  const { t } = useLanguage();

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  };

  if (!authUser) return null;

  const currentUser = users.find(u => u.id === authUser.id) || authUser;

  // Get upcoming events
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Get pending trainings
  const pendingTrainings = userTrainings
    .filter(ut => ut.userId === currentUser.id && ut.status !== 'Completed')
    .map(ut => {
      const module = trainingModules.find(m => m.id === ut.moduleId);
      return { ...ut, module };
    })
    .filter(ut => ut.module);

  // Get current Employee of the Month
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentEotmRecord = employeesOfTheMonth.find(e => e.month === currentMonthStr);
  const currentEotmUser = currentEotmRecord ? users.find(u => u.id === currentEotmRecord.userId) : null;

  const adminLinks = [
    { 
      name: t('staffDirectory'), 
      tab: 'Directory', 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ), 
      desc: t('manageEmployeeProfiles') 
    },
    { 
      name: t('complianceOverview'), 
      tab: 'Training', 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      desc: t('trackTrainingCompletion') 
    },
    { 
      name: t('manageDepartments'), 
      tab: 'Departments', 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ), 
      desc: t('manageHotelDepartments') 
    },
    { 
      name: t('cultureHubEvents'), 
      tab: 'Events', 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ), 
      desc: t('scheduleCultureEvents') 
    },
    { 
      name: t('learningModules'), 
      tab: 'Modules', 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ), 
      desc: t('createTrainingContent') 
    },
    { 
      name: t('recognition'), 
      tab: 'Recognition', 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ), 
      desc: t('employeeOfTheMonth') 
    },
    { 
      name: t('settings'), 
      tab: 'Settings', 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ), 
      desc: t('portalConfiguration') 
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-center space-x-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {currentUser.avatarUrl ? (
          <img 
            src={currentUser.avatarUrl} 
            alt={currentUser.name} 
            className={`w-20 h-20 rounded-full border-4 border-white shadow-sm ${currentUser.avatarFit === 'contain' ? 'object-contain bg-slate-100' : 'object-cover'}`}
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-sm">
            {currentUser.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('welcomeBack')}, {currentUser.name}</h1>
          <p className="text-slate-500 mt-1 font-medium">{currentUser.role} • {currentUser.department}</p>
          <p className="text-slate-400 text-sm mt-1">{t('heresWhatsHappening')}</p>
        </div>
      </header>

      {/* Employee of the Month Banner */}
      {currentEotmUser && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white flex items-center justify-between overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute right-20 -bottom-10 w-32 h-32 bg-primary-400 opacity-20 rounded-full blur-xl"></div>
          
          <div className="relative z-10 flex items-center space-x-6">
            {currentEotmUser.avatarUrl ? (
              <img 
                src={currentEotmUser.avatarUrl} 
                alt={currentEotmUser.name} 
                className={`w-20 h-20 rounded-full shadow-inner border-4 border-primary-300 ${currentEotmUser.avatarFit === 'contain' ? 'object-contain bg-white' : 'object-cover'}`}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white text-primary-600 flex items-center justify-center text-3xl font-bold shadow-inner border-4 border-primary-300">
                {currentEotmUser.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Employee of the Month
                </span>
                <span className="text-primary-200 text-sm font-medium">
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{currentEotmUser.name}</h2>
              <p className="text-primary-100">{currentEotmUser.department}</p>
            </div>
          </div>
          <div className="relative z-10 hidden md:block text-right">
            <p className="text-sm text-primary-100 max-w-xs italic">
              "Recognized for outstanding performance, peer support, and dedication to our hotel's values."
            </p>
            <Link href="/dashboard/culture" className="inline-block mt-3 text-sm font-medium text-white hover:text-primary-200 underline decoration-primary-400 underline-offset-4 transition-colors">
              Congratulate {currentEotmUser.name.split(' ')[0]} &rarr;
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quick Actions / Status */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">{t('yourStatus')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-primary-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-primary-600">{t('pendingTrainings')}</p>
                <p className="text-2xl font-bold text-primary-900">{pendingTrainings.length}</p>
              </div>
              <Link href="/dashboard/learning" className="text-sm font-medium text-primary-600 hover:text-primary-800">
                {t('viewAll')} &rarr;
              </Link>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-600">My Requests</p>
                <p className="text-xs text-blue-500 mt-1">Submit and track HR requests</p>
              </div>
              <Link href="/dashboard/requests" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                View &rarr;
              </Link>
            </div>
            {(currentUser.role === 'HR Admin' || currentUser.role === 'Supervisor') && (
              <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-amber-600">Pending Approvals</p>
                  <p className="text-xs text-amber-500 mt-1">Review employee requests</p>
                </div>
                <Link href="/dashboard/requests/approvals" className="text-sm font-medium text-amber-600 hover:text-amber-800">
                  Review &rarr;
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-800">{t('upcomingEvents')}</h2>
            <Link href="/dashboard/culture" className="text-sm font-medium text-primary-600 hover:text-primary-800">
              {t('cultureHub')} &rarr;
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <div key={event.id} className="flex items-start space-x-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs font-bold uppercase">{parseDate(event.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-lg font-bold leading-none">{parseDate(event.date).getDate()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                    <p className="text-xs text-slate-500">{event.type} {event.location ? `• ${event.location}` : ''}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{t('noUpcomingEvents')}</p>
            )}
          </div>
        </section>
      </div>

      {/* HR Admin Quick Links */}
      {currentUser.role === 'HR Admin' && (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{t('hrAdministration')}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('quickAccessTools')}</p>
            </div>
            <Link href="/dashboard/admin" className="text-sm font-medium text-primary-600 hover:text-primary-800">
              {t('openCommandCenter')} &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminLinks.map((link) => (
              <Link 
                key={link.tab} 
                href={`/dashboard/admin?tab=${link.tab}`}
                className="flex items-start p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <div className="p-2 bg-primary-600 rounded-lg mr-3 group-hover:scale-110 transition-transform shadow-sm">
                  {link.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{link.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
