"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { User } from '@/types';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { users, updateUser } = useData();
  const { t, language, setLanguage } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const currentUser = users.find(u => u.id === authUser?.id);

  useEffect(() => {
    if (currentUser) {
      setFormData(currentUser);
    }
  }, [currentUser]);

  if (!currentUser) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof User) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert(t('invalidFileType') || 'Please upload an image or PDF.');
      return;
    }

    setUploadingDoc(field as string);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setFormData({ ...formData, [field]: data.url });
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleArrayInput = (field: keyof User, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setFormData({ ...formData, [field]: arrayValue });
  };

  const getArrayInputValue = (field: keyof User) => {
    const value = formData[field];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return '';
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser(currentUser.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t('invalidFileType'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(t('fileTooLarge'));
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('myProfile')}</h1>
          <p className="text-slate-500 mt-2">{t('manageProfile')}</p>
        </div>
        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
            >
              {t('editProfile')}
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(currentUser);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                disabled={isSaving}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isSaving ? t('saving') : t('saveChanges')}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-slate-100">
            <div className="relative group">
              {formData.avatarUrl || currentUser.avatarUrl ? (
                <img 
                  src={formData.avatarUrl || currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className={`w-24 h-24 rounded-full border-4 border-white shadow-sm ${
                    (formData.avatarFit || currentUser.avatarFit) === 'contain' ? 'object-contain bg-slate-100' : 'object-cover'
                  }`}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Change Profile Picture"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{currentUser.name}</h2>
              <p className="text-slate-500">{currentUser.role} • {currentUser.department}</p>
              
              {isEditing && (formData.avatarUrl || currentUser.avatarUrl) && (
                <div className="mt-3 flex items-center space-x-3">
                  <span className="text-xs font-medium text-slate-500">Picture Fit:</span>
                  <button
                    onClick={() => setFormData({ ...formData, avatarFit: 'cover' })}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      (formData.avatarFit || currentUser.avatarFit || 'cover') === 'cover'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Fill Circle
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, avatarFit: 'contain' })}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      (formData.avatarFit || currentUser.avatarFit) === 'contain'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Fit Inside
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">{t('basicInfo')}</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('name')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-slate-900">{currentUser.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-slate-900">{currentUser.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('birthday')}</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.birthday || ''}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-slate-900">{parseDate(currentUser.birthday).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">{t('preferencesDetails')}</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tShirtSize')}</label>
                {isEditing ? (
                  <select
                    value={formData.tShirtSize || ''}
                    onChange={(e) => setFormData({ ...formData, tShirtSize: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">{t('selectSize')}</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                ) : (
                  <p className="text-slate-900">{currentUser.tShirtSize || t('notSpecified')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('language')}</label>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        language === 'en'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('es')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        language === 'es'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Español
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-900">{language === 'en' ? 'English' : 'Español'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('likes')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={getArrayInputValue('likes')}
                    onChange={(e) => handleArrayInput('likes', e.target.value)}
                    placeholder={t('likesPlaceholder')}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentUser.likes && currentUser.likes.length > 0 ? (
                      currentUser.likes.map((like, i) => (
                        <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-100">
                          {like}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">{t('noneSpecified')}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dislikes')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={getArrayInputValue('dislikes')}
                    onChange={(e) => handleArrayInput('dislikes', e.target.value)}
                    placeholder={t('dislikesPlaceholder')}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentUser.dislikes && currentUser.dislikes.length > 0 ? (
                      currentUser.dislikes.map((dislike, i) => (
                        <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium border border-red-100">
                          {dislike}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">{t('noneSpecified')}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('allergies')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={getArrayInputValue('allergies')}
                    onChange={(e) => handleArrayInput('allergies', e.target.value)}
                    placeholder={t('allergiesPlaceholder')}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentUser.allergies && currentUser.allergies.length > 0 ? (
                      currentUser.allergies.map((allergy, i) => (
                        <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium border border-amber-100">
                          {allergy}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">{t('noneSpecified')}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact & Legal Info */}
          <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">{language === 'es' ? 'Contacto de Emergencia' : 'Emergency Contact'}</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Nombre de Contacto' : 'Contact Name'}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-slate-900">{currentUser.emergencyContactName || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Teléfono de Emergencia' : 'Emergency Phone'}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.emergencyContactPhone || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-slate-900">{currentUser.emergencyContactPhone || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'NIT / Tax ID' : 'Tax ID (NIT)'}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.taxId || ''}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-slate-900">{currentUser.taxId || '-'}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">{language === 'es' ? 'Estado Civil y Dependientes' : 'Marital Status & Dependents'}</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Estado Civil' : 'Marital Status'}</label>
                {isEditing ? (
                  <select
                    value={formData.maritalStatus || 'Single'}
                    onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Single">{language === 'es' ? 'Soltero/a' : 'Single'}</option>
                    <option value="Married">{language === 'es' ? 'Casado/a' : 'Married'}</option>
                    <option value="Divorced">{language === 'es' ? 'Divorciado/a' : 'Divorced'}</option>
                    <option value="Widowed">{language === 'es' ? 'Viudo/a' : 'Widowed'}</option>
                  </select>
                ) : (
                  <p className="text-slate-900">
                    {language === 'es' ? 
                      (currentUser.maritalStatus === 'Married' ? 'Casado/a' : 
                       currentUser.maritalStatus === 'Divorced' ? 'Divorciado/a' : 
                       currentUser.maritalStatus === 'Widowed' ? 'Viudo/a' : 'Soltero/a') 
                      : (currentUser.maritalStatus || 'Single')}
                  </p>
                )}
              </div>

              {(formData.maritalStatus === 'Married' || (!isEditing && currentUser.maritalStatus === 'Married')) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Nombre del Cónyuge' : 'Spouse Name'}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.spouseName || ''}
                      onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                      className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-slate-900">{currentUser.spouseName || '-'}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'es' ? 'Número de Hijos' : 'Number of Children'}</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={formData.childrenCount ?? ''}
                    onChange={(e) => setFormData({ ...formData, childrenCount: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-slate-900">{currentUser.childrenCount || '0'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-6">{language === 'es' ? 'Documentos Mandatorios' : 'Mandatory Documents'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'healthCardUrl', label: language === 'es' ? 'Tarjeta de Salud' : 'Health Card' },
                { key: 'criminalRecordUrl', label: language === 'es' ? 'Antecedentes Penales' : 'Criminal Records' },
                { key: 'policeRecordUrl', label: language === 'es' ? 'Antecedentes Policiacos' : 'Police Records' },
                ...(currentUser.department.toLowerCase().includes('alimentos') || currentUser.department.toLowerCase().includes('bebidas') || currentUser.department.toLowerCase().includes('food') 
                    ? [{ key: 'foodHandlingCardUrl', label: language === 'es' ? 'Manipulación de Alimentos' : 'Food Handling Card' }] : [])
              ].map((doc) => (
                <div key={doc.key} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <p className="text-sm font-medium text-slate-800 mb-3">{doc.label}</p>
                  {isEditing ? (
                    <div className="flex flex-col space-y-2">
                       {formData[doc.key as keyof User] && (
                        <a href={formData[doc.key as keyof User] as string} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          View Current File
                        </a>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleDocumentUpload(e, doc.key as keyof User)}
                        className="text-xs"
                      />
                      {uploadingDoc === doc.key && <span className="text-xs text-amber-500">Uploading...</span>}
                    </div>
                  ) : (
                    currentUser[doc.key as keyof User] ? (
                      <a href={currentUser[doc.key as keyof User] as string} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        View File
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Not uploaded</span>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
