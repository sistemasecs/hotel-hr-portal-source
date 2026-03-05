'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RequestType } from '@/types';

const REQUEST_TYPES: { type: RequestType; label: string; icon: string; description: string }[] = [
  { type: 'Vacation', label: 'Solicitud de Vacaciones', icon: '🌴', description: 'Request annual leave days.' },
  { type: 'Absence', label: 'Solicitud de Ausencia', icon: '🤒', description: 'Request time off for personal or medical reasons.' },
  { type: 'Shift Change', label: 'Cambio de Turno', icon: '🔄', description: 'Request to swap or change your scheduled shift.' },
  { type: 'Uniform', label: 'Solicitud de Uniforme', icon: '👕', description: 'Request new uniform items.' },
];

export default function NewRequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState<any>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedType) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: selectedType,
          data: formData,
          supervisorId: user.supervisorId // Assuming user object has this
        })
      });

      if (res.ok) {
        router.push('/dashboard/requests');
      } else {
        alert('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => {
    switch (selectedType) {
      case 'Vacation':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                <input type="date" name="startDate" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                <input type="date" name="endDate" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Comments / Reason</label>
              <textarea name="reason" rows={3} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="Optional details..."></textarea>
            </div>
          </>
        );
      case 'Absence':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Absence *</label>
                <input type="date" name="date" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                <select name="absenceType" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2">
                  <option value="">Select type...</option>
                  <option value="Paid">Paid (Con Goce)</option>
                  <option value="Unpaid">Unpaid (Sin Goce)</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
              <textarea name="reason" required rows={3} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="Please explain the reason for your absence..."></textarea>
            </div>
          </>
        );
      case 'Shift Change':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Shift Date *</label>
                <input type="date" name="currentShiftDate" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Requested Shift Date *</label>
                <input type="date" name="newShiftDate" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Colleague Covering (if applicable)</label>
              <input type="text" name="coveringColleague" onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="Name of colleague..." />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
              <textarea name="reason" required rows={2} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2"></textarea>
            </div>
          </>
        );
      case 'Uniform':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Requested *</label>
                <select name="item" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2">
                  <option value="">Select item...</option>
                  <option value="Shirt">Shirt / Blouse</option>
                  <option value="Pants">Pants / Skirt</option>
                  <option value="Jacket">Jacket</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Name Tag">Name Tag</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Size *</label>
                <input type="text" name="size" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="e.g., M, 32, 9" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Request *</label>
              <select name="reason" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2">
                <option value="">Select reason...</option>
                <option value="New Hire">New Hire</option>
                <option value="Worn Out">Worn Out / Damaged</option>
                <option value="Size Change">Size Change</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 flex items-center space-x-2 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-slate-900">New Request</h1>
        <p className="text-slate-600 mt-2">Select the type of request you want to submit.</p>
      </div>

      {!selectedType ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REQUEST_TYPES.map((req) => (
            <button
              key={req.type}
              onClick={() => {
                setSelectedType(req.type);
                setFormData({});
              }}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all text-left flex items-start space-x-4 group"
            >
              <div className="text-4xl group-hover:scale-110 transition-transform">{req.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{req.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{req.description}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{REQUEST_TYPES.find(r => r.type === selectedType)?.icon}</span>
              <h2 className="text-2xl font-bold text-slate-900">{REQUEST_TYPES.find(r => r.type === selectedType)?.label}</h2>
            </div>
            <button onClick={() => setSelectedType(null)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Change Type
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {renderFormFields()}

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Request</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}