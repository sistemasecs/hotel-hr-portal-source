'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useData } from '@/context/DataContext';
import { EmployeeRequest } from '@/types';
import { calculateVacationBalance, getDurationInDays } from '@/lib/vacationUtils';
import { formatDisplayDate } from '@/lib/dateUtils';
import SignaturePad from '@/components/SignaturePad';

export default function VacationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { hotelConfig } = useData();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [yearlyDocs, setYearlyDocs] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [manualDays, setManualDays] = useState<number>(15);
  const [signatureData, setSignatureData] = useState<string>('');
  const [currentHTML, setCurrentHTML] = useState<string>('');

  const isContractEmployee = ((user?.employmentType || '').toLowerCase() === 'contract');

  useEffect(() => {
    if (!user) return;

    if (!isContractEmployee) {
      router.replace('/dashboard/requests');
      return;
    }

    fetchData();
  }, [user, isContractEmployee, router]);

  useEffect(() => {
    if (activeDoc && activeDoc.request_id?.startsWith('YEARLY:')) {
      let html = activeDoc.content || '';
      const days = (startDate && endDate) ? getDurationInDays(startDate, endDate, holidays, hotelConfig.workingDays) : 15;
      setManualDays(days);

      if (startDate && endDate) {
        html = html.replace(
          /<p><strong>Periodo \/ Period:<\/strong>.*?<\/p>/,
          `<p><strong>Periodo / Period:</strong> ${startDate} - ${endDate}</p>`
        );
      }

      html = html.replace(
        /Días Tomados \/ Taken Days: <strong>.*?<\/strong>/,
        `Días Tomados / Taken Days: <strong>${days}</strong>`
      );

      const accruedMatch = html.match(/Días Acumulados \/ Accrued Days: <strong>(\d+)<\/strong>/);
      if (accruedMatch) {
        const accrued = parseInt(accruedMatch[1]);
        html = html.replace(
          /Días Restantes \/ Remaining Days: <strong>.*?<\/strong>/,
          `Días Restantes / Remaining Days: <strong>${accrued - days}</strong>`
        );
      }

      if (startDate && endDate) {
        const tableRow = `<tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">#MANUAL</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${startDate} - ${endDate}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${days}</td>
        </tr>`;
        html = html.replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>${tableRow}</tbody>`);
        html = html.replace(
          /Total Tomado \/ Total Taken:<\/td>\s*<td.*?>.*?<\/td>/,
          `Total Tomado / Total Taken:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${days}</td>`
        );
      }

      setCurrentHTML(html);
    } else if (activeDoc) {
      setCurrentHTML(activeDoc.content || '');
    }
  }, [activeDoc, startDate, endDate, holidays, hotelConfig.workingDays]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [reqsRes, yearlyRes, holidaysRes] = await Promise.all([
        fetch(`/api/requests?userId=${user.id}`),
        fetch(`/api/requests/documents?type=YEARLY&userId=${user.id}`),
        fetch('/api/holidays')
      ]);

      if (reqsRes.ok) setRequests(await reqsRes.json());
      if (yearlyRes.ok) setYearlyDocs(await yearlyRes.json());
      if (holidaysRes.ok) setHolidays(await holidaysRes.json());
    } catch (error) {
      console.error('Failed to fetch vacations data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openSignModal = (doc: any) => {
    setActiveDoc(doc);
    setSignatureData('');
    setStartDate('');
    setEndDate('');
    setIsSignModalOpen(true);
  };

  const handleSignDocument = async () => {
    if (!activeDoc) return;
    setIsSigning(true);
    try {
      if (!activeDoc.signed_at && !signatureData) {
        alert('Por favor, firme el documento / Please sign the document');
        setIsSigning(false);
        return;
      }

      const res = await fetch('/api/requests/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: activeDoc.request_id,
          signatureData: signatureData || undefined,
          content: activeDoc.request_id.startsWith('YEARLY:') ? currentHTML : undefined,
          data: activeDoc.request_id.startsWith('YEARLY:') ? {
            manualDates: `${startDate} - ${endDate}`,
            manualDays,
            startDate,
            endDate
          } : undefined
        })
      });

      if (res.ok) {
        setIsSignModalOpen(false);
        await fetchData();
      } else {
        alert('Failed to sign document');
      }
    } catch (error) {
      console.error('Error signing document:', error);
    } finally {
      setIsSigning(false);
    }
  };

  if (!user) return null;

  if (!isContractEmployee) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('vacation')}</h1>
          <p className="text-slate-600 mb-6">This section is available only for contract employees.</p>
          <Link href="/dashboard/requests" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
            {t('myRequests')}
          </Link>
        </div>
      </div>
    );
  }

  const { accrued, taken, balance } = calculateVacationBalance(
    user.hireDate,
    requests,
    yearlyDocs,
    holidays,
    hotelConfig.workingDays,
    user.employmentType,
    user.contractSigningDate
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('vacation')}</h1>
          <p className="text-slate-600 mt-2">{t('employmentYear')}</p>
        </div>
        <Link href="/dashboard/requests" className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors">
          {t('myRequests')}
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">{t('loading')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('accrued')}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{accrued} {t('days')}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('taken')}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{taken} {t('days')}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-primary-100 bg-primary-50/30">
              <p className="text-sm font-medium text-primary-600 uppercase tracking-wider">{t('remaining')}</p>
              <p className="text-2xl font-bold text-primary-700 mt-1">{balance} {t('days')}</p>
            </div>
          </div>

          <div className="mt-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('vacation')} - {t('employmentYear')}</h2>
            {yearlyDocs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No yearly vacation documents available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {yearlyDocs.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary-50 rounded-lg">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{t('employmentYear')} {doc.request_id.split(':').pop()}</h3>
                            <p className="text-xs text-slate-500">{formatDisplayDate(doc.created_at)}</p>
                          </div>
                        </div>
                        {doc.is_signed ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold rounded-full uppercase tracking-wider">{t('signed')}</span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider">{t('needsSigning')}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => openSignModal(doc)}
                        className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors shadow-sm ${
                          !doc.is_signed
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {!doc.is_signed ? t('signDocument') : t('viewSignedDocument')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

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
              <div className="max-w-2xl mx-auto bg-white p-12 shadow-sm min-h-[600px] prose prose-slate" dangerouslySetInnerHTML={{ __html: (currentHTML || '').replace(/\n/g, '<br/>') }} />

              {activeDoc.request_id.startsWith('YEARLY:') && !activeDoc.signed_at && (
                <div className="max-w-2xl mx-auto mt-8 bg-amber-50 p-6 rounded-xl border border-amber-200">
                  <h3 className="text-sm font-bold text-amber-900 mb-4">Información Histórica / Historical Info</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-amber-800 mb-1">Fecha Inicio / Start Date</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-800 mb-1">Fecha Fin / End Date</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg" />
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm font-bold text-amber-900">Días a descontar: <span className="text-lg">{manualDays}</span></p>
                    </div>
                  </div>
                </div>
              )}

              {!activeDoc.signed_at && (
                <div className="max-w-2xl mx-auto mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Firma Digital / Digital Signature</h3>
                  <SignaturePad onSave={setSignatureData} />
                </div>
              )}

              {activeDoc.signed_at && (
                <div className="max-w-2xl mx-auto mt-8 pt-8 border-t border-slate-200">
                  <div className="flex flex-col items-center">
                    {activeDoc.signature_data ? (
                      <img src={activeDoc.signature_data} alt="Signature" className="h-24 object-contain mb-2" />
                    ) : (
                      <div className="text-3xl text-slate-800 mb-2" style={{ fontFamily: 'Dancing Script, cursive' }}>
                        {user?.name}
                      </div>
                    )}
                    <div className="h-px w-64 bg-slate-900 mb-2"></div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest text-center">
                      {t('digitallySignedOn')}: {new Date(activeDoc.signed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button onClick={() => setIsSignModalOpen(false)} className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                {activeDoc.signed_at ? t('close') : t('cancel')}
              </button>

              {activeDoc.signed_at ? (
                <button onClick={() => window.print()} className="px-6 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors">
                  {t('downloadPdfPrint')}
                </button>
              ) : (
                <button onClick={handleSignDocument} disabled={isSigning} className="px-8 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg">
                  {isSigning ? t('signing') : t('declareConformity')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
