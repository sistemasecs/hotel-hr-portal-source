"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Shift } from '@/types';
import WorkTimer from './WorkTimer';
import LiveClock from './LiveClock';
import { ensureGuatemalaDate } from '@/lib/dateUtils';
import { LogIn, LogOut, Info } from 'lucide-react';

export default function PresenceBar() {
    const { user } = useAuth();
    const { clockIn, clockOut, shifts, fetchUserShifts, activeShift } = useData();
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchUserShifts(user.id);
        }
    }, [user?.id]);

    const upcomingShift = shifts.find((s: Shift) => s.status === 'Scheduled');

    const handleClockAction = (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
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
                        await clockIn(user!.id, latitude, longitude, upcomingShift?.id);
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

    if (!user) return null;

    return (
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
                                    }).format(ensureGuatemalaDate(upcomingShift.start_time))}
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

                {/* Action Buttons & Status Message */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 lg:gap-4 w-full lg:w-auto">
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
    );
}
