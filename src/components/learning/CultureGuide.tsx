"use client";

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useData } from '@/context/DataContext';

export default function CultureGuide() {
  const [activeTab, setActiveTab] = useState<'glossary' | 'protocols'>('protocols');
  const { t, language } = useLanguage();
  const { hotelConfig } = useData();

  const defaultGlossary = [
    { term: 'ADR', definition: 'Average Daily Rate. The average revenue earned for an occupied room on a given day.' },
    { term: 'PMS', definition: 'Property Management System. The software used to manage reservations and guest data.' },
    { term: 'RevPAR', definition: 'Revenue Per Available Room. A key performance metric in the hotel industry.' },
    { term: 'FO', definition: 'Front Office. The primary guest-facing department of the hotel.' },
    { term: 'HK', definition: 'Housekeeping. The department responsible for room cleanliness and maintenance.' },
    { term: 'B&B', definition: 'Bed and Breakfast. A rate type that inclusive of morning meal service.' },
  ];

  const defaultProtocols = [
    { channel: 'Slack / Instant Messaging', useCase: 'Quick syncs, urgent internal updates, and team building.', icon: '💬' },
    { channel: 'Email', useCase: 'Official documents, guest communications, and non-urgent formal requests.', icon: '📧' },
    { channel: 'Meetings', useCase: 'Complex coordination, sensitive topics, and strategy sessions.', icon: '👥' },
    { channel: 'HR Portal', useCase: 'Vacations, training, and employee benefits management.', icon: '📲' },
  ];

  const items = hotelConfig.glossary || defaultGlossary;
  const protocolItems = hotelConfig.commProtocols || defaultProtocols;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <div className="bg-slate-50 border-b border-slate-100 p-4 flex space-x-4">
        <button
          onClick={() => setActiveTab('protocols')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'protocols' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          {t('commProtocols')}
        </button>
        <button
          onClick={() => setActiveTab('glossary')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'glossary' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          {t('glossary')}
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-grow bg-white">
        {activeTab === 'glossary' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Internal Acronyms</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-100 transition-colors">
                  <span className="font-bold text-primary-600 block mb-1">{item.term}</span>
                  <p className="text-sm text-slate-600 leading-snug">{item.definition}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{t('whenToUse')}</h4>
            <div className="space-y-3">
              {protocolItems.map((p, idx) => (
                <div key={idx} className="flex items-center p-4 rounded-xl border border-slate-50 bg-slate-50/50 group hover:border-primary-100 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition-transform">
                    {p.icon}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{p.channel}</span>
                    <p className="text-sm text-slate-600">{p.useCase}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
