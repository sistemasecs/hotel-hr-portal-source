"use client";

import React, { useState, useEffect } from 'react';

interface WorkTimerProps {
    startTime: string | null; // ISO timestamp
}

export default function WorkTimer({ startTime }: WorkTimerProps) {
    const [elapsed, setElapsed] = useState<string>("00:00:00");

    useEffect(() => {
        if (!startTime) {
            setElapsed("00:00:00");
            return;
        }

        const start = new Date(startTime).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = Math.max(0, now - start);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setElapsed(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-mono font-bold text-slate-700 tracking-wider">
                {elapsed}
            </span>
        </div>
    );
}
