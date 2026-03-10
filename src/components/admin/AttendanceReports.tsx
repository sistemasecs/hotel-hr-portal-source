"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { Clock, Download, AlertCircle } from 'lucide-react';

export default function AttendanceReports() {
    const { fetchWorkedHoursReport, departments } = useData();
    const { language } = useLanguage();

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

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleFetchReport = async () => {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        try {
            // Use safer date construction
            const startStr = `${startDate}T00:00:00.000Z`;
            const endStr = `${endDate}T23:59:59.999Z`;

            const data = await fetchWorkedHoursReport(startStr, endStr, selectedDept);
            if (Array.isArray(data)) {
                setReportData(data);
            } else {
                setReportData([]);
            }
        } catch (err) {
            console.error("Failed to fetch report:", err);
            setError(language === 'es' ? 'Error al cargar el reporte' : 'Failed to load report');
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isMounted) {
            handleFetchReport();
        }
    }, [isMounted]);

    if (!isMounted) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                        <Clock className="w-6 h-6 mr-2 text-primary-600" />
                        {language === 'es' ? 'Reporte de Horas Trabajadas' : 'Worked Hours Report'}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {language === 'es' ? 'Resumen semanal de asistencia por empleado' : 'Weekly attendance summary per employee'}
                    </p>
                </div>

                <button
                    onClick={() => {
                        try {
                            const csvContent = "data:text/csv;charset=utf-8,"
                                + "Employee,Department,Total Hours\n"
                                + reportData.map(r => `"${r.user_name || 'N/A'}","${r.department || 'N/A'}",${(r.total_hours || 0).toFixed(2)}`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `worked_hours_${startDate}_to_${endDate}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        } catch (e) {
                            alert("Error generating CSV");
                        }
                    }}
                    disabled={reportData.length === 0}
                    className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-end gap-4">
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
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="block w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500"
                    >
                        <option value="">All Departments</option>
                        {departments && departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleFetchReport}
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all ml-auto disabled:opacity-50"
                >
                    {loading ? '...' : (language === 'es' ? 'Actualizar' : 'Refresh')}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center">
                    <AlertCircle className="w-5 h-5 mr-3" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                            <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actual Worked Hours</th>
                            <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reportData && reportData.length > 0 ? reportData.map((row, i) => (
                            <tr key={row.user_id || i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center font-bold text-slate-900">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 text-[10px] text-slate-500 uppercase">
                                            {row.user_name ? row.user_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '??'}
                                        </div>
                                        {row.user_name || '---'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                                        {row.department || '---'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <span className="text-lg font-bold text-slate-900">
                                        {(typeof row.total_hours === 'number' ? row.total_hours : parseFloat(row.total_hours || '0') || 0).toFixed(2)}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-1">hrs</span>
                                </td>
                                <td className="p-4 text-right">
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                        Active
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400 italic">
                                    {loading ? (language === 'es' ? 'Cargando datos...' : 'Loading data...') : (language === 'es' ? 'No se encontraron datos' : 'No data found for this period.')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
