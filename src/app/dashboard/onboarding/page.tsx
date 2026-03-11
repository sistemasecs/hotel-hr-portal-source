"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OnboardingPage() {
    const { user } = useAuth();
    const { trainingModules, userTrainings, isUserOnboarded } = useData();
    const { t } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Give DataContext a moment to finish initial fetch
        const timer = setTimeout(() => {
            if (user && isUserOnboarded(user)) {
                router.push('/dashboard');
            }
            setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [user, isUserOnboarded, trainingModules, userTrainings, router]);

    if (!user || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const requiredModules = trainingModules.filter(
        (m) => m.isOnboardingRequirement && m.targetDepartments.includes(user.department)
    );

    const completedModuleIds = userTrainings
        .filter((ut) => ut.userId === user.id && ut.status === 'Completed')
        .map((ut) => ut.moduleId);

    const progress = requiredModules.length === 0 ? 100 : Math.round((completedModuleIds.length / requiredModules.length) * 100);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up mt-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center p-10">
                <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Welcome to El Carmen Hotel!</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Before you can access the employee portal, you need to complete a few mandatory onboarding modules. Please review the documents and complete the quizzes below.
                </p>

                <div className="mt-8 max-w-md mx-auto">
                    <div className="flex items-center justify-between text-sm font-medium mb-2">
                        <span className="text-slate-700">Onboarding Progress</span>
                        <span className="text-primary-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                        <div
                            className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requiredModules.map(module => {
                    const isCompleted = completedModuleIds.includes(module.id);
                    return (
                        <div key={module.id} className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${isCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-primary-300 hover:shadow-md'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${module.type === 'Video' ? 'bg-blue-100 text-blue-800' :
                                    module.type === 'Document' ? 'bg-indigo-100 text-indigo-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                    {module.type}
                                </span>
                                {isCompleted && (
                                    <span className="flex items-center text-emerald-600 text-sm font-bold">
                                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Completed
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{module.title}</h3>
                            <p className="text-slate-600 mb-6 text-sm line-clamp-3">{module.description}</p>
                            
                            <Link href={`/dashboard/learning/${module.id}`} className={`block w-full text-center px-4 py-2 rounded-lg font-bold transition-colors ${isCompleted ? 'bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
                                {isCompleted ? 'Review Again' : 'Start Module'}
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
