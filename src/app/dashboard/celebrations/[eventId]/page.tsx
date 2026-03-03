"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { CelebrationPhoto } from '@/types';

export default function AlbumDetailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [eventId, setEventId] = useState<string | null>(null);
  
  useEffect(() => {
    params.then(p => setEventId(decodeURIComponent(p.eventId)));
  }, [params]);
  
  const { allEvents, celebrationPhotos, addCelebrationPhoto, deleteCelebrationPhoto, updateEvent } = useData();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const event = eventId ? allEvents.find(a => a.id === eventId) : null;
  const eventPhotos = eventId ? celebrationPhotos.filter(p => p.eventId === eventId) : [];

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<Partial<CelebrationPhoto>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!eventId) {
    return <div className="text-center py-16">Loading...</div>;
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-slate-900">Event not found</h2>
        <p className="text-slate-500 mt-2">Looking for ID: "{eventId}"</p>
        <p className="text-slate-500 text-sm mt-1">Available IDs: {allEvents.map(e => e.id).join(', ')}</p>
        <button onClick={() => router.push('/dashboard/celebrations')} className="mt-4 text-primary-600 hover:underline">
          &larr; Back to Celebrations
        </button>
      </div>
    );
  }

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

    addCelebrationPhoto({
      title: uploadForm.title,
      caption: uploadForm.caption,
      imageUrl: previewImage,
      eventType: event.type, // Inherit from event
      eventDate: event.date, // Inherit from event
      uploadedBy: user.id,
      eventId: event.id,
    });

    setIsUploadModalOpen(false);
    setUploadForm({});
    setPreviewImage(null);
    alert(t('photoUploaded'));
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
        <Link href="/dashboard/celebrations" className="hover:text-primary-600 transition-colors">
          Celebrations
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{event.title}</span>
      </div>

      <header className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
          {event.description && <p className="text-slate-500 mt-2">{event.description}</p>}
          <div className="flex items-center space-x-4 mt-3 text-sm text-slate-500">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              event.type === 'Birthday' ? 'bg-pink-100 text-pink-800' :
              event.type === 'Celebration' ? 'bg-amber-100 text-amber-800' :
              event.type === 'Social' ? 'bg-green-100 text-green-800' :
              event.type === 'Meeting' ? 'bg-blue-100 text-blue-800' :
              'bg-slate-100 text-slate-800'
            }`}>
              {event.type}
            </span>
            <span>{parseDate(event.date).toLocaleDateString()}</span>
          </div>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          + {t('uploadPhoto')}
        </button>
      </header>

      {/* Photo Gallery */}
      {eventPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {eventPhotos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {user?.role === 'HR Admin' && (
                    <button
                      onClick={() => {
                        updateEvent(event.id, { coverImageUrl: photo.imageUrl });
                        alert('Cover photo updated successfully!');
                      }}
                      className="p-1.5 bg-white text-slate-700 rounded-full hover:bg-slate-100 shadow-sm"
                      title="Set as Cover Photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                  {(user?.role === 'HR Admin' || photo.uploadedBy === user?.id) && (
                    <button
                      onClick={() => {
                        if (window.confirm(t('confirmDeletePhoto'))) {
                          deleteCelebrationPhoto(photo.id);
                        }
                      }}
                      className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm"
                      title={t('deletePhoto')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1">{photo.title}</h3>
                {photo.caption && (
                  <p className="text-sm text-slate-600">{photo.caption}</p>
                )}
              </div>
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
          <p className="text-slate-500">No photos for this event yet.</p>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add Photo to Event</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('photoTitle')} *</label>
                <input
                  type="text"
                  value={uploadForm.title || ''}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Cutting the cake"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('caption')}</label>
                <textarea
                  rows={2}
                  value={uploadForm.caption || ''}
                  onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add a description..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('uploadPhoto')} *</label>
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
                  setUploadForm({});
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
                {t('uploadPhoto')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
