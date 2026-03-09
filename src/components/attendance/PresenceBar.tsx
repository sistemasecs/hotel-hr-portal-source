"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function PresenceBar() {
    const { user } = useAuth();
    const { clockIn, clockOut, shifts, fetchUserShifts, hotelConfig } = useData();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchUserShifts(user.id);
        }
    }, [user?.id]);

    const activeShift = shifts.find(s => s.status === 'Clocked-in');
    const upcomingShift = shifts.find(s => s.status === 'Scheduled');

    const handleClockAction = (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        setLoading(true);
        setLocationError(null);

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
                setLocationError("Please enable location services to clock in/out");
                setLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    if (!user) return null;

    return (
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
            <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        {activeShift ? 'Currently Working' : 'Not Clocked In'}
                    </p>
                    {upcomingShift && !activeShift && (
                        <p className="text-xs text-slate-500">Next shift: {new Date(upcomingShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-4">
                {locationError && (
                    <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">
                        {locationError}
                    </span>
                )}

                {!activeShift ? (
                    <button
                        onClick={() => handleClockAction('CLOCK_IN')}
                        disabled={loading}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-full transition-all shadow-md disabled:opacity-50 flex items-center"
                    >
                        {loading ? (
                            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : null}
                        CLOCK IN
                    </button>
                ) : (
                    <button
                        onClick={() => handleClockAction('CLOCK_OUT')}
                        disabled={loading}
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-full transition-all shadow-md disabled:opacity-50 flex items-center"
                    >
                        {loading ? (
                            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : null}
                        CLOCK OUT
                    </button>
                )}
            </div>
        </div>
    );
}
