"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import ValueChain from '@/components/learning/ValueChain';
import CultureGuide from '@/components/learning/CultureGuide';
import TierAgreementModal from '@/components/learning/TierAgreementModal';
import { TrainingModule } from '@/types';

export default function LearningCenterPage() {
  const { user } = useAuth();
  const { trainingModules, userTrainings, assignTraining, tierCompletions, hotelConfig } = useData();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'My Trainings' | 'Available'>('My Trainings');
  const [agreementModal, setAgreementModal] = useState<{ isOpen: boolean; tierId: number; tierName: string } | null>(null);
  const router = useRouter();

  if (!user) return null;

  // Get trainings assigned to the user
  const myTrainings = userTrainings
    .filter(ut => ut.userId === user.id)
    .map(ut => {
      const module = trainingModules.find(m => m.id === ut.moduleId);
      return { ...ut, module };
    })
    .filter(ut => ut.module);

  // Get available trainings for the user's department that aren't already assigned
  const availableTrainings = trainingModules.filter(m => 
    m.targetDepartments.includes(user.department) &&
    !userTrainings.some(ut => ut.userId === user.id && ut.moduleId === m.id)
  );

  const tiers = hotelConfig.trainingTiers || [];

  // Logic to determine current unlock status
  const getTierStatus = (tierId: number) => {
    if (tierId === 1) return 'unlocked';

    // Check if previous tier is fully completed AND signed
    const prevTier = tiers.find(t => t.id === tierId - 1);
    if (!prevTier) return 'unlocked';

    const prevTierModules = trainingModules.filter(m => 
      m.category === prevTier.name && m.targetDepartments.includes(user.department)
    );
    
    // Modules from prev tier that the user actually has (or should have)
    const completedCount = myTrainings.filter(ut => 
      ut.module?.category === prevTier.name && ut.status === 'Completed'
    ).length;

    // Requirement: All assigned/required modules in that tier must be 'Completed'
    // For now, we assume if prevTierModules.length > 0, they must all be done.
    const isFullyCompleted = prevTierModules.length > 0 && completedCount >= prevTierModules.length;
    const isSigned = tierCompletions.some(tc => tc.tierId === prevTier.id);

    return (isFullyCompleted && isSigned) ? 'unlocked' : 'locked';
  };

  // Logic to check if current tier needs signature
  const checkPendingSignature = () => {
    for (const tier of tiers) {
      const tierModules = trainingModules.filter(m => 
        m.category === tier.name && m.targetDepartments.includes(user.department)
      );
      
      const completedCount = myTrainings.filter(ut => 
        ut.module?.category === tier.name && ut.status === 'Completed'
      ).length;

      const isFullyCompleted = tierModules.length > 0 && completedCount >= tierModules.length;
      const isSigned = tierCompletions.some(tc => tc.tierId === tier.id);

      if (isFullyCompleted && !isSigned) {
        return tier;
      }
    }
    return null;
  };

  // Auto-trigger signature modal if needed
  React.useEffect(() => {
    const pendingTier = checkPendingSignature();
    if (pendingTier && !agreementModal?.isOpen) {
      setAgreementModal({
        isOpen: true,
        tierId: pendingTier.id,
        tierName: pendingTier.name
      });
    }
  }, [myTrainings, tierCompletions]);

  const handleStartModule = (moduleId: string) => {
    router.push(`/dashboard/learning/${moduleId}`);
  };

  const handleEnroll = (moduleId: string) => {
    assignTraining(user.id, moduleId);
    router.push(`/dashboard/learning/${moduleId}`);
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">{t('learningCenter')}</h1>
        <p className="text-slate-500 mt-2">{t('enhanceSkills')}</p>
      </header>

      {/* Top Section: My Trainings & Culture Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center space-x-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.73 5.832 18.253 7.5 18.253s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.73 18.167 18.253 16.5 18.253s-3.332.477-4.5 1.253" /></svg>
             </div>
             <h2 className="text-xl font-bold text-slate-800">{t('myTrainings')}</h2>
           </div>
           
           {myTrainings.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myTrainings.slice(0, 4).map((item) => {
                  const module = item.module!;
                  return (
                    <div key={module.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-slate-100 rounded-full text-slate-600">{module.type}</span>
                          <span className={`text-[10px] font-bold uppercase ${item.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{item.status === 'In Progress' ? t('statusInProgress') : item.status}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{module.title}</h4>
                      </div>
                      <button 
                        onClick={() => handleStartModule(item.moduleId)}
                        className="mt-4 text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center"
                      >
                        {item.status === 'Completed' ? t('reviewModule') : t('continueModule')}
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  );
                })}
             </div>
           ) : (
             <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center">
                <p className="text-sm text-slate-400 italic">No tienes entrenamientos activos.</p>
             </div>
           )}
        </div>
        
        <div className="lg:col-span-1">
          <CultureGuide />
        </div>
      </div>

      {/* Value Chain - Full Width */}
      <ValueChain />

      {/* Tiered Modules Section */}
      <div className="space-y-12">
        {tiers.map((tier) => {
          const tierStatus = getTierStatus(tier.id);
          const isLocked = tierStatus === 'locked';

          const tierModules = activeTab === 'My Trainings'
            ? myTrainings.filter(t => t.module?.category === tier.name)
            : availableTrainings.filter(m => m.category === tier.name);

          if (tierModules.length === 0 && activeTab === 'Available') return null;

          return (
            <section key={tier.id} className="space-y-6">
              <div className="border-l-4 border-primary-500 pl-4 py-2 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{tier.name}</h2>
                  <p className="text-slate-500 max-w-2xl mt-1">{tier.description}</p>
                </div>
                {isLocked && (
                  <div className="flex items-center bg-amber-50 text-amber-700 px-3 py-1 rounded-lg border border-amber-100 animate-pulse">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span className="text-xs font-bold uppercase tracking-wider">{t('locked')}</span>
                  </div>
                )}
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500 ${isLocked ? 'grayscale opacity-60 pointer-events-none' : ''}`}>
                {isLocked ? (
                   <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center col-span-full">
                    <p className="text-sm text-slate-500 font-medium">{t('completeTierToUnlock')}</p>
                   </div>
                ) : tierModules.length > 0 ? (
                  tierModules.map((item) => {
                    const module = 'module' in item ? item.module : item as TrainingModule;
                    const status = 'status' in item ? item.status : null;
                    const moduleId = 'moduleId' in item ? item.moduleId : (item as TrainingModule).id;

                    if (!module) return null;

                    return (
                      <div key={module.id} className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full transition-all hover:shadow-md ${!status ? 'opacity-90 hover:opacity-100' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            module.type === 'Video' ? 'bg-blue-100 text-blue-800' :
                            module.type === 'Document' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {module.type}
                          </span>
                          {status ? (
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {status === 'In Progress' ? t('statusInProgress') : status}
                            </span>
                          ) : module.required && (
                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
                              {t('required')}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{module.title}</h3>
                        <p className="text-xs text-slate-600 flex-grow line-clamp-3">{module.description}</p>
                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400">⏱ {module.duration}</span>
                          {!status ? (
                            <button
                              onClick={() => handleEnroll(module.id)}
                              className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors"
                            >
                              {t('enroll')}
                            </button>
                          ) : status !== 'Completed' ? (
                            <button
                              onClick={() => handleStartModule(moduleId)}
                              className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors"
                            >
                              {status === 'Not Started' ? t('startModule') : t('continueModule')}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartModule(moduleId)}
                              className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                            >
                              {t('reviewModule')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center col-span-full">
                    <p className="text-sm text-slate-400 italic">No modules assigned to this tier yet.</p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {agreementModal && (
        <TierAgreementModal
          isOpen={agreementModal.isOpen}
          userId={user.id}
          tierId={agreementModal.tierId}
          tierName={agreementModal.tierName}
          onClose={() => setAgreementModal(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
