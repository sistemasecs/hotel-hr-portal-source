"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';

export default function LearningCenterPage() {
  const { user } = useAuth();
  const { trainingModules, userTrainings, assignTraining } = useData();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'My Trainings' | 'Available'>('My Trainings');
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

  const handleStartModule = (moduleId: string) => {
    router.push(`/dashboard/learning/${moduleId}`);
  };

  const handleEnroll = (moduleId: string) => {
    assignTraining(user.id, moduleId);
    router.push(`/dashboard/learning/${moduleId}`);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('learningCenter')}</h1>
          <p className="text-slate-500 mt-2">{t('enhanceSkills')}</p>
        </div>
        <div className="flex space-x-2">
          {['My Trainings', 'Available'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab === 'My Trainings' ? t('myTrainings') : t('available')}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'My Trainings' ? (
          myTrainings.length > 0 ? (
            myTrainings.map(training => (
              <div key={training.moduleId} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    training.module?.type === 'Video' ? 'bg-blue-100 text-blue-800' :
                    training.module?.type === 'Document' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {training.module?.type}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    training.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    training.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {training.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{training.module?.title}</h3>
                <p className="text-sm text-slate-600 flex-grow">{training.module?.description}</p>
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500">⏱ {training.module?.duration}</span>
                  {training.status !== 'Completed' && (
                    <button
                      onClick={() => handleStartModule(training.moduleId)}
                      className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      {training.status === 'Not Started' ? t('startModule') : t('continueModule')}
                    </button>
                  )}
                  {training.status === 'Completed' && (
                    <button
                      onClick={() => handleStartModule(training.moduleId)}
                      className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {t('reviewModule')}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 col-span-full">You have no assigned trainings.</p>
          )
        ) : (
          availableTrainings.length > 0 ? (
            availableTrainings.map(module => (
              <div key={module.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full opacity-75 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    module.type === 'Video' ? 'bg-blue-100 text-blue-800' :
                    module.type === 'Document' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {module.type}
                  </span>
                  {module.required && (
                    <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800">
                      {t('required')}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{module.title}</h3>
                <p className="text-sm text-slate-600 flex-grow">{module.description}</p>
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500">⏱ {module.duration}</span>
                  <button
                    onClick={() => handleEnroll(module.id)}
                    className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    {t('enroll')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 col-span-full">No new trainings available for your department.</p>
          )
        )}
      </div>
    </div>
  );
}
