"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Shift, User, ShiftType } from '@/types';
import ShiftTypesManager from '@/components/admin/ShiftTypesManager';
import { Settings } from 'lucide-react';

export default function SchedulesPage() {
    const { user, isAdmin } = useAuth();
    const { shifts, users, fetchShifts, addShift, updateShift, deleteShift, departments, shiftTypes, fetchShiftTypes } = useData();
    const { t, language } = useLanguage();

    const [showShiftTypes, setShowShiftTypes] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [shiftForm, setShiftForm] = useState({
        userId: '',
        startTime: '',
        endTime: '',
        type: ''
    });

    // Calculate week range
    const weekRange = useMemo(() => {
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - currentDate.getDay());
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }, [currentDate]);

    useEffect(() => {
        if (user) {
            const filters: any = {
                startDate: weekRange.start.toISOString(),
                endDate: weekRange.end.toISOString()
            };

            if (isAdmin && selectedDept) {
                filters.departmentId = selectedDept;
            } else if (!isAdmin) {
                filters.userId = user.id;
            }

            fetchShifts(filters);
        }
    }, [user, weekRange, selectedDept, isAdmin]);

    // Translate days
    const days = language === 'es'
        ? ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekRange.start);
            d.setDate(weekRange.start.getDate() + i);
            return d;
        });
    }, [weekRange]);

    const handlePrevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const handleNextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const handleOpenAddModal = (date?: Date, userId?: string) => {
        const start = date ? new Date(date) : new Date();
        start.setHours(8, 0, 0, 0);
        const end = new Date(start);
        end.setHours(16, 0, 0, 0);

        setShiftForm({
            userId: userId || (isAdmin ? '' : user?.id || ''),
            startTime: start.toISOString().slice(0, 16),
            endTime: end.toISOString().slice(0, 16),
            type: 'Morning'
        });
        setEditingShift(null);
        setIsShiftModalOpen(true);
    };

    const handleSaveShift = async () => {
        if (!shiftForm.userId || !shiftForm.startTime || !shiftForm.endTime) return;

        if (editingShift) {
            await updateShift(editingShift.id, shiftForm);
        } else {
            await addShift(shiftForm as any);
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
            const startDate = shiftForm.startTime ? new Date(shiftForm.startTime) : new Date();
            const endDate = new Date(startDate);

            if (type.start_time_default) {
                const [h, m] = type.start_time_default.split(':');
                startDate.setHours(parseInt(h), parseInt(m), 0, 0);
            }

            if (type.end_time_default) {
                const [h, m] = type.end_time_default.split(':');
                endDate.setHours(parseInt(h), parseInt(m), 0, 0);
                // If end time is before start time, assume next day
                if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
            }

            setShiftForm({
                ...shiftForm,
                type: type.name,
                startTime: startDate.toISOString().slice(0, 16),
                endTime: endDate.toISOString().slice(0, 16)
            });
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {language === 'es' ? 'Horarios' : 'Schedules'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {isAdmin ? 'Manage departmental shifts' : 'See your weekly schedule'}
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

                {isAdmin && (
                    <div className="flex space-x-3">
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button
                            onClick={() => setShowShiftTypes(!showShiftTypes)}
                            className={`p-2 rounded-lg border transition-all ${showShiftTypes ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            title="Manage Shift Types"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => handleOpenAddModal()}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 transition-all"
                        >
                            + Add Shift
                        </button>
                    </div>
                )}
            </div>

            {isAdmin && showShiftTypes && selectedDept && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <ShiftTypesManager departmentId={selectedDept} />
                </div>
            )}

            {/* Main Schedule View */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {isAdmin && <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">Employee</th>}
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
                            {isAdmin && users.filter(u => !selectedDept || departments.find(d => d.id === selectedDept)?.name === u.department).length > 0 ? (
                                users
                                    .filter(u => !selectedDept || departments.find(d => d.id === selectedDept)?.name === u.department)
                                    .map(employee => (
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
                                                                        <button onClick={() => { setEditingShift(shift); setShiftForm({ userId: shift.user_id, startTime: shift.start_time.slice(0, 16), endTime: shift.end_time.slice(0, 16), type: shift.type as any }); setIsShiftModalOpen(true); }} className="text-slate-400 hover:text-primary-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                                        <button onClick={() => handleDeleteShift(shift.id)} className="text-slate-400 hover:text-rose-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-primary-700">
                                                                    {new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala', hour12: true }).format(new Date(shift.start_time))} - {new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala', hour12: true }).format(new Date(shift.end_time))}
                                                                </p>
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
                            ) : !isAdmin ? (
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
                                                                <p className="text-slate-600 font-medium">
                                                                    {new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala', hour12: true }).format(new Date(shift.start_time))} - {new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala', hour12: true }).format(new Date(shift.end_time))}
                                                                </p>
                                                                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                    <span>Status</span>
                                                                    <span className={shift.status === 'Completed' ? 'text-emerald-500' : shift.status === 'Clocked-in' ? 'text-primary-500' : 'text-slate-500'}>
                                                                        {shift.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {dayShifts.length === 0 && (
                                                            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl opacity-50">
                                                                <p className="text-xs text-slate-400 font-medium text-center italic px-4">No shifts for this day</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-500">
                                        No employees found for this department.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Shift Form */}
            {isShiftModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingShift ? 'Edit Shift' : 'Schedule New Shift'}
                            </h3>
                            <button onClick={() => setIsShiftModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {isAdmin && !editingShift && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Employee</label>
                                    <select
                                        value={shiftForm.userId}
                                        onChange={(e) => setShiftForm({ ...shiftForm, userId: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500"
                                    >
                                        <option value="">Select an employee...</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        value={shiftForm.startTime}
                                        onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                                    <input
                                        type="datetime-local"
                                        value={shiftForm.endTime}
                                        onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Shift Type</label>
                                <select
                                    value={shiftTypes.find(t => t.name === shiftForm.type)?.id || ''}
                                    onChange={(e) => handleShiftTypeChange(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500"
                                >
                                    <option value="">Select a type...</option>
                                    {shiftTypes.filter(t => !selectedDept || t.department_id === selectedDept).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                    <option value="custom">Custom (Specify in Time)</option>
                                </select>
                            </div>
                            {shiftForm.type === 'custom' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Custom Name</label>
                                    <input
                                        type="text"
                                        value={shiftForm.type}
                                        onChange={(e) => setShiftForm({ ...shiftForm, type: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                                        placeholder="e.g. Special Event"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                            {editingShift && (
                                <button
                                    onClick={() => { handleDeleteShift(editingShift.id); setIsShiftModalOpen(false); }}
                                    className="px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-800 mr-auto"
                                >
                                    Delete Shift
                                </button>
                            )}
                            <button onClick={() => setIsShiftModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                            <button
                                onClick={handleSaveShift}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 transition-all"
                            >
                                {editingShift ? 'Update' : 'Save'} Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
