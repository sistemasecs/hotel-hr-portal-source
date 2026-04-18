"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getHelpCategoriesForRole, getHelpTipsForRole, HelpTip } from '@/data/helpData';
import { X, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartTour: () => void;
}

export default function HelpCenter({ isOpen, onClose, onRestartTour }: HelpCenterProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const categories = getHelpCategoriesForRole(user.role);
  const allTips = getHelpTipsForRole(user.role);

  // Filter tips based on search and selected category
  const filteredTips = allTips.filter(tip => {
    const matchesCategory = !selectedCategory || tip.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      tip.title[language].toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.description[language].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-over Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {language === 'es' ? 'Centro de Ayuda' : 'Help Center'}
                </h2>
                <p className="text-primary-200 text-xs">
                  {language === 'es' ? 'Guías y consejos útiles' : 'Guides & helpful tips'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory(null); }}
              placeholder={language === 'es' ? 'Buscar un tema...' : 'Search for a topic...'}
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Restart Tour Button */}
          <div className="p-4 border-b border-slate-100">
            <button
              onClick={() => {
                onClose();
                onRestartTour();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center transition-colors">
                  <RotateCcw className="w-4 h-4 text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-primary-900">
                    {language === 'es' ? 'Repetir el Tour de Bienvenida' : 'Restart Welcome Tour'}
                  </p>
                  <p className="text-[10px] text-primary-600">
                    {language === 'es' ? 'Recorrido paso a paso del portal' : 'Step-by-step walkthrough of the portal'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-primary-400" />
            </button>
          </div>

          {/* Categories or Tips */}
          {!selectedCategory && !searchQuery ? (
            // Category Grid
            <div className="p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {language === 'es' ? 'Categorías' : 'Categories'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const tipCount = allTips.filter(t => t.category === category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center mb-3 transition-colors">
                        <svg className="w-4 h-4 text-slate-500 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-primary-900 transition-colors">
                        {category.name[language]}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {tipCount} {tipCount === 1 ? (language === 'es' ? 'tema' : 'topic') : (language === 'es' ? 'temas' : 'topics')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Tips List
            <div className="p-4">
              {selectedCategory && !searchQuery && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-800 font-medium mb-4 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{language === 'es' ? 'Todas las categorías' : 'All categories'}</span>
                </button>
              )}

              {selectedCategoryData && !searchQuery && (
                <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedCategoryData.icon} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedCategoryData.name[language]}</h3>
                    <p className="text-[10px] text-slate-400">{filteredTips.length} {language === 'es' ? 'temas' : 'topics'}</p>
                  </div>
                </div>
              )}

              {searchQuery && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  {filteredTips.length} {language === 'es' ? 'resultados' : 'results'}
                </p>
              )}

              <div className="space-y-2">
                {filteredTips.length > 0 ? (
                  filteredTips.map((tip) => (
                    <TipCard 
                      key={tip.id} 
                      tip={tip} 
                      language={language} 
                      isExpanded={expandedTip === tip.id}
                      onToggle={() => setExpandedTip(expandedTip === tip.id ? null : tip.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm text-slate-400">
                      {language === 'es' ? 'No se encontraron resultados' : 'No results found'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <p className="text-[10px] text-slate-400 text-center">
            {language === 'es' 
              ? '¿Necesitas más ayuda? Contacta a tu supervisor o al departamento de RR.HH.'
              : 'Need more help? Contact your supervisor or the HR department.'}
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Tip Card Sub-component ─────────────────────────────────
function TipCard({ tip, language, isExpanded, onToggle }: { tip: HelpTip; language: 'en' | 'es'; isExpanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isExpanded
          ? 'border-primary-200 bg-primary-50 shadow-sm'
          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
          isExpanded ? 'bg-primary-100' : 'bg-slate-100'
        }`}>
          <svg className={`w-4 h-4 transition-colors ${isExpanded ? 'text-primary-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tip.icon} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold transition-colors ${isExpanded ? 'text-primary-900' : 'text-slate-800'}`}>
              {tip.title[language]}
            </p>
            <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform flex-shrink-0 ml-2 ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 mt-2' : 'max-h-0'}`}>
            <p className="text-xs text-slate-600 leading-relaxed">
              {tip.description[language]}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
