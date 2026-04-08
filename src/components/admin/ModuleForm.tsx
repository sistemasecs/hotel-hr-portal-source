"use client";

import React, { useState } from 'react';
import { TrainingModule, QuizQuestion } from '@/types';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';

interface ModuleFormProps {
  initialData?: TrainingModule;
  onSubmit: (data: Omit<TrainingModule, 'id'>) => void;
  onCancel: () => void;
}

export default function ModuleForm({ initialData, onSubmit, onCancel }: ModuleFormProps) {
  const { departments, hotelConfig } = useData();
  const { t } = useLanguage();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<'Video' | 'Document' | 'Quiz'>(initialData?.type || 'Video');
  const [duration, setDuration] = useState(initialData?.duration || '');
  const [targetDepartments, setTargetDepartments] = useState<string[]>(initialData?.targetDepartments || []);
  const [required, setRequired] = useState(initialData?.required || false);
  const [isOnboardingRequirement, setIsOnboardingRequirement] = useState(initialData?.isOnboardingRequirement || false);
  const [contentUrl, setContentUrl] = useState(initialData?.contentUrl || '');
  const [contentType, setContentType] = useState<'Url' | 'File'>(initialData?.contentType || 'Url');
  const [fileName, setFileName] = useState(initialData?.fileName || '');
  const [fileSize, setFileSize] = useState<number | undefined>(initialData?.fileSize);
  const [mimeType, setMimeType] = useState(initialData?.mimeType || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialData?.questions || []);
  const [passingScore, setPassingScore] = useState<number>(initialData?.passingScore || 0);
  const [category, setCategory] = useState<string>(initialData?.category || '');

  const handleDepartmentToggle = (dept: string) => {
    setTargetDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      id: `q${Date.now()}`,
      question: '',
      options: [{ text: '', score: 0 }, { text: '', score: 0 }],
    }]);
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, field: 'text' | 'score', value: any) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = { ...newQuestions[qIndex].options[oIndex], [field]: value };
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({ text: '', score: 0 });
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Automatically convert Google Drive URLs to preview mode
    let finalUrl = contentUrl;
    if (contentType === 'Url' && type !== 'Quiz' && finalUrl) {
      if (finalUrl.includes('drive.google.com/file/d/') && finalUrl.includes('/view')) {
        finalUrl = finalUrl.replace('/view', '/preview');
      }
    }

    onSubmit({
      title,
      description,
      type,
      duration,
      targetDepartments,
      required,
      isOnboardingRequirement,
      contentUrl: type !== 'Quiz' ? finalUrl : undefined,
      contentType: type !== 'Quiz' ? contentType : undefined,
      fileName: type !== 'Quiz' && contentType === 'File' ? fileName : undefined,
      fileSize: type !== 'Quiz' && contentType === 'File' ? fileSize : undefined,
      mimeType: type !== 'Quiz' && contentType === 'File' ? mimeType : undefined,
      questions: type === 'Quiz' ? questions : undefined,
      passingScore: type === 'Quiz' ? passingScore : undefined,
      category: category || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">{t('title')}</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">{t('type')}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Video">{t('video')}</option>
            <option value="Document">{t('document')}</option>
            <option value="Quiz">{t('quiz')}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">{t('moduleTier') || 'Module Tier'}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('selectTier') || 'Select Tier...'}</option>
            {(hotelConfig.trainingTiers || []).map((tier: any) => (
              <option key={tier.id} value={tier.name}>{tier.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">{t('description')}</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">{t('duration')}</label>
          <select
            required
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="" disabled>{t('selectDuration')}</option>
            <option value="15 mins">15 mins</option>
            <option value="30 mins">30 mins</option>
            <option value="45 mins">45 mins</option>
            <option value="1 hour">1 hour</option>
            <option value="1.5 hours">1.5 hours</option>
            <option value="2 hours">2 hours</option>
            <option value="3 hours">3 hours</option>
            <option value="4+ hours">4+ hours</option>
          </select>
        </div>

        <div className="space-y-4 flex flex-col justify-center pt-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-slate-700">{t('requiredTraining')}</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isOnboardingRequirement}
              onChange={(e) => setIsOnboardingRequirement(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-slate-700">Is Onboarding Requirement?</span>
          </label>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">{t('targetDepts')}</label>
          <div className="flex flex-wrap gap-2">
            {departments.map(dept => (
              <button
                key={dept.id}
                type="button"
                onClick={() => handleDepartmentToggle(dept.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  targetDepartments.includes(dept.name)
                    ? 'bg-primary-100 text-primary-800 border border-primary-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>
          {targetDepartments.length === 0 && (
            <p className="text-xs text-red-500 mt-1">{t('fillRequiredFields')}</p>
          )}
        </div>

        <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">{t('moduleContent')}</h3>
          
          {type !== 'Quiz' ? (
            <div className="space-y-6">
              <div className="flex space-x-6 border-b border-slate-200 pb-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={contentType === 'Url'}
                    onChange={() => setContentType('Url')}
                    className="text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700">External URL (e.g., YouTube, Google Drive)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={contentType === 'File'}
                    onChange={() => setContentType('File')}
                    className="text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700">Upload File directly</span>
                </label>
              </div>

              {contentType === 'Url' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {type === 'Video' ? t('videoUrl') : t('documentUrl')}
                  </label>
                  <input
                    type="url"
                    required={contentType === 'Url'}
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    placeholder="https://"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-slate-500 mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Google Drive link? We&#39;ll automatically lock it down to preview-only for security.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {type === 'Video' ? 'Upload Video File (.mp4, .webm)' : 'Upload Document File (PDF, Word, Excel, PPT)'}
                  </label>
                  
                  {contentUrl && fileName ? (
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center space-x-3 overflow-hidden pr-4">
                        <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-600">
                          {type === 'Video' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-slate-900 truncate">{fileName}</p>
                          <p className="text-xs text-slate-500">{fileSize ? (fileSize / 1024 / 1024).toFixed(2) : 0} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setContentUrl('');
                          setFileName('');
                          setFileSize(undefined);
                          setMimeType('');
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold whitespace-nowrap bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 hover:bg-slate-50 transition-colors text-center group">
                      <input
                        type="file"
                        accept={type === 'Video' ? 'video/mp4,video/webm' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'}
                        required={contentType === 'File' && !contentUrl}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          if (file.size > 25 * 1024 * 1024) {
                            alert('File too large. Maximum size is 25MB.');
                            e.target.value = '';
                            return;
                          }
                          
                          setIsUploading(true);
                          setUploadProgress(15);
                          
                          const formData = new FormData();
                          formData.append('file', file);
                          
                          try {
                            setUploadProgress(45);
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              body: formData,
                            });
                            
                            const data = await res.json();
                            if (res.ok) {
                              setContentUrl(data.url);
                              setFileName(file.name);
                              setFileSize(file.size);
                              setMimeType(file.type);
                              setUploadProgress(100);
                            } else {
                              alert(data.error || 'Upload failed');
                              e.target.value = '';
                            }
                          } catch (err) {
                            alert('Upload failed. Please try again.');
                            e.target.value = '';
                          } finally {
                            setTimeout(() => {
                              setIsUploading(false);
                              setUploadProgress(0);
                            }, 500);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-full max-w-xs bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-slate-600 animate-pulse">Uploading securely...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-2 text-slate-500 group-hover:text-primary-600 transition-colors">
                          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          <p className="text-sm font-medium">Click or drag file to upload</p>
                          <p className="text-xs opacity-75">Max file size: 25MB</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">{t('passingScore')}</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full md:w-1/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-slate-500">{t('passingScoreHint')}</p>
              </div>

              {questions.map((q, qIndex) => (
                <div key={q.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">{t('question')} {qIndex + 1}</label>
                      <input
                        type="text"
                        required
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div className="space-y-2 pl-4 border-l-2 border-primary-100">
                      <label className="block text-sm font-medium text-slate-700">{t('optionsAndScores')}</label>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            required
                            value={opt.text}
                            onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                            placeholder={`${t('option')} ${oIndex + 1}`}
                            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <input
                            type="number"
                            required
                            value={opt.score}
                            onChange={(e) => updateOption(qIndex, oIndex, 'score', Number(e.target.value))}
                            placeholder={t('score')}
                            className="w-24 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            title={t('score')}
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="text-slate-400 hover:text-red-500 px-2"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="text-sm text-primary-600 hover:text-primary-800 font-medium mt-2"
                      >
                        + {t('addOption')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addQuestion}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-500 hover:text-primary-600 font-medium transition-colors"
              >
                + {t('addQuestion')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={targetDepartments.length === 0 || (type === 'Quiz' && questions.length === 0)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {initialData ? t('updateModule') : t('createModule')}
        </button>
      </div>
    </form>
  );
}
