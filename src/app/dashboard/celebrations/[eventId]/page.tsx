"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { CelebrationPhoto, EventComment } from '@/types';

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
  const eventPhotos = eventId ? celebrationPhotos.filter(p => {
    if (!eventId.includes('-')) {
      // For synthetic birthday events (e.g., carloslara2026), match by type and date 
      // since they don't have a real DB event_id. Real UUIDs contain hyphens.
      return p.eventType === 'Birthday' && p.eventDate === event?.date;
    }
    return p.eventId === eventId;
  }) : [];

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<Partial<CelebrationPhoto>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Comments State
  const [comments, setComments] = useState<EventComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  const EMOJIS = ['👍', '❤️', '😂', '🎉', '👏'];

  // Fetch comments when eventId is available
  useEffect(() => {
    if (eventId) {
      const fetchComments = async () => {
        try {
          const res = await fetch(`/api/events/${eventId}/comments`);
          if (res.ok) {
            const data = await res.json();
            setComments(data);
          }
        } catch (error) {
          console.error('Failed to fetch comments:', error);
        }
      };
      fetchComments();
    }
  }, [eventId]);

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setCommentImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !eventId) return;

    setIsSubmittingComment(true);
    try {
      let imageUrl = null;

      // Upload image if selected
      if (commentImageFile) {
        const formData = new FormData();
        formData.append('file', commentImageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          imageUrl = url;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content: newComment.trim(), imageUrl })
      });

      if (res.ok) {
        const postedComment = await res.json();
        setComments(prev => [...prev, postedComment]);
        setNewComment('');
        setCommentImageFile(null);
        setCommentImagePreview(null);
        if (commentFileInputRef.current) {
          commentFileInputRef.current.value = '';
        }
      } else {
        alert('Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('An error occurred while posting the comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleReaction = async (commentId: string, emoji: string) => {
    if (!user) return;

    // Optimistic UI update
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const existingReactionIndex = comment.reactions.findIndex(r => r.emoji === emoji);
        let newReactions = [...comment.reactions];

        if (existingReactionIndex >= 0) {
          const reaction = newReactions[existingReactionIndex];
          if (reaction.userIds.includes(user.id)) {
            // Remove user
            reaction.userIds = reaction.userIds.filter(id => id !== user.id);
            if (reaction.userIds.length === 0) {
              newReactions.splice(existingReactionIndex, 1);
            }
          } else {
            // Add user
            reaction.userIds.push(user.id);
          }
        } else {
          // Add new reaction
          newReactions.push({ emoji, userIds: [user.id] });
        }
        return { ...comment, reactions: newReactions };
      }
      return comment;
    }));

    try {
      await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, emoji })
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      // Ideally, revert optimistic update here on failure
    }
  };

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
      if (file.size > 10 * 1024 * 1024) {
        alert(t('fileTooLarge'));
        return;
      }
      setSelectedFile(file);
      // Show local preview while uploading
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.title || !selectedFile || !user) {
      alert(t('fillRequiredFields'));
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload file to Vercel Blob via /api/upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload failed');
      }
      const { url } = await uploadRes.json();

      // 2. Save the cloud URL to the DB
      await addCelebrationPhoto({
        title: uploadForm.title,
        caption: uploadForm.caption,
        imageUrl: url,
        eventType: event.type,
        eventDate: event.date,
        uploadedBy: user.id,
        eventId: event.id,
      });

      setIsUploadModalOpen(false);
      setUploadForm({});
      setPreviewImage(null);
      setSelectedFile(null);
      alert(t('photoUploaded'));
    } catch (err: any) {
      alert(err.message || t('uploadError'));
    } finally {
      setIsUploading(false);
    }
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
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${event.type === 'Birthday' ? 'bg-pink-100 text-pink-800' :
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
                disabled={!uploadForm.title || !selectedFile || isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : t('uploadPhoto')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Comments</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
          <form onSubmit={handlePostComment} className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  {user?.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full border border-slate-300 rounded-lg shadow-sm p-3 text-sm focus:ring-primary-500 focus:border-primary-500 min-h-[80px]"
                required
              />
              
              {/* Image Preview */}
              {commentImagePreview && (
                <div className="mt-2 relative inline-block">
                  <img src={commentImagePreview} alt="Preview" className="h-24 rounded-md object-cover border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => {
                      setCommentImageFile(null);
                      setCommentImagePreview(null);
                      if (commentFileInputRef.current) commentFileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              <div className="mt-2 flex justify-between items-center">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={commentFileInputRef}
                    onChange={handleCommentImageSelect}
                  />
                  <button
                    type="button"
                    onClick={() => commentFileInputRef.current?.click()}
                    className="text-slate-500 hover:text-primary-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                    title="Attach an image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                <div className="flex-shrink-0">
                  {comment.userAvatarUrl ? (
                    <img src={comment.userAvatarUrl} alt={comment.userName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                      {comment.userName?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="bg-slate-50 rounded-lg p-4 inline-block min-w-[200px] max-w-full">
                    <div className="flex justify-between items-baseline mb-1 space-x-4">
                      <h4 className="font-semibold text-slate-900">{comment.userName}</h4>
                      <span className="text-xs text-slate-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                    
                    {comment.imageUrl && (
                      <div className="mt-3">
                        <img src={comment.imageUrl} alt="Comment attachment" className="max-h-64 rounded-md object-contain border border-slate-200" />
                      </div>
                    )}
                  </div>

                  {/* Reactions Bar */}
                  <div className="mt-2 flex items-center space-x-2 flex-wrap">
                    {/* Display existing reactions */}
                    {comment.reactions?.map((reaction) => {
                      const hasReacted = user && reaction.userIds.includes(user.id);
                      return (
                        <button
                          key={reaction.emoji}
                          onClick={() => handleToggleReaction(comment.id, reaction.emoji)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                            hasReacted 
                              ? 'bg-primary-50 border-primary-200 text-primary-700' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="font-medium">{reaction.userIds.length}</span>
                        </button>
                      );
                    })}

                    {/* Add Reaction Button */}
                    <div className="relative group">
                      <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      
                      {/* Emoji Picker Tooltip */}
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-white border border-slate-200 shadow-lg rounded-full p-1 space-x-1 z-10">
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(comment.id, emoji)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-lg transition-transform hover:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </div>
    </div>
  );
}
