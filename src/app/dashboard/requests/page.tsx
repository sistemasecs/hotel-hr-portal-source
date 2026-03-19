'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { EmployeeRequest } from '@/types';

export default function MyRequestsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [requestsToCover, setRequestsToCover] = useState<EmployeeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Record<string, any>>({});
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchRequestsToCover();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/requests?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
        // After fetching requests, fetch their documents
        fetchDocuments(data.map((r: any) => r.id));
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async (requestIds: string[]) => {
    if (requestIds.length === 0) return;
    try {
      const res = await fetch(`/api/requests/documents?requestIds=${requestIds.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        const docMap: Record<string, any> = {};
        data.forEach((doc: any) => {
          docMap[doc.request_id] = doc;
        });
        setDocuments(docMap);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleSignDocument = async () => {
    if (!activeDoc) return;
    setIsSigning(true);
    try {
      const res = await fetch('/api/requests/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: activeDoc.request_id })
      });

      if (res.ok) {
        setIsSignModalOpen(false);
        fetchRequests(); // Refresh to update document state
      } else {
        alert('Failed to sign document');
      }
    } catch (error) {
      console.error('Error signing document:', error);
    } finally {
      setIsSigning(false);
    }
  };

  const fetchRequestsToCover = async () => {
    try {
      // Fetch all requests and filter on the client side for simplicity,
      // or create a specific endpoint. For now, fetching all and filtering.
      // In a real app, you'd want a specific query for this.
      const res = await fetch(`/api/requests`);
      if (res.ok) {
        const data: EmployeeRequest[] = await res.json();
        const toCover = data.filter(
          (req) =>
            req.type === 'Shift Change' &&
            req.data?.coveringColleagueId === user?.id &&
            req.data?.colleagueAgreed === 'Pending'
        );
        setRequestsToCover(toCover);
      }
    } catch (error) {
      console.error('Failed to fetch requests to cover:', error);
    }
  };

  const handleColleagueAgreement = async (requestId: string, agreed: boolean, currentData: any) => {
    try {
      const updatedData = { ...currentData, colleagueAgreed: agreed };
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData, userId: user?.id }),
      });

      if (res.ok) {
        // Remove from the list
        setRequestsToCover((prev) => prev.filter((req) => req.id !== requestId));
        alert(agreed ? t('agreedToCoverMsg') : t('declinedToCoverMsg'));
      } else {
        alert(t('failedToUpdateAgreement'));
      }
    } catch (error) {
      console.error('Error updating agreement:', error);
      alert(t('errorUpdatingAgreement'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('myRequests')}</h1>
          <p className="text-slate-600 mt-2">{t('trackRequests')}</p>
        </div>
        <div className="flex space-x-4">
          {(user?.role === 'HR Admin' || user?.role === 'Supervisor' || user?.role === 'Manager') && (
            <Link
              href="/dashboard/requests/approvals"
              className="px-4 py-2 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200 transition-colors shadow-sm flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('pendingApprovals')}</span>
            </Link>
          )}
          <Link
            href="/dashboard/requests/new"
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{t('newRequest')}</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">{t('loading')}</p>
        </div>
      ) : (
        <>
          {requestsToCover.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('requestsToCover')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requestsToCover.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-900">{getTranslatedType(req.type)}</h3>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">{t('actionRequired')}</span>
                    </div>
                    <p className="text-slate-700 mb-2">
                      <span className="font-medium">{req.userName}</span> {t('requestedCoverShift')}
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm text-slate-600">
                      <p><strong>{t('currentShift')}:</strong> {req.data.currentShiftDate}</p>
                      <p><strong>{t('newShift')}:</strong> {req.data.newShiftDate}</p>
                      <p><strong>{t('reason')}:</strong> {req.data.reason}</p>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleColleagueAgreement(req.id, true, req.data)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {t('agreeToCover')}
                      </button>
                      <button
                        onClick={() => handleColleagueAgreement(req.id, false, req.data)}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors"
                      >
                        {t('decline')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">{t('noRequestsYet')}</h3>
              <p className="text-slate-500 mb-6">{t('noRequestsSubmitted')}</p>
              <Link
                href="/dashboard/requests/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
              >
                {t('createFirstRequest')}
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('type')}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dateSubmitted')}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('details')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{getTranslatedType(request.type)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status === 'Pending' ? t('statusPending') : request.status === 'Approved' ? t('statusApproved') : request.status === 'Rejected' ? t('statusRejected') : request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-500 max-w-xs truncate">
                            {request.type === 'Vacation' && `From ${request.data.startDate} to ${request.data.endDate}`}
                            {request.type === 'Absence' && `Date: ${request.data.date} - ${request.data.reason}`}
                            {request.type === 'Absence Proof' && `Date: ${request.data.date} (Proof Attached)`}
                            {request.type === 'Shift Change' && `${t('newShift')}: ${request.data.newShiftDate}`}
                            {request.type === 'Uniform' && `Item: ${request.data.item} (Size: ${request.data.size})`}
                            {request.type === 'Data Update' && `Updated contact info`}
                            {request.type === 'Document' && `Type: ${request.data.documentType}`}
                            {request.type === 'Discount' && `Service: ${request.data.service} (${request.data.amount})`}
                            {request.type === 'Responsibility' && `Item: ${request.data.item}`}
                            {request.type === 'Without Uniform' && `Date: ${request.data.date}`}
                            {request.type === 'Health Make-up' && `Dates: ${request.data.datesAffected} (${request.data.hours} hrs)`}
                          </div>
                          {request.type === 'Shift Change' && request.data.coveringColleagueId && (
                            <div className="text-xs mt-1">
                              {t('colleagueAgreement')}: 
                              <span className={`ml-1 font-semibold ${
                                request.data.colleagueAgreed === true ? 'text-green-600' : 
                                request.data.colleagueAgreed === false ? 'text-red-600' : 'text-amber-600'
                              }`}>
                                {request.data.colleagueAgreed === true ? t('agreed') : 
                                 request.data.colleagueAgreed === false ? t('declined') : t('pending')}
                              </span>
                            </div>
                          )}
                          {request.hrNotes && (
                            <div className="text-xs text-slate-400 mt-1 italic">
                              Note: {request.hrNotes}
                            </div>
                          )}
                          {documents[request.id] && (
                            <div className="mt-2">
                              {documents[request.id].signed_at ? (
                                <button
                                  onClick={() => {
                                    setActiveDoc(documents[request.id]);
                                    setIsSignModalOpen(true);
                                  }}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline flex items-center"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  {t('viewSignedDocument')}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveDoc(documents[request.id]);
                                    setIsSignModalOpen(true);
                                  }}
                                  className="text-xs font-bold text-primary-600 hover:text-primary-700 underline flex items-center"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  {t('signDocument')}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      {/* Signature Modal */}
      {isSignModalOpen && activeDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {activeDoc.signed_at ? t('viewSignedDocument') : t('signDocument')}
              </h2>
              <button onClick={() => setIsSignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-8 rounded-lg border border-slate-200 shadow-inner mb-6 text-slate-900">
              <div 
                className="max-w-2xl mx-auto bg-white p-12 shadow-sm min-h-[600px] prose prose-slate"
                dangerouslySetInnerHTML={{ __html: activeDoc.content.replace(/\n/g, '<br/>') }}
              />
              {activeDoc.signed_at && (
                <div className="max-w-2xl mx-auto mt-8 pt-8 border-t border-slate-200">
                  <div className="flex flex-col items-center">
                    <div className="font-cursive text-3xl text-slate-800 mb-2" style={{ fontFamily: 'Dancing Script, cursive' }}>
                      {user?.name}
                    </div>
                    <div className="h-px w-64 bg-slate-900 mb-2"></div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest text-center">
                      {t('digitallySignedOn')}: {new Date(activeDoc.signed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {activeDoc.signed_at ? t('close') : t('cancel')}
              </button>
              
              {activeDoc.signed_at ? (
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>{t('downloadPdfPrint')}</span>
                </button>
              ) : (
                <button
                  onClick={handleSignDocument}
                  disabled={isSigning}
                  className="px-8 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg flex items-center space-x-2"
                >
                  {isSigning ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  )}
                  <span>{isSigning ? t('signing') : t('declareConformity')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}