'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { RequestType, User, EmployeeRequest } from '@/types';
import { calculateVacationBalance, getDurationInDays } from '@/lib/vacationUtils';

export default function NewRequestPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hotelConfig } = useData();
  const [colleagues, setColleagues] = useState<User[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  useEffect(() => {
    const fetchColleagues = async () => {
      if (user && selectedType === 'Shift Change') {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const allUsers: User[] = await res.json();
            // Filter users in the same department, excluding the current user
            const deptColleagues = allUsers.filter(
              (u) => u.department === user.department && u.id !== user.id
            );
            setColleagues(deptColleagues);
          }
        } catch (error) {
          console.error('Failed to fetch colleagues:', error);
        }
      }
    };

    fetchColleagues();
  }, [user, selectedType]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch('/api/holidays');
        if (res.ok) {
          const data = await res.json();
          setHolidays(data);
        }
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    };
    fetchHolidays();
  }, []);

  const REQUEST_TYPES: { type: RequestType; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      type: 'Vacation', 
      label: t('reqVacation'), 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      description: t('reqVacationDesc') 
    },
    { 
      type: 'Absence', 
      label: t('reqAbsence'), 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      description: t('reqAbsenceDesc') 
    },
    { 
      type: 'Absence Proof', 
      label: t('reqAbsenceProof'), 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ), 
      description: t('reqAbsenceProofDesc') 
    },
    { 
      type: 'Shift Change', 
      label: t('reqShiftChange'), 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ), 
      description: t('reqShiftChangeDesc') 
    },
    { 
      type: 'Uniform', 
      label: t('reqUniform'), 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ), 
      description: t('reqUniformDesc') 
    },
    { 
      type: 'Without Uniform', 
      label: t('reqWithoutUniform'), 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ), 
      description: t('reqWithoutUniformDesc') 
    },
    { 
      type: 'Document', 
      label: t('reqDocument'), 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ), 
      description: t('reqDocumentDesc') 
    },
    { 
      type: 'Discount', 
      label: t('reqDiscount'), 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ), 
      description: t('reqDiscountDesc') 
    },
    { 
      type: 'Responsibility', 
      label: t('reqResponsibility'), 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ), 
      description: t('reqResponsibilityDesc') 
    },
    { 
      type: 'Health Make-up', 
      label: t('reqHealthMakeup'), 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      description: t('reqHealthMakeupDesc') 
    },
  ];

  // Form States
  const [formData, setFormData] = useState<any>({});
  const [file, setFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedType) return;

    setIsSubmitting(true);
    try {
      // Balance Validation for Vacation
      if (selectedType === 'Vacation') {
        const reqsRes = await fetch(`/api/requests?userId=${user.id}`);
        if (reqsRes.ok) {
          const cloudRequests: EmployeeRequest[] = await reqsRes.json();
          const { balance } = calculateVacationBalance(user.hireDate, cloudRequests, [], holidays, hotelConfig.workingDays);
          const requestedDays = getDurationInDays(formData.startDate, formData.endDate, holidays, hotelConfig.workingDays);
          
          if (requestedDays > balance) {
            alert(`${t('insufficientBalance')} (${balance} ${t('days')} ${t('available')})`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      let fileUrl = null;

      // Upload file if present
      if (file) {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          fileUrl = url;
        } else {
          throw new Error('Failed to upload file');
        }
      }

      const finalData = { ...formData };
      if (fileUrl) {
        finalData.fileUrl = fileUrl;
      }

      // If it's a shift change and a colleague is selected, set initial agreement status
      if (selectedType === 'Shift Change' && finalData.coveringColleagueId) {
        finalData.colleagueAgreed = 'Pending';
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: selectedType,
          data: finalData,
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
            
            {formData.startDate && formData.endDate && (
              <div className="mt-4 p-4 bg-primary-50 border border-primary-100 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-900">{t('vacationDuration')}</p>
                  <p className="text-xs text-primary-600 mt-1">
                    {t('excludesHolidaysAndNonWorkingDays')}
                  </p>
                </div>
                <div className="text-2xl font-black text-primary-700">
                  {getDurationInDays(formData.startDate, formData.endDate, holidays, hotelConfig.workingDays)} {t('days')}
                </div>
              </div>
            )}

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
              <select name="coveringColleagueId" onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2">
                <option value="">Select a colleague...</option>
                {colleagues.map((colleague) => (
                  <option key={colleague.id} value={colleague.id}>
                    {colleague.name}
                  </option>
                ))}
              </select>
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
      case 'Absence Proof':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Absence *</label>
                <input type="date" name="date" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Proof (Medical Note, etc.) *</label>
                <input type="file" required onChange={handleFileChange} className="w-full border border-slate-300 rounded-md p-1.5 text-sm" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
              <textarea name="comments" rows={2} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="Additional details..."></textarea>
            </div>
          </>
        );
      case 'Document':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type of Document *</label>
                <select name="documentType" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2">
                  <option value="">Select type...</option>
                  <option value="Employment Letter">Employment Verification Letter</option>
                  <option value="Pay Stub">Pay Stub Copy</option>
                  <option value="Recommendation">Letter of Recommendation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Method *</label>
                <select name="deliveryMethod" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2">
                  <option value="">Select method...</option>
                  <option value="Email">Email (Digital Copy)</option>
                  <option value="Printed">Printed (Pick up at HR)</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Purpose of Request *</label>
              <textarea name="purpose" required rows={2} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="e.g., Bank loan application, Visa process..."></textarea>
            </div>
          </>
        );
      case 'Discount':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service / Product *</label>
                <input type="text" name="service" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="e.g., Restaurant meal, Spa service" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Amount *</label>
                <input type="number" name="amount" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="0.00" />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-start space-x-3 p-4 bg-primary-50 rounded-lg border border-primary-100 cursor-pointer">
                <input type="checkbox" name="payrollDeduction" required onChange={handleInputChange} className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                <span className="text-sm text-slate-700">
                  I authorize the hotel to deduct the final discounted amount from my next payroll.
                </span>
              </label>
            </div>
          </>
        );
      case 'Responsibility':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Item or Duty Assumed *</label>
              <input type="text" name="item" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="e.g., Master Keys, Cash Register Till, Laptop" />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Details / Serial Number</label>
              <textarea name="details" rows={2} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2"></textarea>
            </div>
            <div className="mt-4">
              <label className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-100 cursor-pointer">
                <input type="checkbox" name="agreement" required onChange={handleInputChange} className="mt-1 h-4 w-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500" />
                <span className="text-sm text-slate-700">
                  I acknowledge receipt of the above item/duty and accept full responsibility for its care and proper use according to company policies.
                </span>
              </label>
            </div>
          </>
        );
      case 'Without Uniform':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input type="date" name="date" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Resolution Date *</label>
                <input type="date" name="resolutionDate" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
              <textarea name="reason" required rows={2} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="e.g., Uniform torn, waiting for new size..."></textarea>
            </div>
          </>
        );
      case 'Health Make-up':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dates Affected *</label>
                <input type="text" name="datesAffected" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="e.g., Oct 12 - Oct 14" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Hours to Make Up *</label>
                <input type="number" name="hours" required onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="e.g., 16" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Proposed Make-up Schedule *</label>
              <textarea name="proposedSchedule" required rows={3} onChange={handleInputChange} className="w-full border border-slate-300 rounded-md p-2" placeholder="e.g., Will work 2 extra hours every day next week..."></textarea>
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
          <span>{t('cancel')}</span>
        </button>
        <h1 className="text-3xl font-bold text-slate-900">{t('newRequest')}</h1>
        <p className="text-slate-600 mt-2">{t('selectRequestType')}</p>
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
              <div className="p-3 bg-primary-600 rounded-lg mr-4 group-hover:scale-110 transition-transform shadow-sm">
                {req.icon}
              </div>
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
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-600 rounded-lg shadow-sm">
                {REQUEST_TYPES.find(r => r.type === selectedType)?.icon}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{REQUEST_TYPES.find(r => r.type === selectedType)?.label}</h2>
            </div>
            <button onClick={() => setSelectedType(null)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              {t('changeType')}
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
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('submitting')}</span>
                  </>
                ) : (
                  <span>{t('submitRequest')}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}