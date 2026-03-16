
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Shift, User, ShiftType } from '@/types';
import ShiftTypesManager from '@/components/admin/ShiftTypesManager';
import { Settings, CheckCircle, XCircle, Clock, Users, CalendarDays, AlertCircle } from 'lucide-react';
import { formatToGuatemalaDateTimeLocal, parseGuatemalaDateTimeLocal } from '@/lib/dateUtils';

interface WeeklySummaryRow {
  user_id: string;
  user_name: string;
  department: string;
  scheduled_hours: number;
  actual_hours: number;
  total_shifts: number;
  approved_shifts: number;
  pending_shifts: number;
}

export default function SchedulesPage() {
    const { user, isAdmin } = useAuth();
    const { shifts, users, fetchShifts, addShift, updateShift, deleteShift, departments, shiftTypes, fetchShiftTypes } = useData();
    const { t, language } = useLanguage();

    const isManager = user?.role === 'Manager' || user?.role === 'Supervisor';
    const canManage = isAdmin || isManager;

    const [showShiftTypes, setShowShiftTypes] = useState(false);
    const [activeView, setActiveView] = useState<'calendar' | 'approvals' | 'summary'>('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [approvingShift, setApprovingShift] = useState<Shift | null>(null);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryRow[]>([]);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [shiftForm, setShiftForm] = useState({
        userId: '',
        startTime: '',
        endTime: '',
        type: '',
        repeatDays: [] as number[] // 0-6 where 0 is Mon (based on current week view)
    });

    // For manager: auto-set their department
    const managerDeptId = useMemo(() => {
        if (!isManager || isAdmin) return '';
        const managerDept = departments.find(d => d.name === user?.department);
        return managerDept?.id || '';
    }, [isManager, isAdmin, user, departments]);

    // Effective department filter
    const effectiveDeptId = isAdmin ? selectedDept : managerDeptId;

    // Calculate week range (Monday - Sunday)
    const weekRange = useMemo(() => {
        const start = new Date(currentDate);
        const day = start.getDay();
        // start.getDay() is 0 (Sun) to 6 (Sat)
        // We want 1 (Mon) to be the start. 
        // If it's Sun, go back 6. If Mon, stay. If Tue, go back 1.
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }, [currentDate]);

    useEffect(() => {
        if (user) {
            const startDate = `${weekRange.start.toISOString().split('T')[0]}T00:00:00.000-06:00`;
            const endDate = `${weekRange.end.toISOString().split('T')[0]}T23:59:59.999-06:00`;
            const filters: any = { startDate, endDate };

            if (canManage && effectiveDeptId) {
                filters.departmentId = effectiveDeptId;
            } else if (canManage && isAdmin && !effectiveDeptId) {
                // Admin with no dept selected: fetch all
            } else if (!canManage) {
                filters.userId = user.id;
            }

            fetchShifts(filters);
        }
    }, [user, weekRange, effectiveDeptId, canManage, isAdmin]);

    useEffect(() => {
        if (canManage) {
            fetchShiftTypes();
        }
    }, [canManage]);

    const fetchWeeklySummary = useCallback(async () => {
        if (!canManage) return;
        setSummaryLoading(true);
        try {
            const startDate = `${weekRange.start.toISOString().split('T')[0]}T00:00:00.000-06:00`;
            const endDate = `${weekRange.end.toISOString().split('T')[0]}T23:59:59.999-06:00`;
            let url = `/api/reports/worked-hours?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
            if (effectiveDeptId) url += `&departmentId=${effectiveDeptId}`;
            const res = await fetch(url);
            const data = await res.json();
            setWeeklySummary(data);
        } finally {
            setSummaryLoading(false);
        }
    }, [canManage, weekRange, effectiveDeptId]);

    useEffect(() => {
        if (activeView === 'summary') fetchWeeklySummary();
    }, [activeView, weekRange, effectiveDeptId]);

    const handleApproveShift = async (shift: Shift, status: 'approved' | 'rejected') => {
        if (!user) return;
        await fetch(`/api/shifts/${shift.id}/approve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, notes: approvalNotes, approvedBy: user.id })
        });
        setApprovingShift(null);
        setApprovalNotes('');
        // Refresh shifts
        const startDate = `${weekRange.start.toISOString().split('T')[0]}T00:00:00.000-06:00`;
        const endDate = `${weekRange.end.toISOString().split('T')[0]}T23:59:59.999-06:00`;
        const filters: any = { startDate, endDate };
        if (effectiveDeptId) filters.departmentId = effectiveDeptId;
        fetchShifts(filters);
    };

    // Translate days (Monday - Sunday)
    const days = language === 'es'
        ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekRange.start);
            d.setDate(weekRange.start.getDate() + i);
            return d;
        });
    }, [weekRange]);

    const handlePrevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
    const handleNextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

    const handleOpenAddModal = (date?: Date, userId?: string) => {
        const start = date ? new Date(date) : new Date();
        start.setHours(8, 0, 0, 0);
        const end = new Date(start);
        end.setHours(16, 0, 0, 0);
        setShiftForm({
            userId: userId || (canManage ? '' : user?.id || ''),
            startTime: formatToGuatemalaDateTimeLocal(start),
            endTime: formatToGuatemalaDateTimeLocal(end),
            type: 'Morning',
            repeatDays: []
        });
        setEditingShift(null);
        setIsShiftModalOpen(true);
    };

    const handleSaveShift = async () => {
        if (!shiftForm.userId || !shiftForm.startTime || !shiftForm.endTime) return;
        
        const baseStartTime = parseGuatemalaDateTimeLocal(shiftForm.startTime);
        const baseEndTime = parseGuatemalaDateTimeLocal(shiftForm.endTime);
        
        // If editing, just update the single shift
        if (editingShift) {
            await updateShift(editingShift.id, {
                userId: shiftForm.userId,
                startTime: baseStartTime,
                endTime: baseEndTime,
                type: shiftForm.type
            } as any);
        } else {
            // New shift creation
            const selectedDays = shiftForm.repeatDays.length > 0 ? shiftForm.repeatDays : [new Date(baseStartTime).getDay()];
            
            // Loop through selected days and create a shift for each
            // Monday-Sunday view handles days differently, but JS getDay() is 0 (Sun) to 6 (Sat)
            // We need to match the day of the week from the startDate range
            
            for (const dayIndex of selectedDays) {
                // Find the date in the current week that matches this dayIndex
                const targetDate = weekDays.find(d => d.getDay() === dayIndex);
                if (targetDate) {
                    const start = new Date(targetDate);
                    const originalStart = new Date(baseStartTime);
                    start.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
                    
                    const end = new Date(start);
                    const originalEnd = new Date(baseEndTime);
                    // Handle overnight shifts
                    const durationMs = new Date(baseEndTime).getTime() - new Date(baseStartTime).getTime();
                    end.setTime(start.getTime() + durationMs);

                    await addShift({
                        userId: shiftForm.userId,
                        startTime: start.toISOString(),
                        endTime: end.toISOString(),
                        type: shiftForm.type,
                        status: 'Scheduled'
                    } as any);
                }
            }
        }
        setIsShiftModalOpen(false);
    };

    const handleDeleteShift = async (id: string) => {
        if (confirm(language === 'es' ? '¿Eliminar este horario?' : 'Delete this shift?')) {
            await deleteShift(id);
        }
    };

    const handleShiftTypeChange = (typeId: string) => {
        const type = shiftTypes.find(t => t.id === typeId);
        if (type) {
            const currentStartStr = shiftForm.startTime ? parseGuatemalaDateTimeLocal(shiftForm.startTime) : new Date().toISOString();
            const startDate = new Date(currentStartStr);
            const endDate = new Date(startDate);
            if (type.start_time_default) {
                const [h, m] = type.start_time_default.split(':');
                startDate.setHours(parseInt(h), parseInt(m), 0, 0);
            }
            if (type.end_time_default) {
                const [h, m] = type.end_time_default.split(':');
                endDate.setHours(parseInt(h), parseInt(m), 0, 0);
                if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
            }
            setShiftForm({
                ...shiftForm,
                type: type.name,
                startTime: formatToGuatemalaDateTimeLocal(startDate),
                endTime: formatToGuatemalaDateTimeLocal(endDate)
            });
        }
    };

    // Pending approval shifts (for manager approvals tab)
    const pendingShifts = useMemo(() => {
        return shifts.filter(s =>
            (s.status === 'Pending Approval' || s.actual_end_time) &&
            (!s.approval_status || s.approval_status === 'pending') &&
            s.actual_start_time
        );
    }, [shifts]);

    // Dept employees (for manager view)
    const deptEmployees = useMemo(() => {
        if (!canManage) return [];
        return users.filter(u => {
            if (isAdmin && !effectiveDeptId) return true;
            return departments.find(d => d.id === effectiveDeptId)?.name === u.department;
        });
    }, [users, effectiveDeptId, isAdmin, canManage, departments]);

    const formatTime = (isoStr: string) =>
        new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala', hour12: true }).format(new Date(isoStr));

    const formatHours = (hours: number) => `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;

    if (!user) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {language === 'es' ? 'Horarios' : 'Schedules'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {isAdmin ? (language === 'es' ? 'Gestionar turnos de departamento' : 'Manage departmental shifts') :
                         isManager ? (language === 'es' ? `Gestionar turnos — ${user.department}` : `Manage shifts — ${user.department}`) :
                         (language === 'es' ? 'Ver tu horario semanal' : 'See your weekly schedule')}
                    </p>
                </div>

                <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-50 rounded-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="px-4 font-semibold text-sm">
                        {weekRange.start.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })} - {weekRange.end.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button onClick={handleNextWeek} className="p-2 hover:bg-slate-50 rounded-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {canManage && (
                    <div className="flex space-x-3">
                        {isAdmin && (
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                            >
                                <option value="">{language === 'es' ? 'Todos los Dptos.' : 'All Departments'}</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        )}
                        {isAdmin && (
                            <button
                                onClick={() => setShowShiftTypes(!showShiftTypes)}
                                className={`p-2 rounded-lg border transition-all ${showShiftTypes ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                title="Manage Shift Types"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={() => handleOpenAddModal()}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 transition-all"
                        >
                            + {language === 'es' ? 'Agregar Turno' : 'Add Shift'}
                        </button>
                    </div>
                )}
            </div>

            {isAdmin && showShiftTypes && effectiveDeptId && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <ShiftTypesManager departmentId={effectiveDeptId} />
                </div>
            )}

            {/* View Tabs for managers/admins */}
            {canManage && (
                <div className="flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-fit p-1 gap-1">
                    {[
                        { 
                            key: 'calendar', 
                            label: language === 'es' ? 'Horario' : 'Calendar',
                            icon: <CalendarDays className="w-4 h-4" />
                        },
                        { 
                            key: 'approvals', 
                            label: language === 'es' ? 'Aprobaciones' : 'Approvals',
                            badge: pendingShifts.length > 0 ? pendingShifts.length : null,
                            icon: <CheckCircle className="w-4 h-4" />
                        },
                        { 
                            key: 'summary', 
                            label: language === 'es' ? 'Resumen' : 'Summary',
                            icon: <Users className="w-4 h-4" />
                        }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveView(tab.key as any)}
                            className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
                                activeView === tab.key 
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span className={`${activeView === tab.key ? 'text-white' : 'text-emerald-600'}`}>
                                {tab.icon}
                            </span>
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className={`ml-1.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full font-black ${
                                    activeView === tab.key ? 'bg-white text-emerald-600' : 'bg-rose-500 text-white'
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* CALENDAR VIEW */}
            {(activeView === 'calendar' || !canManage) && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    {canManage && <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">{language === 'es' ? 'Empleado' : 'Employee'}</th>}
                                    {weekDays.map((date, i) => (
                                        <th key={i} className="p-4 text-center border-l border-slate-100 min-w-[140px]">
                                            <span className="block text-xs font-bold text-slate-500 uppercase">{days[i]}</span>
                                            <span className={`block text-lg ${date.toDateString() === new Date().toDateString() ? 'text-primary-600 font-bold' : 'text-slate-900'}`}>
                                                {date.getDate()}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {canManage && deptEmployees.length > 0 ? (
                                    deptEmployees.map(employee => (
                                        <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                <div className="flex items-center min-w-[180px]">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden mr-3">
                                                        {employee.avatarUrl ? <img src={employee.avatarUrl} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs text-slate-400">?</span>}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{employee.name}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase">{employee.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {weekDays.map((date, i) => {
                                                const dayShifts = shifts.filter(s => s.user_id === employee.id && new Date(s.start_time).toDateString() === date.toDateString());
                                                return (
                                                    <td key={i} className="p-2 border-l border-slate-100 min-h-[80px] group relative">
                                                        {dayShifts.map(shift => (
                                                            <div key={shift.id} className="border border-slate-200 rounded-lg p-2 mb-1 text-xs shadow-sm bg-white" style={{ borderLeft: `4px solid ${shiftTypes.find(t => t.name === shift.type)?.color || '#3b82f6'}` }}>
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="font-bold text-slate-800">{shift.type}</span>
                                                                    <div className="hidden group-hover:flex space-x-1">
                                                                        <button onClick={() => { 
                                                                            setEditingShift(shift); 
                                                                            setShiftForm({ 
                                                                                userId: shift.user_id, 
                                                                                startTime: formatToGuatemalaDateTimeLocal(shift.start_time), 
                                                                                endTime: formatToGuatemalaDateTimeLocal(shift.end_time), 
                                                                                type: shift.type as any,
                                                                                repeatDays: []
                                                                            }); 
                                                                            setIsShiftModalOpen(true); 
                                                                        }} className="text-slate-400 hover:text-primary-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                                        <button onClick={() => handleDeleteShift(shift.id)} className="text-slate-400 hover:text-rose-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-primary-700">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</p>
                                                                {shift.status === 'Pending Approval' && (
                                                                    <span className="mt-1 inline-block text-[9px] bg-amber-100 text-amber-700 font-bold uppercase px-1.5 py-0.5 rounded">⏳ Pending</span>
                                                                )}
                                                                {shift.approval_status === 'approved' && (
                                                                    <span className="mt-1 inline-block text-[9px] bg-emerald-100 text-emerald-700 font-bold uppercase px-1.5 py-0.5 rounded">✓ Approved</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => handleOpenAddModal(date, employee.id)}
                                                            className="w-full py-2 border-2 border-dashed border-slate-100 rounded-lg text-slate-300 hover:border-primary-200 hover:text-primary-400 hover:bg-primary-50 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            +
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                ) : canManage ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-slate-500">
                                            {isAdmin ? (language === 'es' ? 'Selecciona un departamento para ver los turnos.' : 'Select a department to view shifts.') : (language === 'es' ? 'No se encontraron empleados en tu departamento.' : 'No employees found in your department.')}
                                        </td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-0">
                                            <div className="grid grid-cols-7">
                                                {weekDays.map((date, i) => {
                                                    const dayShifts = shifts.filter(s => new Date(s.start_time).toDateString() === date.toDateString());
                                                    return (
                                                        <div key={i} className="p-6 border-l border-slate-100 min-h-[300px] bg-slate-50/30">
                                                            {dayShifts.map(shift => (
                                                                <div key={shift.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4">
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: shiftTypes.find(t => t.name === shift.type)?.color || '#3b82f6' }} />
                                                                        <span className="font-bold text-slate-900 text-sm">{shift.type}</span>
                                                                    </div>
                                                                    <p className="text-slate-600 font-medium">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</p>
                                                                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                        <span>Estado</span>
                                                                        <span className={shift.status === 'Completed' ? 'text-emerald-500' : shift.status === 'Clocked-in' ? 'text-primary-500' : 'text-slate-500'}>{shift.status}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {dayShifts.length === 0 && (
                                                                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl opacity-50">
                                                                    <p className="text-xs text-slate-400 font-medium text-center italic px-4">{language === 'es' ? 'Sin turnos' : 'No shifts'}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* APPROVALS TAB */}
            {activeView === 'approvals' && canManage && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">
                            {language === 'es' ? 'Horas Pendientes de Aprobación' : 'Pending Hour Approvals'}
                        </h2>
                        <span className="text-sm text-slate-500">{pendingShifts.length} {language === 'es' ? 'pendiente(s)' : 'pending'}</span>
                    </div>
                    {pendingShifts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">{language === 'es' ? '¡Todo aprobado! No hay turnos pendientes.' : 'All caught up! No pending shifts.'}</p>
                        </div>
                    ) : (
                        pendingShifts.map(shift => {
                            const emp = users.find(u => u.id === shift.user_id);
                            const actualHours = shift.actual_start_time && shift.actual_end_time
                                ? ((new Date(shift.actual_end_time).getTime() - new Date(shift.actual_start_time).getTime()) / 3600000).toFixed(2)
                                : null;
                            return (
                                <div key={shift.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                                                {emp?.avatarUrl ? <img src={emp.avatarUrl} className="w-full h-full object-cover" alt={emp.name} /> : <span className="flex h-full items-center justify-center text-slate-400 font-bold text-sm">{emp?.name?.charAt(0)}</span>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{emp?.name || 'Unknown'}</p>
                                                <p className="text-sm text-slate-500">{emp?.department} — {emp?.role}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-400 font-semibold uppercase">{language === 'es' ? 'Tipo' : 'Type'}</p>
                                                <p className="font-bold text-slate-700">{shift.type}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-semibold uppercase">{language === 'es' ? 'Fecha' : 'Date'}</p>
                                                <p className="font-bold text-slate-700">{shift.actual_start_time ? new Date(shift.actual_start_time).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-semibold uppercase">{language === 'es' ? 'Entrada → Salida' : 'In → Out'}</p>
                                                <p className="font-bold text-slate-700">
                                                    {shift.actual_start_time ? formatTime(shift.actual_start_time) : '—'} → {shift.actual_end_time ? formatTime(shift.actual_end_time) : '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-semibold uppercase">{language === 'es' ? 'Hrs. Trabajadas' : 'Hours Worked'}</p>
                                                <p className="font-bold text-emerald-600">{actualHours ? `${actualHours}h` : '—'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {shift.clock_in_reason && (
                                        <div className="px-5 pb-3">
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-2">
                                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-amber-700 uppercase">{language === 'es' ? 'Turno flotante — Motivo del empleado' : 'Floating Shift — Employee Reason'}</p>
                                                    <p className="text-sm text-amber-800 mt-0.5">"{shift.clock_in_reason}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {approvingShift?.id === shift.id ? (
                                        <div className="px-5 pb-5 space-y-3">
                                            <textarea
                                                className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none"
                                                rows={2}
                                                placeholder={language === 'es' ? 'Notas de aprobación (opcional)...' : 'Approval notes (optional)...'}
                                                value={approvalNotes}
                                                onChange={e => setApprovalNotes(e.target.value)}
                                            />
                                            <div className="flex space-x-3">
                                                <button onClick={() => handleApproveShift(shift, 'approved')} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> {language === 'es' ? 'Aprobar' : 'Approve'}
                                                </button>
                                                <button onClick={() => handleApproveShift(shift, 'rejected')} className="flex-1 bg-rose-100 text-rose-700 py-2.5 rounded-lg text-sm font-bold hover:bg-rose-200 transition-colors flex items-center justify-center gap-2">
                                                    <XCircle className="w-4 h-4" /> {language === 'es' ? 'Rechazar' : 'Reject'}
                                                </button>
                                                <button onClick={() => { setApprovingShift(null); setApprovalNotes(''); }} className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm">
                                                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-5 pb-5">
                                            <button
                                                onClick={() => setApprovingShift(shift)}
                                                className="w-full bg-primary-50 text-primary-700 border border-primary-200 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-100 transition-colors"
                                            >
                                                {language === 'es' ? 'Revisar y Aprobar' : 'Review & Approve'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* WEEKLY SUMMARY TAB */}
            {activeView === 'summary' && canManage && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">
                            {language === 'es' ? 'Resumen Semanal de Horas' : 'Weekly Hours Summary'}
                        </h2>
                        <button onClick={fetchWeeklySummary} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                            ↻ {language === 'es' ? 'Actualizar' : 'Refresh'}
                        </button>
                    </div>
                    {summaryLoading ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4" />
                            <p className="text-slate-400">{language === 'es' ? 'Cargando resumen...' : 'Loading summary...'}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">{language === 'es' ? 'Empleado' : 'Employee'}</th>
                                            <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">{language === 'es' ? 'Turnos' : 'Shifts'}</th>
                                            <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">{language === 'es' ? 'Hrs. Programadas' : 'Sched. Hours'}</th>
                                            <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">{language === 'es' ? 'Hrs. Reales' : 'Actual Hours'}</th>
                                            <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">{language === 'es' ? 'Aprobados' : 'Approved'}</th>
                                            <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">{language === 'es' ? 'Pendientes' : 'Pending'}</th>
                                            <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {weeklySummary.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center text-slate-400">
                                                    {language === 'es' ? 'No hay datos para esta semana.' : 'No data for this week.'}
                                                </td>
                                            </tr>
                                        ) : weeklySummary.map(row => {
                                            const pct = row.scheduled_hours > 0 ? Math.min(100, Math.round((row.actual_hours / row.scheduled_hours) * 100)) : 0;
                                            const emp = users.find(u => u.id === row.user_id);
                                            return (
                                                <tr key={row.user_id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                                                                {emp?.avatarUrl ? <img src={emp.avatarUrl} className="w-full h-full object-cover" alt={row.user_name} /> : <span className="flex h-full items-center justify-center text-slate-400 text-xs font-bold">{row.user_name?.charAt(0)}</span>}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm">{row.user_name}</p>
                                                                <p className="text-xs text-slate-400">{row.department}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center font-semibold text-slate-700">{row.total_shifts}</td>
                                                    <td className="p-4 text-center font-semibold text-slate-500">{formatHours(Number(row.scheduled_hours))}</td>
                                                    <td className="p-4 text-center font-bold text-slate-900">{formatHours(Number(row.actual_hours))}</td>
                                                    <td className="p-4 text-center">
                                                        <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg text-sm">{row.approved_shifts}</span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`font-bold px-2 py-1 rounded-lg text-sm ${Number(row.pending_shifts) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{row.pending_shifts}</span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                                                                <div className={`h-2 rounded-full ${pct >= 90 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-400'}`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600 w-10 text-right">{pct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal - Shift Form */}
            {isShiftModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingShift ? (language === 'es' ? 'Editar Turno' : 'Edit Shift') : (language === 'es' ? 'Programar Nuevo Turno' : 'Schedule New Shift')}
                            </h3>
                            <button onClick={() => setIsShiftModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {!editingShift && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Empleado' : 'Employee'}</label>
                                    <select value={shiftForm.userId} onChange={(e) => setShiftForm({ ...shiftForm, userId: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500">
                                        <option value="">{language === 'es' ? 'Seleccionar empleado...' : 'Select an employee...'}</option>
                                        {deptEmployees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Inicio' : 'Start Time'}</label>
                                    <input type="datetime-local" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Fin' : 'End Time'}</label>
                                    <input type="datetime-local" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Tipo de Turno' : 'Shift Type'}</label>
                                <select value={shiftTypes.find(t => t.name === shiftForm.type)?.id || ''} onChange={(e) => handleShiftTypeChange(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500">
                                    <option value="">{language === 'es' ? 'Seleccionar tipo...' : 'Select a type...'}</option>
                                    {shiftTypes.filter(t => !effectiveDeptId || t.department_id === effectiveDeptId).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                    <option value="custom">{language === 'es' ? 'Personalizado' : 'Custom'}</option>
                                </select>
                            </div>

                            {!editingShift && (
                                <div className="pt-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        {language === 'es' ? 'Repetir en días' : 'Repeat on days'}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                                            const dayNames = language === 'es' 
                                                ? ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'] 
                                                : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
                                            const isSelected = shiftForm.repeatDays.includes(dayIdx);
                                            return (
                                                <button
                                                    key={dayIdx}
                                                    type="button"
                                                    onClick={() => {
                                                        const newDays = isSelected
                                                            ? shiftForm.repeatDays.filter(d => d !== dayIdx)
                                                            : [...shiftForm.repeatDays, dayIdx];
                                                        setShiftForm({ ...shiftForm, repeatDays: newDays });
                                                    }}
                                                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all border ${
                                                        isSelected 
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                                        : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
                                                    }`}
                                                >
                                                    {dayNames[dayIdx]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 italic">
                                        {language === 'es' ? '* Se creará un turno para cada día seleccionado.' : '* A shift will be created for each selected day.'}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                            {editingShift && (
                                <button onClick={() => { handleDeleteShift(editingShift.id); setIsShiftModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-800 mr-auto">
                                    {language === 'es' ? 'Eliminar Turno' : 'Delete Shift'}
                                </button>
                            )}
                            <button onClick={() => setIsShiftModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">{language === 'es' ? 'Cancelar' : 'Cancel'}</button>
                            <button onClick={handleSaveShift} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 transition-all">
                                {editingShift ? (language === 'es' ? 'Actualizar' : 'Update') : (language === 'es' ? 'Guardar' : 'Save')} {language === 'es' ? 'Turno' : 'Shift'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
