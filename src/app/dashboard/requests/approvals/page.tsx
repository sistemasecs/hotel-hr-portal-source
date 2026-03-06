'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { EmployeeRequest } from '@/types';
import VacationCalendar from '@/components/requests/VacationCalendar';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<EmployeeRequest | null>(null);
  const [hrNotes, setHrNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [vacations, setVacations] = useState<EmployeeRequest[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && (user.role === 'HR Admin' || user.role === 'Supervisor' || user.role === 'Manager')) {
      fetchRequests();
      fetchVacations();
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        const userMap: Record<string, string> = {};
        data.forEach((u: any) => {
          userMap[u.id] = u.name;
        });
        setUsers(userMap);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const getTranslatedType = (type: string) => {
    switch (type) {
      case 'Vacation': return t('reqVacation');
      case 'Absence': return t('reqAbsence');
      case 'Absence Proof': return t('reqAbsenceProof');
      case 'Shift Change': return t('reqShiftChange');
      case 'Uniform': return t('reqUniform');
      case 'Without Uniform': return t('reqWithoutUniform');
      case 'Data Update': return t('reqDataUpdate');
      case 'Document': return t('reqDocument');
      case 'Discount': return t('reqDiscount');
      case 'Responsibility': return t('reqResponsibility');
      case 'Health Make-up': return t('reqHealthMakeup');
      default: return type;
    }
  };

  const fetchRequests = async () => {
    try {
      // In a real app, you might filter by supervisorId if role is Supervisor
      const res = await fetch(`/api/requests?status=Pending`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVacations = async () => {
    try {
      const res = await fetch(`/api/requests/vacations?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setVacations(data);
      }
    } catch (error) {
      console.error('Failed to fetch vacations:', error);
    }
  };

  const handleUpdateStatus = async (status: 'Approved' | 'Rejected') => {
    if (!selectedRequest) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, hrNotes })
      });

      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
        setSelectedRequest(null);
        setHrNotes('');
        // Refresh vacations if a vacation request was updated
        if (selectedRequest.type === 'Vacation') {
          fetchVacations();
        }
      } else {
        alert('Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user || (user.role !== 'HR Admin' && user.role !== 'Supervisor' && user.role !== 'Manager')) {
    return <div className="p-8 text-center text-red-600">Access Denied. You must be an HR Admin, Manager, or Supervisor to view this page.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('pendingApprovals')}</h1>
          <p className="text-slate-600 mt-2">{t('reviewRequests')}</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Vacation Calendar
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of Requests */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-800">{t('pendingRequests')} ({requests.length})</h2>
            </div>
            <div className="overflow-y-auto flex-grow">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">{t('loading')}</div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-slate-500">{t('noRequestsYet')}</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {requests.map(req => (
                  <li key={req.id}>
                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setHrNotes(req.hrNotes || '');
                      }}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${selectedRequest?.id === req.id ? 'bg-primary-50 border-l-4 border-primary-600' : 'border-l-4 border-transparent'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-slate-900">{req.userName}</span>
                        <span className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-slate-600 font-medium">{getTranslatedType(req.type)}</div>
                      <div className="text-xs text-slate-500 mt-1 truncate">{req.userDepartment}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{getTranslatedType(selectedRequest.type)}</h2>
                  <p className="text-slate-500 mt-1">Submitted by <span className="font-medium text-slate-700">{selectedRequest.userName}</span> ({selectedRequest.userDepartment})</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                  {selectedRequest.status}
                </span>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('requestDetails')}</h3>
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-100">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                    {Object.entries(selectedRequest.data).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-sm font-medium text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                        <dd className="mt-1 text-sm text-slate-900 font-medium">
                          {key === 'colleagueAgreed' ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              value === true ? 'bg-green-100 text-green-800' :
                              value === false ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {value === true ? t('agreed') : value === false ? t('declined') : t('pending')}
                            </span>
                          ) : key === 'coveringColleagueId' ? (
                            users[String(value)] || String(value)
                          ) : (
                            String(value)
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('hrNotesOptional')}</label>
                <textarea
                  rows={3}
                  value={hrNotes}
                  onChange={(e) => setHrNotes(e.target.value)}
                  placeholder="Add notes before approving or rejecting..."
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">
                <button
                  onClick={() => handleUpdateStatus('Rejected')}
                  disabled={isUpdating}
                  className="px-6 py-2 bg-white border border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {t('rejectRequest')}
                </button>
                <button
                  onClick={() => handleUpdateStatus('Approved')}
                  disabled={isUpdating || (selectedRequest.type === 'Shift Change' && selectedRequest.data.colleagueAgreed !== true)}
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={selectedRequest.type === 'Shift Change' && selectedRequest.data.colleagueAgreed !== true ? t('cannotApproveUntilAgreed') : ""}
                >
                  {t('approveRequest')}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
              <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="text-xl font-medium text-slate-900 mb-2">{t('selectRequest')}</h3>
              <p className="text-slate-500">{t('selectRequestDesc')}</p>
            </div>
          )}
        </div>
      </div>
      ) : (
        <VacationCalendar vacations={vacations} />
      )}
    </div>
  );
}