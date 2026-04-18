"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { getTourStepsForRole } from '@/data/helpData';

interface AppTourProps {
  onComplete: () => void;
}

export default function AppTour({ onComplete }: AppTourProps) {
  const { user } = useAuth();
  const { updateUser } = useData();
  const { language } = useLanguage();
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState<{
    hx: number; hy: number; hw: number; hh: number;
    tx: number; ty: number; tw: number;
    arrowDir: 'up' | 'down'; arrowX: number;
    found: boolean;
  } | null>(null);

  const stepsRef = useRef(user ? getTourStepsForRole(user.role) : []);
  const steps = stepsRef.current;
  const total = steps.length;

  // ── ESC to close ──
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // ── Measure & position whenever step changes ──
  useEffect(() => {
    const measure = () => {
      const s = steps[step];
      if (!s) return;

      const el = document.getElementById(s.targetId);
      const tw = Math.min(380, window.innerWidth - 32);

      if (!el) {
        // No target → centered card, no highlight
        setPos({
          hx: 0, hy: 0, hw: 0, hh: 0,
          tx: window.innerWidth / 2 - tw / 2,
          ty: window.innerHeight / 2 - 150,
          tw,
          arrowDir: 'up', arrowX: tw / 2,
          found: false,
        });
        return;
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Small delay for scroll to settle
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        const pad = 8;
        const gap = 14;

        // Highlight box
        const hx = r.left - pad;
        const hy = r.top - pad;
        const hw = r.width + pad * 2;
        const hh = r.height + pad * 2;

        // Tooltip position: prefer below, fallback above
        let ty: number;
        let arrowDir: 'up' | 'down';

        if (r.bottom + gap + 320 < window.innerHeight) {
          ty = r.bottom + gap;
          arrowDir = 'up';
        } else {
          ty = Math.max(16, r.top - gap - 320);
          arrowDir = 'down';
        }

        const tx = Math.max(16, Math.min(
          r.left + r.width / 2 - tw / 2,
          window.innerWidth - tw - 16
        ));

        const arrowX = Math.max(20, Math.min(
          r.left + r.width / 2 - tx,
          tw - 20
        ));

        setPos({ hx, hy, hw, hh, tx, ty, tw, arrowDir, arrowX, found: true });
      }, 250);
    };

    measure();

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step]);

  // ── Actions ──
  const next = () => { if (step < total - 1) setStep(s => s + 1); else finish(); };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const finish = async () => {
    onComplete();
    if (user) {
      try {
        await updateUser(user.id, { hasSeenTour: true });
        const stored = localStorage.getItem('hotel_hr_user');
        if (stored) {
          const p = JSON.parse(stored);
          p.hasSeenTour = true;
          localStorage.setItem('hotel_hr_user', JSON.stringify(p));
        }
      } catch { /* ignore */ }
    }
  };

  if (total === 0) return null;

  const cur = steps[step];
  const pct = ((step + 1) / total) * 100;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* ─── Overlay with cutout ─── */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'auto' }}>
        <defs>
          <mask id="tour-m">
            <rect width="100%" height="100%" fill="white" />
            {pos?.found && (
              <rect x={pos.hx} y={pos.hy} width={pos.hw} height={pos.hh} rx="14" fill="black" />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(15,23,42,0.72)" mask="url(#tour-m)" />
      </svg>

      {/* ─── Highlight ring ─── */}
      {pos?.found && (
        <div
          className="absolute pointer-events-none rounded-[14px] border-2 border-primary-400 transition-all duration-500"
          style={{ top: pos.hy, left: pos.hx, width: pos.hw, height: pos.hh,
            boxShadow: '0 0 0 4px rgba(99,102,241,0.15)' }}
        />
      )}

      {/* ─── Tooltip Card ─── */}
      {pos && (
        <div
          className="fixed"
          style={{ top: pos.ty, left: pos.tx, width: pos.tw, pointerEvents: 'auto', zIndex: 10001 }}
        >
          {/* Arrow */}
          {pos.found && (
            <div className="absolute" style={
              pos.arrowDir === 'up'
                ? { top: -9, left: pos.arrowX - 10 }
                : { bottom: -9, left: pos.arrowX - 10 }
            }>
              <svg width="20" height="10" viewBox="0 0 20 10">
                {pos.arrowDir === 'up'
                  ? <polygon points="10,0 20,10 0,10" fill="white" />
                  : <polygon points="0,0 20,0 10,10" fill="white" />}
              </svg>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-500 rounded-r-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={cur.icon} />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-primary-600">
                    {language === 'es' ? 'Paso' : 'Step'} {step + 1} / {total}
                  </span>
                </div>
                <button
                  onClick={finish}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {language === 'es' ? 'Saltar ✕' : 'Skip ✕'}
                </button>
              </div>

              {/* Title */}
              <h3 className="text-[17px] font-bold text-slate-900 mb-1.5 leading-snug">
                {cur.title[language]}
              </h3>

              {/* Description */}
              <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                {cur.description[language]}
              </p>

              {/* Dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === step ? 'w-5 bg-primary-600'
                      : i < step ? 'w-1.5 bg-primary-300'
                      : 'w-1.5 bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={prev}
                  disabled={step === 0}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold rounded-xl transition-all ${
                    step === 0
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>{language === 'es' ? 'Atrás' : 'Back'}</span>
                </button>

                <button
                  onClick={next}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-bold text-white rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-[0.97]"
                >
                  <span>
                    {step === total - 1
                      ? (language === 'es' ? '¡Empezar! 🚀' : 'Get Started! 🚀')
                      : (language === 'es' ? 'Siguiente' : 'Next')}
                  </span>
                  {step < total - 1 && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
