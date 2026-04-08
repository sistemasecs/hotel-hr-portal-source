"use client";

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useData } from '@/context/DataContext';
import SignaturePad from './SignaturePad';

interface TierAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  tierId: number;
  tierName: string;
  onSuccess: () => void;
}

export default function TierAgreementModal({ isOpen, onClose, userId, tierId, tierName, onSuccess }: TierAgreementModalProps) {
  const { t } = useLanguage();
  const { hotelConfig, fetchTierCompletions } = useData();
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const agreementText = hotelConfig.trainingTiers?.find(t => t.id === tierId)?.agreementTemplate || '';

  const handleSubmit = async () => {
    if (!signatureData) {
      setError('Please provide your signature');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/training-modules/tier-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tierId,
          signatureData
        })
      });

      if (response.ok) {
        await fetchTierCompletions(userId);
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save agreement');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-primary-50">
          <div>
            <h2 className="text-xl font-bold text-primary-900">{t(`tierAgreement${tierId}` as any) || `${tierName} Agreement`}</h2>
            <p className="text-sm text-primary-700 mt-1">{t('signToProceed')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          <div className="prose prose-slate max-w-none mb-8">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-700 leading-relaxed shadow-inner">
              "{agreementText || 'Agreement text not configured.'}"
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              {t('digitalSignature') || 'Digital Signature'}
            </label>
            <SignaturePad 
              onSave={setSignatureData} 
              onClear={() => setSignatureData(null)}
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center space-x-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors order-2 sm:order-1"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!signatureData || isSubmitting}
            className={`w-full sm:flex-1 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-200 transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:grayscale order-1 sm:order-2 flex items-center justify-center space-x-2`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('signing') || 'Signing...'}</span>
              </>
            ) : (
              <span>{t('agreeAndSign')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
