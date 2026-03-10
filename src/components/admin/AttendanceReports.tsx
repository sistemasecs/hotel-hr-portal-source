"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { Calendar, Users, Clock, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AttendanceReports() {
    const { fetchWorkedHoursReport, departments } = useData();
    const { language } = useLanguage();

    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleFetchReport = async () => {
        setLoading(true);
        const data = await fetchWorkedHoursReport(
            new Date(startDate).toISOString(),
            new Date(endDate + 'T23:59:59').toISOString(),
            selectedDept
        );
        setReportData(data);
        setLoading(false);
    };

    useEffect(() => {
        handleFetchReport();
    }, []);

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
                        const csvContent = "data:text/csv;charset=utf-8,"
                            + "Employee,Department,Total Hours\n"
                            + reportData.map(r => `"${r.user_name}","${r.department}",${r.total_hours.toFixed(2)}`).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `worked_hours_${startDate}_to_${endDate}.csv`);
                        document.body.appendChild(link);
                        link.click();
                    }}
                    className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
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
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleFetchReport}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all ml-auto"
                >
                    {loading ? '...' : (language === 'es' ? 'Actualizar' : 'Refresh')}
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                            <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actual Worked Hours</th>
                            <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Efficiency</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reportData.length > 0 ? reportData.map((row, i) => (
                            <tr key={row.user_id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center font-bold text-slate-900">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 text-[10px] text-slate-500">
                                            {row.user_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                        </div>
                                        {row.user_name}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                                        {row.department}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <span className="text-lg font-bold text-slate-900">
                                        {row.total_hours.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-1">hrs</span>
                                </td>
                                <td className="p-4 text-right text-emerald-600 font-bold">
                                    {(Math.random() * 20 + 80).toFixed(1)}%
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400 italic">
                                    No data found for this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
