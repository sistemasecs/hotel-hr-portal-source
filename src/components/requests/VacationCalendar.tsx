'use client';

import React, { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO, 
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { EmployeeRequest } from '@/types';

interface VacationCalendarProps {
  vacations: EmployeeRequest[];
}

export default function VacationCalendar({ vacations }: VacationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200 opacity-50';
      case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200'; // Pending
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button onClick={today} className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors">
            Today
          </button>
          <button onClick={prevMonth} className="p-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={nextMonth} className="p-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-sm text-slate-500 py-2">
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b border-slate-200">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Find vacations that overlap with this day
        const dayVacations = vacations.filter(v => {
          if (!v.data?.startDate || !v.data?.endDate) return false;
          const vStart = startOfDay(parseISO(v.data.startDate));
          const vEnd = endOfDay(parseISO(v.data.endDate));
          return isWithinInterval(cloneDay, { start: vStart, end: vEnd });
        });

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] border-b border-r border-slate-100 p-1 flex flex-col ${
              !isSameMonth(day, monthStart)
                ? 'bg-slate-50 text-slate-400'
                : isSameDay(day, new Date())
                ? 'bg-blue-50 text-blue-600 font-bold'
                : 'bg-white text-slate-700'
            }`}
          >
            <span className="text-xs p-1">{formattedDate}</span>
            <div className="flex-1 overflow-y-auto space-y-1 mt-1 no-scrollbar">
              {dayVacations.map((vacation, idx) => (
                <div 
                  key={`${vacation.id}-${idx}`}
                  className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${getStatusColor(vacation.status)}`}
                  title={`${vacation.userName} (${vacation.status})`}
                >
                  {vacation.userName?.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-l border-t border-slate-200">{rows}</div>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-600">
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200 mr-2"></span> Pending</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200 mr-2"></span> Approved</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-100 border border-rose-200 mr-2"></span> Rejected</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 mr-2"></span> Completed</div>
      </div>
    </div>
  );
}
