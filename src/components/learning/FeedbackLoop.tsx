"use client";

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface FeedbackLoopProps {
  onFeedback: (wasClear: boolean) => void;
}

export default function FeedbackLoop({ onFeedback }: FeedbackLoopProps) {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const handleChoice = (choice: boolean) => {
    setSubmitted(true);
    onFeedback(choice);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center animate-in fade-in zoom-in duration-300">
        <p className="text-emerald-800 font-bold">✨ {t('thankYouNomination') || 'Thank you for your feedback!'}</p>
      </div>
    );
  }

  return (
    <div className="bg-primary-50 border border-primary-100 p-6 rounded-xl text-center">
      <h3 className="text-lg font-bold text-primary-900 mb-4">{t('wasThisClear') || 'Was this training module clear?'}</h3>
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => handleChoice(true)}
          className="px-8 py-2 bg-white text-emerald-600 border-2 border-emerald-500 rounded-full font-bold hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-105 active:scale-95"
        >
          {t('yes') || 'Yes'}
        </button>
        <button
          onClick={() => handleChoice(false)}
          className="px-8 py-2 bg-white text-red-600 border-2 border-red-500 rounded-full font-bold hover:bg-red-500 hover:text-white transition-all transform hover:scale-105 active:scale-95"
        >
          {t('no') || 'No'}
        </button>
      </div>
    </div>
  );
}
