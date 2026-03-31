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
import { LogIn, LogOut, Info, Bell, Check, Megaphone } from 'lucide-react';
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

    const statusLabel = activeShift
        ? (language === 'es' ? 'Trabajando' : 'Currently Working')
        : (language === 'es' ? 'Descansando' : 'Not Clocked In');

    return (
        <>
            <div className="bg-white border-b border-slate-200 px-4 py-3 md:px-6 md:py-4 shadow-sm sticky top-0 z-30 w-full transition-all no-print">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 lg:pr-6 lg:border-r lg:border-slate-100">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${activeShift ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">
                                {statusLabel}
                            </p>
                            {upcomingShift && !activeShift && (
                                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mt-0.5 flex items-center">
                                    <Info className="w-3 h-3 mr-1 opacity-70" />
                                    {language === 'es' ? 'Siguiente:' : 'Next:'} {new Intl.DateTimeFormat([], {
                                        hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala', hour12: true
                                    }).format(new Date(ensureGuatemalaDate(upcomingShift.start_time)))}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mr-12">
                        <Link
                            href="/dashboard/broadcasts"
                            className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-primary-600 transition-colors flex items-center justify-center"
                            title={t('announcements') || (language === 'es' ? 'Anuncios' : 'Announcements')}
                        >
                            <Megaphone className="w-5 h-5" />
                        </Link>

                        <button
                            onClick={() => handleClockAction(activeShift ? 'CLOCK_OUT' : 'CLOCK_IN')}
                            disabled={loading}
                            className={`p-2 rounded-xl transition-colors flex items-center justify-center ${activeShift ? 'text-rose-700 bg-rose-100 hover:bg-rose-200' : 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200'}`}
                            title={activeShift ? (language === 'es' ? 'Cerrar turno' : 'Clock Out') : (language === 'es' ? 'Iniciar turno' : 'Clock In')}
                        >
                            {activeShift ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(prev => !prev)}
                                className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-primary-600 transition-colors flex items-center justify-center"
                                title={t('notifications') || (language === 'es' ? 'Notificaciones' : 'Notifications')}
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-slate-600">{language === 'es' ? 'Notificaciones' : 'Notifications'}</span>
                                        <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:underline">
                                            {language === 'es' ? 'Marcar todas' : 'Mark all read'}
                                        </button>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <p className="text-sm text-slate-500">{language === 'es' ? 'No hay notificaciones' : 'No notifications'}</p>
                                    ) : (
                                        <ul className="max-h-60 overflow-auto space-y-2">
                                            {notifications.map((notification) => (
                                                <li key={notification.id} className="p-2 rounded-lg bg-slate-50">
                                                    <p className="text-xs font-semibold text-slate-800">{notification.title}</p>
                                                    <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-nowrap">
                    <div className="w-1/2 min-w-0">
                        <LiveClock />
                    </div>
                    {activeShift && (
                        <div className="w-1/2 min-w-0">
                            <WorkTimer startTime={activeShift.actual_start_time || activeShift.start_time} />
                        </div>
                    )}
                </div>
            </div>

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
        </>
    );
}

