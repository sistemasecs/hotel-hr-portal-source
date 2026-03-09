"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Event } from '@/types';

export default function CelebrationsPage() {
  const { allEvents, addEvent, deleteEvent, eventTypes } = useData();
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filter, setFilter] = useState<string>('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<Partial<Event>>({
    type: 'Celebration',
    date: new Date().toISOString().split('T')[0],
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filteredEvents = filter === 'All'
    ? allEvents
    : allEvents.filter(e => e.type === filter);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (!uploadForm.title || !previewImage || !user) {
      alert(t('fillRequiredFields'));
      return;
    }

    addEvent({
      title: uploadForm.title,
      description: uploadForm.description || '',
      coverImageUrl: previewImage,
      type: uploadForm.type || 'Celebration',
      date: uploadForm.date || new Date().toISOString().split('T')[0],
    });

    setIsUploadModalOpen(false);
    setUploadForm({
      type: 'Celebration',
      date: new Date().toISOString().split('T')[0],
    });
    setPreviewImage(null);
    alert(t('eventCreatedSuccessfully'));
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('celebrations')}</h1>
          <p className="text-slate-500 mt-2">{t('shareMoments')}</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors w-full sm:w-auto"
        >
          + {t('createEvent')}
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['All', ...eventTypes.map(t => t.name)].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === type
                ? 'bg-primary-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
          >
            {type === 'All' ? t('allEventsFilter') :
              type === 'Birthday' ? t('birthdayEvent') :
                type === 'Celebration' ? t('celebrationEvent') :
                  type === 'Social' ? t('socialEvent') :
                    type === 'Meeting' ? t('meetingEvent') :
                      type === 'Other' ? t('otherEvent') :
                        type}
          </button>
        ))}
      </div>

      {/* Event Gallery */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group relative">
              <Link href={`/dashboard/celebrations/${event.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 flex items-center justify-center">
                  {event.coverImageUrl ? (
                    <img
                      src={event.coverImageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${event.type === 'Birthday' ? 'bg-pink-100 text-pink-800' :
                        event.type === 'Celebration' ? 'bg-amber-100 text-amber-800' :
                          event.type === 'Social' ? 'bg-green-100 text-green-800' :
                            event.type === 'Meeting' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-800'
                      }`}>
                      {event.type === 'Birthday' ? t('birthdayEvent') :
                        event.type === 'Celebration' ? t('celebrationEvent') :
                          event.type === 'Social' ? t('socialEvent') :
                            event.type === 'Meeting' ? t('meetingEvent') :
                              event.type === 'Other' ? t('otherEvent') :
                                event.type}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-slate-600 mb-2 line-clamp-2">{event.description}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    {parseDate(event.date).toLocaleDateString()}
                  </p>
                </div>
              </Link>
              {user?.role === 'HR Admin' && !event.id.startsWith('bday-') && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.confirm(t('areYouSureDeleteEvent'))) {
                      deleteEvent(event.id);
                    }
                  }}
                  className="absolute top-2 left-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                  title={t('deleteEvent')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-500">{t('noEventsYet')}</p>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Event</h2>

            <div className="space-y-4">
              {/* Image Preview / Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={uploadForm.title || ''}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Birthday Party 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={uploadForm.description || ''}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add a description..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Event Type *</label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="" disabled>Select Type</option>
                    {eventTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Event Date *</label>
                  <input
                    type="date"
                    value={uploadForm.date}
                    onChange={(e) => setUploadForm({ ...uploadForm, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('coverPhoto')} *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-slate-500 mt-1">Max file size: 5MB</p>
              </div>

              {/* Preview */}
              {previewImage && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadForm({
                    type: 'Celebration',
                    date: new Date().toISOString().split('T')[0],
                  });
                  setPreviewImage(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadForm.title || !previewImage}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {t('createEvent')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
