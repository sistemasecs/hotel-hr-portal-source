"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useData } from '@/context/DataContext';

export default function ValueChain() {
  const { t } = useLanguage();
  const { hotelConfig } = useData();

  const defaultSteps = [
    { id: 1, name: 'Lead / Reservation', icon: '📞', color: 'bg-blue-500' },
    { id: 2, name: 'Arrival / Check-in', icon: '🏨', color: 'bg-emerald-500' },
    { id: 3, name: 'The Stay Experience', icon: '✨', color: 'bg-amber-500' },
    { id: 4, name: 'Guest Feedback', icon: '⭐', color: 'bg-indigo-500' },
    { id: 5, name: 'Loyal Guest / Departure', icon: '🤝', color: 'bg-purple-500' },
  ];

  const steps = hotelConfig.valueChain || defaultSteps;

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center">
        <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mr-3 text-sm">
          🗺️
        </span>
        {t('valueChain')}
      </h3>
      
      <div className="relative flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
        {/* Horizontal Line for Desktop */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 -z-10"></div>
        
        {steps.map((step, idx) => (
          <div key={step.id} className="relative flex flex-col items-center group">
            <div className={`w-16 h-16 rounded-2xl ${step.color} text-white flex items-center justify-center text-2xl shadow-lg transform transition-transform group-hover:scale-110 duration-300 z-10`}>
              {step.icon}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-bold text-slate-900 whitespace-nowrap">{step.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-semibold">Step {step.id}</p>
            </div>
            
            {/* Arrow for Desktop */}
            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-4 translate-x-1/2 -translate-y-1/2 text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t('ourGoal')}</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{hotelConfig.valueChainGoal || 'Ensure every guest feels at home from the first contact to their next visit.'}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t('yourValue')}</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{hotelConfig.valueChainValue || 'No matter your department, you are a critical link in this chain of excellence.'}</p>
        </div>
      </div>
    </div>
  );
}
