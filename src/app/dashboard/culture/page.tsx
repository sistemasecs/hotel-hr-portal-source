"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import CommentsSection from '@/components/CommentsSection';
import { formatTimeWithoutSeconds } from '@/lib/dateUtils';

export default function CultureHubPage() {
  const { allEvents, users, addPeerVote, peerVotes, employeesOfTheMonth } = useData();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'All' | 'Birthday' | 'Celebration' | 'Meeting'>('All');
  const [viewType, setViewType] = useState<'List' | 'Month'>('List');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Peer Voting State
  const [selectedNominee, setSelectedNominee] = useState<string>('');
  const [voteReason, setVoteReason] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];
  
  const filteredEvents = (filter === 'All' ? allEvents : allEvents.filter(e => e.type === filter))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Find the first index of an event that is today or in the future
  const firstFutureIndex = filteredEvents.findIndex(e => e.date >= todayStr);
  
  // Reorder so future events come first, then past events (or just slice)
  // The user said "start with current date", so we'll show future events first.
  const displayEvents = firstFutureIndex === -1 
    ? filteredEvents // All are in the past
    : filteredEvents.slice(firstFutureIndex); // Start from today onwards

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  };

  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const hasVotedThisMonth = user ? peerVotes.some(v => v.voterId === user.id && v.month === currentMonthStr) : false;

  const handleVote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedNominee) return;

    addPeerVote({
      voterId: user.id,
      nomineeId: selectedNominee,
      month: currentMonthStr,
      reason: voteReason
    });
    
    setSelectedNominee('');
    setVoteReason('');
    alert(t('thankYouNomination'));
  };

  // Get current Employee of the Month (active users only)
  const currentEotmRecord = employeesOfTheMonth.find(e => e.month === currentMonthStr);
  const currentEotmUser = currentEotmRecord
    ? users.find(u => u.id === currentEotmRecord.userId && u.isActive !== false)
    : null;

  return (
    <div className="space-y-8 culture-page">
      <header className="flex flex-col md:flex-row md:justify-between items-start md:items-end border-b border-slate-200 pb-6 culture-page-header no-print space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('cultureHub')}</h1>
          <p className="text-slate-500 mt-2">{t('cultureHubDesc')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewType === 'Month' && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t('printCalendar')}
            </button>
          )}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewType('List')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewType === 'List' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('listView')}
            </button>
            <button
              onClick={() => setViewType('Month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewType === 'Month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('monthView')}
            </button>
          </div>
          {['All', 'Birthday', 'Celebration', 'Meeting'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f === 'All' ? t('allEvents') : 
               f === 'Birthday' ? t('birthdayEvent') : 
               f === 'Celebration' ? t('celebrationEvent') : 
               t('meetingEvent')}
            </button>
          ))}
        </div>
      </header>

      {/* Top Row: EDM (Left) and Nominate (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 no-print">
        {/* EDM Section - Left */}
        <div>
          {currentEotmUser ? (
            <div className="bg-slate-900 text-white p-4 rounded-lg shadow-lg h-full">
              <h3 className="text-sm font-bold mb-3">{t('eotmTitle')}</h3>
              <div className="flex items-center space-x-3">
                {currentEotmUser.avatarUrl ? (
                  <img 
                    src={currentEotmUser.avatarUrl} 
                    alt={currentEotmUser.name} 
                    className={`w-12 h-12 rounded-full ${currentEotmUser.avatarFit === 'contain' ? 'object-contain bg-slate-100' : 'object-cover'}`}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold">
                    {currentEotmUser.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{currentEotmUser.name}</p>
                  <p className="text-primary-300 text-xs">{currentEotmUser.department}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                {t('eotmDesc')}
              </p>
              
              <div className="mt-3 pt-3 border-t border-slate-800">
                <CommentsSection 
                  referenceId={`EDM-${currentMonthStr}`} 
                  title="¡Felicita!"
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 text-white p-4 rounded-lg shadow-lg h-full flex flex-col justify-center">
              <h3 className="text-sm font-bold mb-2">{t('eotmTitle')}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('eotmNotAnnounced').replace('{month}', new Date().toLocaleString('default', { month: 'long' }))}
              </p>
            </div>
          )}
        </div>

        {/* Peer Voting Section - Right */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 h-full">
          <h3 className="text-sm font-bold text-slate-900 mb-2">{t('nominatePeer')}</h3>
          <p className="text-xs text-slate-500 mb-3">
            {t('nominateDesc')}
          </p>
          
          {hasVotedThisMonth ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xs font-medium text-emerald-800">{t('alreadyVoted')}</p>
            </div>
          ) : (
            <form onSubmit={handleVote} className="space-y-2">
              <div>
                <select
                  required
                  value={selectedNominee}
                  onChange={(e) => setSelectedNominee(e.target.value)}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-1.5 text-xs focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="" disabled>{t('chooseSomeone')}</option>
                  {users.filter(u => u.id !== user?.id && u.isActive !== false).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <textarea
                  rows={2}
                  value={voteReason}
                  onChange={(e) => setVoteReason(e.target.value)}
                  placeholder={t('reasonPlaceholder')}
                  className="w-full border border-slate-300 rounded-md shadow-sm p-1.5 text-xs focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                type="submit"
                disabled={!selectedNominee}
                className="w-full py-1.5 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('submitNomination')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Activities Section - Full Width Below */}
      <div className="space-y-6 print-only-calendar">
        {viewType === 'List' ? (
            displayEvents.map(event => (
              <div key={event.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:space-x-6 space-y-4 sm:space-y-0">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-50 text-primary-600 rounded-xl flex flex-col items-center justify-center border border-primary-100">
                  <span className="text-sm font-bold uppercase tracking-wider">{parseDate(event.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-2xl font-black leading-none mt-1">{parseDate(event.date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      event.type === 'Birthday' ? 'bg-pink-100 text-pink-800' :
                      event.type === 'Celebration' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.type === 'Birthday' ? t('birthdayEvent') : 
                       event.type === 'Celebration' ? t('celebrationEvent') : 
                       t('meetingEvent')}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-2">{event.description}</p>
                  <div className="flex items-center space-x-4 mt-4">
                    {'time' in event && event.time && (
                      <p className="text-sm text-slate-500 font-medium">
                        🕒 {formatTimeWithoutSeconds(event.time)}
                      </p>
                    )}
                    {'location' in event && event.location && (
                      <p className="text-sm text-slate-500 font-medium">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link 
                      href={`/dashboard/celebrations/${event.id}`}
                      className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t('viewPhotos')}
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-full transition-colors no-print">
                  ←
                </button>
                <h2 className="text-lg font-bold text-slate-800">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-full transition-colors no-print">
                  →
                </button>
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-slate-50 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
                {blanks.map(blank => (
                  <div key={`blank-${blank}`} className="bg-white min-h-[100px] p-2"></div>
                ))}
                {days.map(day => {
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = filteredEvents.filter(e => e.date === dateStr);
                  
                  return (
                    <div key={day} className="bg-white min-h-[100px] p-2 border-t border-slate-100">
                      <span className="text-sm font-medium text-slate-700">{day}</span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.map(e => (
                          <div 
                            key={e.id} 
                            className={`text-[10px] p-1.5 rounded leading-tight flex flex-col ${
                              e.type === 'Birthday' ? 'bg-pink-50 text-pink-700 border border-pink-100' :
                              e.type === 'Celebration' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}
                            title={`${'time' in e && e.time ? formatTimeWithoutSeconds(e.time) + ' - ' : ''}${e.title}`}
                          >
                            {'time' in e && e.time && (
                              <span className="font-bold opacity-80 mb-0.5">{formatTimeWithoutSeconds(e.time)}</span>
                            )}
                            <span className="line-clamp-2">{e.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {displayEvents.length === 0 && viewType === 'List' && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
              <p className="text-slate-500">{t('noEventsFilter')}</p>
            </div>
          )}
        </div>
    </div>
  );
}
