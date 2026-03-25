"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter, useParams } from 'next/navigation';
import SecureDocumentViewer from '@/components/learning/SecureDocumentViewer';

export default function ModulePlayerPage() {
  const { user } = useAuth();
  const { trainingModules, userTrainings, updateTrainingStatus } = useData();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<'passed' | 'failed' | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);

  const module = trainingModules.find(m => m.id === moduleId);
  const userTraining = userTrainings.find(ut => ut.userId === user?.id && ut.moduleId === moduleId);

  useEffect(() => {
    if (!user || !module) {
      router.push('/dashboard/learning');
    } else if (userTraining?.status === 'Not Started') {
      updateTrainingStatus(user.id, moduleId, 'In Progress');
    }
  }, [user, module, userTraining, router, moduleId, updateTrainingStatus]);

  if (!user || !module) return null;

  const handleComplete = () => {
    updateTrainingStatus(user.id, moduleId, 'Completed');
    router.push('/dashboard/learning');
  };

  const handleQuizSubmit = () => {
    if (!module.questions) return;

    let score = 0;
    module.questions.forEach((q) => {
      const selectedOptionIndex = selectedAnswers[q.id];
      if (selectedOptionIndex !== undefined) {
        score += q.options[selectedOptionIndex].score;
      }
    });

    setTotalScore(score);

    const passed = module.passingScore !== undefined ? score >= module.passingScore : true;
    setQuizResult(passed ? 'passed' : 'failed');

    if (passed) {
      updateTrainingStatus(user.id, moduleId, 'Completed');
    }
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
    setQuizResult(null); // Reset result on new answer
    setTotalScore(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <button
            onClick={() => router.push('/dashboard/learning')}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium mb-2 flex items-center"
          >
            ← Back to Learning Center
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{module.title}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
              module.type === 'Video' ? 'bg-blue-100 text-blue-800' :
              module.type === 'Document' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {module.type}
            </span>
            <span className="text-sm text-slate-500">⏱ {module.duration}</span>
          </div>
        </div>
        {userTraining?.status === 'Completed' && (
          <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-bold text-sm flex items-center">
            ✓ Completed
          </span>
        )}
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <p className="text-slate-700">{module.description}</p>
        </div>

        <div className="p-6">
          {module.type === 'Video' || module.type === 'Document' ? (
            <div className="space-y-6">
              {module.contentUrl ? (
                module.type === 'Document' ? (
                  <div className="w-full bg-slate-100/50 rounded-lg overflow-hidden border border-slate-200">
                    {(() => {
                      const isPdf = module.contentUrl.toLowerCase().endsWith('.pdf') || module.mimeType === 'application/pdf';
                      const isGoogleDriveUrl = module.contentUrl.includes('drive.google.com');
                      
                      if (isGoogleDriveUrl) {
                        return (
                          <iframe
                            src={module.contentUrl}
                            className="w-full h-[600px]"
                            allow="autoplay"
                            title={module.title}
                          />
                        );
                      }
                      
                      if (isPdf) {
                        return (
                          <div className="py-6 flex flex-col items-center">
                            <SecureDocumentViewer fileUrl={module.contentUrl} />
                          </div>
                        );
                      }
                      
                      // For other documents (Word, Excel, PPT) uploaded or generic URLs
                      // We use Google Docs Viewer to render them inline
                      return (
                        <iframe
                          src={`https://docs.google.com/viewer?url=${encodeURIComponent(module.contentUrl)}&embedded=true`}
                          className="w-full h-[600px] bg-slate-50"
                          title={module.title}
                        />
                      );
                    })()}
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-slate-900 rounded-lg shadow-inner overflow-hidden border border-slate-800 flex items-center justify-center">
                    {(() => {
                      const isNativeVideo = module.contentType === 'File' || module.contentUrl.toLowerCase().endsWith('.mp4') || module.contentUrl.toLowerCase().endsWith('.webm');
                      
                      if (isNativeVideo) {
                        return (
                          <video 
                            controls 
                            controlsList="nodownload" 
                            className="w-full h-full max-h-full"
                          >
                            <source src={module.contentUrl} type={module.mimeType || 'video/mp4'} />
                            Your browser does not support the video tag.
                          </video>
                        );
                      }
                      
                      return (
                        <iframe
                          src={module.contentUrl}
                          className="w-full h-full"
                          allowFullScreen
                          allow="autoplay"
                          title={module.title}
                        />
                      );
                    })()}
                  </div>
                )
              ) : (
                <div className="aspect-video w-full bg-slate-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
                  <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p className="text-slate-500 font-medium">Content is currently unavailable.</p>
                </div>
              )}
              
              {userTraining?.status !== 'Completed' && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleComplete}
                    className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors shadow-sm"
                  >
                    Mark as Completed
                  </button>
                </div>
              )}
            </div>
          ) : module.type === 'Quiz' ? (
            <div className="space-y-8">
              {module.questions?.map((q, index) => (
                <div key={q.id} className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">
                    {index + 1}. {q.question}
                  </h3>
                  <div className="space-y-2 pl-4">
                    {q.options.map((opt, optIndex) => (
                      <label
                        key={optIndex}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAnswers[q.id] === optIndex
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={optIndex}
                          checked={selectedAnswers[q.id] === optIndex}
                          onChange={() => handleAnswerSelect(q.id, optIndex)}
                          className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                          disabled={userTraining?.status === 'Completed'}
                        />
                        <span className="ml-3 text-slate-700">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {quizResult && (
                <div className={`p-4 border rounded-lg ${
                  quizResult === 'passed' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <h4 className="font-bold mb-1">
                    {quizResult === 'passed' ? 'Congratulations! You passed.' : 'You did not pass.'}
                  </h4>
                  <p>Your score: {totalScore}</p>
                  {module.passingScore !== undefined && (
                    <p className="text-sm mt-1 opacity-80">Passing score: {module.passingScore}</p>
                  )}
                  {quizResult === 'failed' && (
                    <p className="text-sm mt-2">Please review the material and try again.</p>
                  )}
                </div>
              )}

              {userTraining?.status !== 'Completed' && (
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(selectedAnswers).length !== (module.questions?.length || 0)}
                    className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Quiz
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
