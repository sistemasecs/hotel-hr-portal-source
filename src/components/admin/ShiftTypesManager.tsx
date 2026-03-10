"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { ShiftType } from '@/types';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

export default function ShiftTypesManager({ departmentId }: { departmentId: string }) {
    const { shiftTypes, addShiftType, updateShiftType, deleteShiftType, fetchShiftTypes } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<ShiftType, 'id'>>({
        name: '',
        department_id: departmentId,
        start_time_default: '09:00',
        end_time_default: '17:00',
        color: '#3b82f6'
    });

    useEffect(() => {
        fetchShiftTypes(departmentId);
    }, [departmentId]);

    const deptShiftTypes = shiftTypes.filter(t => t.department_id === departmentId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            await updateShiftType(editingId, formData);
            setEditingId(null);
        } else {
            await addShiftType(formData);
            setIsAdding(false);
        }
        setFormData({
            name: '',
            department_id: departmentId,
            start_time_default: '09:00',
            end_time_default: '17:00',
            color: '#3b82f6'
        });
    };

    const handleEdit = (type: ShiftType) => {
        setEditingId(type.id);
        setFormData({
            name: type.name,
            department_id: type.department_id,
            start_time_default: type.start_time_default || '09:00',
            end_time_default: type.end_time_default || '17:00',
            color: type.color || '#3b82f6'
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Shift Types</h3>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center space-x-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Type</span>
                    </button>
                )}
            </div>

            <div className="p-4">
                {(isAdding || editingId) && (
                    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-indigo-900 uppercase mb-1">Shift Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Morning Reception"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-indigo-900 uppercase mb-1">Default Start</label>
                                <input
                                    type="time"
                                    value={formData.start_time_default || ''}
                                    onChange={e => setFormData({ ...formData, start_time_default: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-indigo-900 uppercase mb-1">Default End</label>
                                <input
                                    type="time"
                                    value={formData.end_time_default || ''}
                                    onChange={e => setFormData({ ...formData, end_time_default: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-indigo-900 uppercase mb-1">Theme Color</label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="color"
                                        value={formData.color || '#3b82f6'}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                                    />
                                    <span className="text-sm font-mono text-slate-500 uppercase">{formData.color}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setEditingId(null); }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700"
                            >
                                {editingId ? 'Update Type' : 'Create Type'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-2">
                    {deptShiftTypes.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No shift types defined for this department.</p>
                    ) : (
                        deptShiftTypes.map(type => (
                            <div key={type.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: type.color || '#3b82f6' }}>
                                        <span>{type.start_time_default?.substring(0, 5)}</span>
                                        <div className="w-4 h-[1px] bg-white/30 my-0.5" />
                                        <span>{type.end_time_default?.substring(0, 5)}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{type.name}</h4>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Default: {type.start_time_default?.substring(0, 5)} - {type.end_time_default?.substring(0, 5)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handleEdit(type)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteShiftType(type.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
