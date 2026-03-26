"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/types';

export default function BroadcastsWallPage() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [broadcasts, setBroadcasts] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchBroadcasts = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}&type=BROADCAST`);
        if (res.ok) {
          const data = await res.json();
          setBroadcasts(data);
          
          // Optionally mark them as read immediately when visiting the wall
          const unreadIds = data.filter((n: Notification) => !n.is_read).map((n: Notification) => n.id);
          if (unreadIds.length > 0) {
             await fetch('/api/notifications', {
               method: 'PATCH',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ userId: user.id, markAllAsRead: true })
             });
          }
        }
      } catch (error) {
        console.error('Failed to fetch broadcasts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBroadcasts();
  }, [user?.id]);

  const handleDeleteBroadcast = async (broadcast: Notification) => {
    if (!window.confirm('Are you sure you want to delete this broadcast? This will remove it for ALL users.')) {
      return;
    }

    setIsDeleting(broadcast.id);
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcast: true,
          title: broadcast.title,
          message: broadcast.message
        })
      });

      if (res.ok) {
        setBroadcasts(prev => prev.filter(b => b.title !== broadcast.title || b.message !== broadcast.message));
      } else {
        alert('Failed to delete broadcast');
      }
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      alert('An error occurred');
    } finally {
      setIsDeleting(null);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center">
          <svg className="w-8 h-8 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          {t('announcements') || 'Announcements'}
        </h1>
        <p className="text-slate-500 mt-2">Important updates and broadcast messages from the Admin</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin"></div>
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-bold text-slate-900">No Announcements Yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2">When Admins send out a general broadcast, it will appear here on your wall.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {broadcasts.map((broadcast) => (
            <div key={broadcast.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {broadcast.title}
                  </h2>
                  <div className="flex items-center space-x-3 ml-4">
                    <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {formatDistanceToNow(new Date(broadcast.created_at), { addSuffix: true })}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteBroadcast(broadcast)}
                        disabled={isDeleting === broadcast.id}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors disabled:opacity-50"
                        title="Delete broadcast for all users"
                      >
                        {isDeleting === broadcast.id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">
                  {broadcast.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
