"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { User, StaffCustomFieldDefinition } from '@/types';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { users, updateUser } = useData();
  const { t, language, setLanguage } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [staffCustomFields, setStaffCustomFields] = useState<StaffCustomFieldDefinition[]>([]);
  const [hasChildrenToggle, setHasChildrenToggle] = useState(false);

  const currentUser = users.find(u => u.id === authUser?.id);

  useEffect(() => {
    if (currentUser) {
      setFormData(currentUser);
      setHasChildrenToggle(!!currentUser.childrenCount && currentUser.childrenCount > 0);
    }
  }, [currentUser]);

  useEffect(() => {
    const loadStaffFields = async () => {
      try {
        const res = await fetch('/api/staff-fields');
        if (!res.ok) return;
        const data = await res.json();
        setStaffCustomFields(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load staff custom fields', e);
      }
    };
    loadStaffFields();
  }, []);

  const profileFieldConfigMap = new Map(
    staffCustomFields.map((f) => [f.field_key, f] as const)
  );

  const isFieldVisibleInProfile = (fieldKey: string, fallback = true) => {
    const cfg = profileFieldConfigMap.get(fieldKey);
    if (!cfg) return fallback;
    return cfg.show_in_profile ?? fallback;
  };

  const isFieldEditableInProfile = (fieldKey: string, fallback = true) => {
    const cfg = profileFieldConfigMap.get(fieldKey);
    if (!cfg) return fallback;
    return cfg.employee_editable ?? fallback;
  };

  const hardcodedProfileFieldKeys = new Set<string>([
    'name',
    'email',
    'birthday',
    'emergencyContactName',
    'emergencyContactPhone',
    'taxId',
    'phone',
    'address',
    'accountType',
    'maritalStatus',
    'spouseName',
    'childrenCount',
    'motherName',
    'fatherName',
    'hotelContract',
    'baseSalary',
    'incentiveBonus',
    'renewalDate',
    'dpi',
    'socialSecurityNumber',
    'spouseDpi',
    'cardNumber',
    'socialSecurityCode',
    'occupation',
    'criminalRecord',
    'policeRecord',
    'nationality',
    'placeOfBirth',
  ]);

  const groupedProfileCustomFields = staffCustomFields
    .filter((f) => (f.show_in_profile ?? true))
    .filter((f) => !hardcodedProfileFieldKeys.has(f.field_key))
    .sort((a, b) => {
      const g = (a.group_key || 'custom').localeCompare(b.group_key || 'custom');
      if (g !== 0) return g;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .reduce<Record<string, StaffCustomFieldDefinition[]>>((acc, field) => {
      const key = field.group_key || 'custom';
      if (!acc[key]) acc[key] = [];
      acc[key].push(field);
      return acc;
    }, {});

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
      const finalData = { ...formData };
      if (!hasChildrenToggle) {
        finalData.childrenCount = 0;
        finalData.childrenNames = '';
      }
      await updateUser(currentUser.id, finalData);
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
              <p className="text-slate-500">{currentUser.department}</p>
              
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
            {/* Space 1: Personal Information */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800">{t('personalInformation')}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {isFieldVisibleInProfile('name', true) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('name')}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name || ''}
                        disabled={!isFieldEditableInProfile('name', false)}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
                    )}
                  </div>
                )}

                {isFieldVisibleInProfile('email', true) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('email')}</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email || ''}
                        disabled={!isFieldEditableInProfile('email', false)}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{currentUser.email}</p>
                    )}
                  </div>
                )}

                {isFieldVisibleInProfile('birthday', true) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('birthday')}</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.birthday || ''}
                        disabled={!isFieldEditableInProfile('birthday', true)}
                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{parseDate(currentUser.birthday).toLocaleDateString()}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('phone')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(formData as any).phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value } as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{(currentUser as any).phone || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('address')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(formData as any).address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value } as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{(currentUser as any).address || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('nationality')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(formData as any).nationality || ''}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value } as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{(currentUser as any).nationality || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('placeOfBirth')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(formData as any).placeOfBirth || ''}
                      onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value } as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{(currentUser as any).placeOfBirth || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('fatherName')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(formData as any).fatherName || ''}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value } as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{(currentUser as any).fatherName || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('motherName')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(formData as any).motherName || ''}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value } as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{(currentUser as any).motherName || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Space 2: Contactos */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800">{t('contactos')}</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('maritalStatus')}</label>
                  {isEditing ? (
                    <select
                      value={formData.maritalStatus || 'Single'}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="Single">{language === 'es' ? 'Soltero/a' : 'Single'}</option>
                      <option value="Married">{language === 'es' ? 'Casado/a' : 'Married'}</option>
                      <option value="Divorced">{language === 'es' ? 'Divorciado/a' : 'Divorced'}</option>
                      <option value="Widowed">{language === 'es' ? 'Viudo/a' : 'Widowed'}</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-slate-900">
                      {language === 'es' ?
                        (currentUser.maritalStatus === 'Married' ? 'Casado/a' :
                         currentUser.maritalStatus === 'Divorced' ? 'Divorciado/a' :
                         currentUser.maritalStatus === 'Widowed' ? 'Viudo/a' : 'Soltero/a')
                        : (currentUser.maritalStatus || 'Single')}
                    </p>
                  )}
                </div>

                {formData.maritalStatus === 'Married' && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('spouseName')}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.spouseName || ''}
                        onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{currentUser.spouseName || '-'}</p>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('doYouHaveChildren')}</label>
                    {isEditing ? (
                      <div className="flex bg-slate-200 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setHasChildrenToggle(true)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${hasChildrenToggle ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          {t('yes')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHasChildrenToggle(false)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!hasChildrenToggle ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          {t('no')}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-primary-600">{hasChildrenToggle ? t('yes') : t('no')}</p>
                    )}
                  </div>

                  {hasChildrenToggle && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('howManyChildren')}</label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={formData.childrenCount || ''}
                            onChange={(e) => setFormData({ ...formData, childrenCount: Number(e.target.value) })}
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (
                          <p className="text-sm font-medium text-slate-900">{currentUser.childrenCount || 0}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('childrenNamesLabel')}</label>
                        {isEditing ? (
                          <textarea
                            value={formData.childrenNames || ''}
                            onChange={(e) => setFormData({ ...formData, childrenNames: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500 min-h-[80px]"
                            placeholder={language === 'es' ? 'Nombres y edades...' : 'Names and ages...'}
                          />
                        ) : (
                          <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap">{currentUser.childrenNames || '-'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 mt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {language === 'es' ? 'Emergencia' : 'Emergency'}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('emergencyContactNameLabel')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.emergencyContactName || ''}
                          onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-900">{currentUser.emergencyContactName || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('emergencyContactPhoneLabel')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.emergencyContactPhone || ''}
                          onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-900">{currentUser.emergencyContactPhone || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('emergencyContactRelationshipLabel')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.emergencyContactRelationship || ''}
                          onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-900">{currentUser.emergencyContactRelationship || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Space 3: Documentos (Data/Info) */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800">{t('documentos')}</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('dpiNumber')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(formData as any).dpi || ''}
                      onChange={(e) => setFormData({ ...formData, dpi: e.target.value } as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{(currentUser as any).dpi || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('nitTaxId')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.taxId || ''}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{currentUser.taxId || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('igssNumber')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(formData as any).socialSecurityNumber || ''}
                      onChange={(e) => setFormData({ ...formData, socialSecurityNumber: e.target.value } as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{(currentUser as any).socialSecurityNumber || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('cardNumberLabel')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={(formData as any).cardNumber || ''}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value } as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{(currentUser as any).cardNumber || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('renewalDateLabel')}</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={(formData as any).renewalDate || ''}
                      onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value } as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{(currentUser as any).renewalDate || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Space 4: Preferencias */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800">{t('preferencias')}</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('tShirtSize')}</label>
                  {isEditing ? (
                    <select
                      value={formData.tShirtSize || ''}
                      onChange={(e) => setFormData({ ...formData, tShirtSize: e.target.value as any })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
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
                    <p className="text-sm font-medium text-slate-900">{currentUser.tShirtSize || t('notSpecified')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('language')}</label>
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`flex-1 py-1 px-4 rounded-lg text-xs font-bold transition-all ${
                          language === 'en'
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('es')}
                        className={`flex-1 py-1 px-4 rounded-lg text-xs font-bold transition-all ${
                          language === 'es'
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Español
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{language === 'en' ? 'English' : 'Español'}</p>
                  )}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('likes')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getArrayInputValue('likes')}
                      onChange={(e) => handleArrayInput('likes', e.target.value)}
                      placeholder={t('likesPlaceholder')}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentUser.likes && currentUser.likes.length > 0 ? (
                        currentUser.likes.map((like, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 shadow-sm">
                            {like}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-sm">{t('noneSpecified')}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('dislikes')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getArrayInputValue('dislikes')}
                      onChange={(e) => handleArrayInput('dislikes', e.target.value)}
                      placeholder={t('dislikesPlaceholder')}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentUser.dislikes && currentUser.dislikes.length > 0 ? (
                        currentUser.dislikes.map((dislike, i) => (
                          <span key={i} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold border border-rose-200 shadow-sm">
                            {dislike}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-sm">{t('noneSpecified')}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('allergies')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getArrayInputValue('allergies')}
                      onChange={(e) => handleArrayInput('allergies', e.target.value)}
                      placeholder={t('allergiesPlaceholder')}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentUser.allergies && currentUser.allergies.length > 0 ? (
                        currentUser.allergies.map((allergy, i) => (
                          <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200 shadow-sm">
                            {allergy}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-sm">{t('noneSpecified')}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Space 5: Empty */}
            <div className="hidden md:block"></div>
            
            {/* Space 6: Empty */}
            <div className="hidden md:block"></div>
          </div>

          {/* Bottom Section: Documentos para subir */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className="text-xl font-bold text-slate-900">{t('documentosSubir')}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: t('profilePicture'), field: 'avatarUrl', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                { label: t('dpiImage'), field: 'dpiUrl', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2' },
                { label: t('healthCard'), field: 'healthCardUrl', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                { label: t('foodHandlingCard'), field: 'foodHandlingCardUrl', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { label: t('criminalRecordDoc'), field: 'criminalRecordUrl', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                { label: t('policeRecordDoc'), field: 'policeRecordUrl', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              ].map((doc) => (
                <div key={doc.field} className="relative group">
                  <div className={`p-4 rounded-xl border-2 border-dashed transition-all ${
                    (formData as any)[doc.field] 
                      ? 'border-primary-200 bg-primary-50' 
                      : 'border-slate-200 bg-slate-50 hover:border-primary-300 hover:bg-slate-100'
                  }`}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        (formData as any)[doc.field] ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={doc.icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{doc.label}</p>
                        {(formData as any)[doc.field] ? (
                          <div className="flex items-center justify-center space-x-2 mt-1">
                            <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{language === 'es' ? 'Subido' : 'Uploaded'}</span>
                            <a 
                              href={(formData as any)[doc.field] as string} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1">{language === 'es' ? 'No hay archivo' : 'No file available'}</p>
                        )}
                      </div>
                      
                      {isEditing && (
                        <button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = doc.field === 'avatarUrl' ? 'image/*' : 'image/*,application/pdf';
                            input.onchange = (e: any) => handleDocumentUpload(e, doc.field as keyof User);
                            input.click();
                          }}
                          disabled={uploadingDoc === doc.field}
                          className="w-full py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center space-x-2"
                        >
                          {uploadingDoc === doc.field ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>{t('uploading')}...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              <span>{language === 'es' ? 'Subir Archivo' : 'Upload File'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
