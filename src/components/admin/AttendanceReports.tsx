"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { Clock, Download, AlertCircle, CheckCircle, Search, User as UserIcon, RotateCcw, Timer } from 'lucide-react';
import { ensureGuatemalaDate, roundToNearestQuarterHour, roundToNearestHalfHour, formatToGuatemalaDateTimeLocal, parseGuatemalaDateTimeLocal } from '@/lib/dateUtils';

export default function AttendanceReports() {
    const { fetchWorkedHoursReport, departments, shifts, fetchShifts, approveShift, adjustShiftTimes } = useData();
    const { language } = useLanguage();

    const [activeTab, setActiveTab] = useState<'Summary' | 'Approvals'>('Summary');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [editingShift, setEditingShift] = useState<string | null>(null);
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleFetchReport = async () => {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        try {
            const startStr = `${startDate}T00:00:00.000-06:00`;
            const endStr = `${endDate}T23:59:59.999-06:00`;

            const data = await fetchWorkedHoursReport(startStr, endStr, selectedDept);
            setReportData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch report:", err);
            setError(language === 'es' ? 'Error al cargar el reporte' : 'Failed to load report');
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchPending = async () => {
        if (!isMounted) return;
        setLoading(true);
        try {
            await fetchShifts({ status: 'Pending Approval', departmentId: selectedDept });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isMounted) {
            if (activeTab === 'Summary') {
                handleFetchReport();
            } else {
                handleFetchPending();
            }
        }
    }, [isMounted, activeTab, selectedDept]);

    const handleApprove = async (id: string) => {
        try {
            await approveShift(id);
            // Refresh summary if we're changing data
            if (activeTab === 'Approvals') {
                handleFetchPending();
            }
        } catch (err) {
            alert("Error approving shift");
        }
    };

    const handleEditTimes = (shift: any) => {
        setEditingShift(shift.id);
        setEditStartTime(shift.actual_start_time ? formatToGuatemalaDateTimeLocal(shift.actual_start_time) : '');
        setEditEndTime(shift.actual_end_time ? formatToGuatemalaDateTimeLocal(shift.actual_end_time) : '');
    };

    const handleSaveTimes = async (shiftId: string) => {
        try {
            if (!editStartTime || !editEndTime) {
                alert(language === 'es' ? 'Por favor ingresa ambas horas' : 'Please enter both times');
                return;
            }
            
            const startTime = parseGuatemalaDateTimeLocal(editStartTime);
            const endTime = parseGuatemalaDateTimeLocal(editEndTime);

            const response = await fetch(`/api/shifts/${shiftId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actualStartTime: startTime,
                    actualEndTime: endTime
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update shift');
            }
            
            setEditingShift(null);
            setEditStartTime('');
            setEditEndTime('');
            // Refresh the pending shifts
            handleFetchPending();
        } catch (err) {
            console.error('Error updating shift times:', err);
            alert(language === 'es' ? 'Error al actualizar las horas: ' + (err instanceof Error ? err.message : 'Error desconocido') : 'Error updating shift times: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleUseScheduledTimes = (shift: any) => {
        setEditStartTime(shift.start_time ? formatToGuatemalaDateTimeLocal(shift.start_time) : '');
        setEditEndTime(shift.end_time ? formatToGuatemalaDateTimeLocal(shift.end_time) : '');
    };

    const handleRoundToQuarterHour = () => {
        if (editStartTime) {
            const rounded = roundToNearestQuarterHour(new Date(editStartTime));
            setEditStartTime(formatToGuatemalaDateTimeLocal(rounded));
        }
        if (editEndTime) {
            const rounded = roundToNearestQuarterHour(new Date(editEndTime));
            setEditEndTime(formatToGuatemalaDateTimeLocal(rounded));
        }
    };

    const handleRoundToHalfHour = () => {
        if (editStartTime) {
            const rounded = roundToNearestHalfHour(new Date(editStartTime));
            setEditStartTime(formatToGuatemalaDateTimeLocal(rounded));
        }
        if (editEndTime) {
            const rounded = roundToNearestHalfHour(new Date(editEndTime));
            setEditEndTime(formatToGuatemalaDateTimeLocal(rounded));
        }
    };

    const handleCancelEdit = () => {
        setEditingShift(null);
        setEditStartTime('');
        setEditEndTime('');
    };

    if (!isMounted) return null;

    const pendingShifts = shifts.filter(s => s.status === 'Pending Approval');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                        <Clock className="w-6 h-6 mr-2 text-primary-600" />
                        {language === 'es' ? 'Reporte de Horas Trabajadas' : 'Worked Hours Report'}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {language === 'es' ? 'Gestión de asistencia y aprobación de horas' : 'Attendance management and hours approval'}
                    </p>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('Summary')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Summary' ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {language === 'es' ? 'Resumen' : 'Summary'}
                    </button>
                    <button
                        onClick={() => setActiveTab('Approvals')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${activeTab === 'Approvals' ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {language === 'es' ? 'Pendientes' : 'Pending'}
                        {pendingShifts.length > 0 && (
                            <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                                {pendingShifts.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-end gap-4">
                {activeTab === 'Summary' && (
                    <>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="block w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="block w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500"
                            />
                        </div>
                    </>
                )}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="block w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500 min-w-[200px]"
                    >
                        <option value="">All Departments</option>
                        {departments && departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center">
                    <AlertCircle className="w-5 h-5 mr-3" />
                    {error}
                </div>
            )}

            {activeTab === 'Summary' ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.length > 0 ? reportData.map((row, i) => (
                                <tr key={row.user_id || i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 flex items-center font-bold text-slate-900">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 text-[10px] text-slate-500 uppercase">
                                            {row.user_name ? row.user_name.charAt(0) : '?'}
                                        </div>
                                        {row.user_name || '---'}
                                    </td>
                                    <td className="p-4 text-slate-600">{row.department || '---'}</td>
                                    <td className="p-4 text-right">
                                        <span className="text-lg font-bold text-emerald-600">
                                            {parseFloat(row.total_hours || '0').toFixed(2)}
                                        </span>
                                        <span className="text-xs text-slate-400 ml-1">hrs</span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center text-slate-400 italic">
                                        {loading ? 'Loading...' : 'No approved hours found for this period.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingShifts.length > 0 ? pendingShifts.map((shift) => (
                        <div key={shift.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-300 transition-all flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-amber-50 rounded-lg mr-3">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{shift.user_name || 'Employee'}</h4>
                                        <p className="text-xs text-slate-500">{shift.type} Shift</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">
                                    Pending Approval
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                        {language === 'es' ? 'Entrada Real' : 'Actual Clock In'}
                                    </p>
                                    {editingShift === shift.id ? (
                                        <input
                                            type="datetime-local"
                                            value={editStartTime}
                                            onChange={(e) => setEditStartTime(e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-700">
                                            {shift.actual_start_time ? new Date(shift.actual_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                        </p>
                                    )}
                                    {shift.start_time && (
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            {language === 'es' ? 'Programado:' : 'Scheduled:'} {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                        {language === 'es' ? 'Salida Real' : 'Actual Clock Out'}
                                    </p>
                                    {editingShift === shift.id ? (
                                        <input
                                            type="datetime-local"
                                            value={editEndTime}
                                            onChange={(e) => setEditEndTime(e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-700">
                                            {shift.actual_end_time ? new Date(shift.actual_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                        </p>
                                    )}
                                    {shift.end_time && (
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            {language === 'es' ? 'Programado:' : 'Scheduled:'} {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-2 border-t border-slate-200 pt-2 mt-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                        {language === 'es' ? 'Duración Total' : 'Total Duration'}
                                    </p>
                                    <p className="text-sm font-bold text-primary-700">
                                        {(() => {
                                            let start = editingShift === shift.id && editStartTime ? new Date(editStartTime) : (shift.actual_start_time ? new Date(shift.actual_start_time) : null);
                                            let end = editingShift === shift.id && editEndTime ? new Date(editEndTime) : (shift.actual_end_time ? new Date(shift.actual_end_time) : null);
                                            return start && end ? ((end.getTime() - start.getTime()) / (1000 * 3600)).toFixed(2) : '0.00';
                                        })()} {language === 'es' ? 'horas' : 'hours'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                {editingShift === shift.id ? (
                                    <>
                                        {/* Time adjustment buttons */}
                                        <div className="w-full mb-3 flex flex-wrap gap-2">
                                            <button
                                                onClick={() => handleUseScheduledTimes(shift)}
                                                className="flex-1 min-w-0 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center"
                                                title={language === 'es' ? 'Usar horarios programados' : 'Use scheduled times'}
                                            >
                                                <RotateCcw className="w-3 h-3 mr-1" />
                                                {language === 'es' ? 'Programado' : 'Scheduled'}
                                            </button>
                                            <button
                                                onClick={handleRoundToQuarterHour}
                                                className="flex-1 min-w-0 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center"
                                                title={language === 'es' ? 'Redondear a 15 minutos' : 'Round to 15 minutes'}
                                            >
                                                <Timer className="w-3 h-3 mr-1" />
                                                15min
                                            </button>
                                            <button
                                                onClick={handleRoundToHalfHour}
                                                className="flex-1 min-w-0 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center"
                                                title={language === 'es' ? 'Redondear a 30 minutos' : 'Round to 30 minutes'}
                                            >
                                                <Timer className="w-3 h-3 mr-1" />
                                                30min
                                            </button>
                                        </div>

                                        {/* Save/Cancel buttons */}
                                        <button
                                            onClick={() => handleSaveTimes(shift.id)}
                                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {language === 'es' ? 'Guardar' : 'Save Times'}
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="flex-1 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center"
                                        >
                                            {language === 'es' ? 'Cancelar' : 'Cancel'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleEditTimes(shift)}
                                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center"
                                        >
                                            {language === 'es' ? 'Editar Horas' : 'Edit Times'}
                                        </button>
                                        <button
                                            onClick={() => handleApprove(shift.id)}
                                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {language === 'es' ? 'Aprobar' : 'Approve Hours'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                            <p className="text-slate-400 italic">No shifts pending approval.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
