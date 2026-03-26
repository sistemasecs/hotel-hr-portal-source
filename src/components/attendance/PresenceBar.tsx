"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Shift } from '@/types';
import WorkTimer from './WorkTimer';
import LiveClock from './LiveClock';
import { ensureGuatemalaDate } from '@/lib/dateUtils';
import { LogIn, LogOut, Info, Bell, Check, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PresenceBar() {
    const { user } = useAuth();
    const { clockIn, clockOut, shifts, fetchUserShifts, activeShift, notifications, fetchNotifications, markNotificationAsRead } = useData();
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [clockInReason, setClockInReason] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (user?.id) {
            fetchUserShifts(user.id);
            fetchNotifications(user.id);

            // Poll for live notifications every 60 seconds
            intervalId = setInterval(() => {
                fetchNotifications(user.id);
            }, 60000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [user?.id]);

    // Unread count
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleMarkAllRead = () => {
        if (user?.id) {
            markNotificationAsRead('', user.id, true);
        }
    };

    const upcomingShift = shifts.find((s: Shift) => s.status === 'Scheduled');

    const handleClockAction = (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
        if (!navigator.geolocation) {
            setStatusMessage({ text: "Geolocation is not supported by your browser", type: 'error' });
            return;
        }

        // If clocking in without a scheduled shift, ask for a reason first
        if (type === 'CLOCK_IN' && !upcomingShift) {
            setShowReasonModal(true);
            return;
        }

        executeClockAction(type);
    };

    const executeClockAction = (type: 'CLOCK_IN' | 'CLOCK_OUT', reason?: string) => {
        if (!navigator.geolocation) {
            setStatusMessage({ text: "Geolocation is not supported by your browser", type: 'error' });
            return;
        }

        setLoading(true);
        setStatusMessage(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    if (type === 'CLOCK_IN') {
                        await clockIn(user!.id, latitude, longitude, upcomingShift?.id, reason);
                    } else {
                        await clockOut(user!.id, latitude, longitude, activeShift?.id);
                    }
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error("Error getting location:", error);
                setStatusMessage({ text: "Please enable location services to clock in/out", type: 'error' });
                setLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleReasonSubmit = () => {
        setShowReasonModal(false);
        executeClockAction('CLOCK_IN', clockInReason);
        setClockInReason('');
    };

    if (!user) return null;

    return (<>
        <div className="bg-white border-b border-slate-200 px-4 py-3 md:px-6 md:py-4 shadow-sm sticky top-0 z-30 w-full transition-all no-print">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
                
                {/* Mobile: Top Row for Status and Menu Space */}
                <div className="flex items-start justify-between w-full lg:w-auto pr-14 lg:pr-0">
                    <div className="flex items-center space-x-3 lg:pr-6 lg:border-r lg:border-slate-100">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${activeShift ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">
                                {activeShift ? 'Currently Working' : 'Not Clocked In'}
                            </p>
                            {upcomingShift && !activeShift && (
                                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mt-0.5 flex items-center">
                                    <Info className="w-3 h-3 mr-1 opacity-70" />
                                    Next: {new Intl.DateTimeFormat([], {
                                        hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala', hour12: true
                                    }).format(new Date(ensureGuatemalaDate(upcomingShift.start_time)))}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="hidden sm:flex lg:hidden items-center space-x-4">
                        <LiveClock />
                        {activeShift && <WorkTimer startTime={activeShift.actual_start_time || activeShift.start_time} />}
                    </div>
                </div>

                {/* Mobile only elements: Live Clock & Timer */}
                <div className="flex sm:hidden items-center justify-between w-full bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <LiveClock />
                    {activeShift && <WorkTimer startTime={activeShift.actual_start_time || activeShift.start_time} />}
                </div>
                
                {/* Desktop view for clocks */}
                <div className="hidden lg:flex items-center space-x-6 flex-1 px-4">
                    <LiveClock />
                    {activeShift && <WorkTimer startTime={activeShift.actual_start_time || activeShift.start_time} />}
                </div>

                {/* Notifications & Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 lg:gap-4 w-full lg:w-auto relative">
                    
                    {/* Announcements Button */}
                    <Link
                        href="/dashboard/broadcasts"
                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-primary-600 transition-colors flex items-center justify-center relative group"
                        title={t('announcements') || 'Announcements'}
                    >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </Link>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 rounded-xl transition-all relative group ${showNotifications ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                        >
                            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown (Glassmorphism) */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
                                    <h3 className="font-bold text-slate-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={handleMarkAllRead}
                                            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                                        >
                                            <Check className="w-3 h-3 mr-1" />
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[70vh] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        <div className="divide-y divide-slate-50">
                                            {notifications.map((notification) => (
                                                <div 
                                                    key={notification.id} 
                                                    className={`p-4 transition-colors hover:bg-white/50 group cursor-pointer ${!notification.is_read ? 'bg-primary-50/30' : ''}`}
                                                    onClick={() => {
                                                        markNotificationAsRead(notification.id);
                                                        if (notification.link) window.location.href = notification.link;
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-sm font-bold ${notification.is_read ? 'text-slate-700' : 'text-slate-900 text-primary-700'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[10px] font-medium text-slate-400">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    {notification.link && (
                                                        <div className="mt-2 flex items-center text-xs font-bold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            View details <ExternalLink className="w-3 h-3 ml-1" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 px-6 text-center">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Bell className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-400">No notifications yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {statusMessage && (
                        <span className={`text-xs font-medium px-3 py-2 rounded-lg text-center shadow-sm w-full sm:w-auto ${statusMessage.type === 'error' ? 'text-red-700 bg-red-50 border border-red-100' :
                            statusMessage.type === 'success' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' :
                                'text-blue-700 bg-blue-50 border border-blue-100'
                            }`}>
                            {statusMessage.text}
                        </span>
                    )}

                    {!activeShift ? (
                        <button
                            onClick={() => handleClockAction('CLOCK_IN')}
                            disabled={loading}
                            className="w-full sm:w-auto px-6 py-3 lg:py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center whitespace-nowrap group"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 mr-2 text-white/70" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <LogIn className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            )}
                            CLOCK IN
                        </button>
                    ) : (
                        <button
                            onClick={() => handleClockAction('CLOCK_OUT')}
                            disabled={loading}
                            className="w-full sm:w-auto px-6 py-3 lg:py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center whitespace-nowrap group"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 mr-2 text-white/70" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <LogOut className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            )}
                            CLOCK OUT
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Floating Shift Reason Modal */}
        {showReasonModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            {language === 'es' ? '⚠️ Sin turno programado' : '⚠️ No Scheduled Shift'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {language === 'es' ? 'Por favor indica el motivo por el que estás registrando tu entrada.' : 'Please provide the reason you are clocking in without a scheduled shift.'}
                        </p>
                    </div>
                    <textarea
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={3}
                        placeholder={language === 'es' ? 'Ej: Cubriendo a un compañero, evento especial...' : 'e.g. Covering for a colleague, special event...'}
                        value={clockInReason}
                        onChange={e => setClockInReason(e.target.value)}
                        autoFocus
                    />
                    <div className="flex space-x-3">
                        <button
                            onClick={() => { setShowReasonModal(false); setClockInReason(''); }}
                            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            {language === 'es' ? 'Cancelar' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleReasonSubmit}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                        >
                            {language === 'es' ? 'Confirmar entrada' : 'Confirm Clock In'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>);
}

