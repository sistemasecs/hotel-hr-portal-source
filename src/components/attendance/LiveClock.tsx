"use client";

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function LiveClock() {
    const [time, setTime] = useState<string>('');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const timeStr = new Intl.DateTimeFormat([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'America/Guatemala',
                hour12: true
            }).format(now);
            setTime(timeStr);
        };

        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-sm font-mono font-bold text-slate-700 tracking-wider">
                {time || '--:--:--'}
            </span>
        </div>
    );
}
