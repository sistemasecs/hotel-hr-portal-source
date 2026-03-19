"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { EventComment } from '@/types';

interface CommentsSectionProps {
  referenceId: string;
  title?: string;
}

export default function CommentsSection({ referenceId, title = "Comments" }: CommentsSectionProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { users: allUsers } = useData();
  
  const [comments, setComments] = useState<EventComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  // Tagging State
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredTagUsers, setFilteredTagUsers] = useState<typeof allUsers>([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const EMOJIS = ['👍', '❤️', '😂', '🎉', '👏'];

  useEffect(() => {
    if (referenceId) {
      const fetchComments = async () => {
        try {
          const res = await fetch(`/api/events/${encodeURIComponent(referenceId)}/comments`);
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
  }, [referenceId]);

  useEffect(() => {
    const handleTagSearch = () => {
      const lastAtIndex = newComment.lastIndexOf('@', cursorPosition - 1);
      if (lastAtIndex !== -1) {
        const textAfterAt = newComment.substring(lastAtIndex + 1, cursorPosition);
        if (!textAfterAt.includes(' ')) {
          const search = textAfterAt.toLowerCase();
          setFilteredTagUsers(allUsers.filter(u => 
            u.name.toLowerCase().includes(search) && u.id !== user?.id
          ).slice(0, 5));
          setShowTagSuggestions(true);
          return;
        }
      }
      setShowTagSuggestions(false);
    };

    handleTagSearch();
  }, [newComment, cursorPosition, allUsers, user?.id]);

  const handleSelectTag = (userName: string) => {
    const lastAtIndex = newComment.lastIndexOf('@', cursorPosition - 1);
    const beforeAt = newComment.substring(0, lastAtIndex);
    const afterTag = newComment.substring(cursorPosition);
    const updatedComment = `${beforeAt}@${userName} ${afterTag}`;
    setNewComment(updatedComment);
    setShowTagSuggestions(false);
  };

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
    if (!newComment.trim() || !user || !referenceId) return;

    setIsSubmittingComment(true);
    try {
      let imageUrl = null;

      if (commentImageFile) {
        const formData = new FormData();
        formData.append('file', commentImageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          imageUrl = url;
        }
      }

      const res = await fetch(`/api/events/${encodeURIComponent(referenceId)}/comments`, {
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
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleReaction = async (commentId: string, emoji: string) => {
    if (!user) return;

    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const existingReactionIndex = comment.reactions.findIndex(r => r.emoji === emoji);
        let newReactions = [...comment.reactions];

        if (existingReactionIndex >= 0) {
          const reaction = newReactions[existingReactionIndex];
          if (reaction.userIds.includes(user.id)) {
            reaction.userIds = reaction.userIds.filter(id => id !== user.id);
            if (reaction.userIds.length === 0) newReactions.splice(existingReactionIndex, 1);
          } else {
            reaction.userIds.push(user.id);
          }
        } else {
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
    } catch (error) {}
  };

  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@[A-Za-z\s]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="font-bold text-primary-600 bg-primary-50 px-1 rounded">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6">{title}</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
        <form onSubmit={handlePostComment} className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                {user?.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-grow relative">
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setCursorPosition(e.target.selectionStart);
              }}
              onKeyUp={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
              onClick={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
              placeholder="Write a message..."
              className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-primary-500 focus:border-primary-500 min-h-[60px]"
              required
            />

            {showTagSuggestions && filteredTagUsers.length > 0 && (
              <div className="absolute z-50 left-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                {filteredTagUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectTag(u.name)}
                    className="w-full flex items-center p-2 hover:bg-primary-50 transition-colors group"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                      <p className="text-[10px] text-slate-500">{u.department}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {commentImagePreview && (
              <div className="mt-2 relative inline-block">
                <img src={commentImagePreview} alt="Preview" className="h-20 rounded-md object-cover" />
              </div>
            )}

            <div className="mt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => commentFileInputRef.current?.click()}
                className="text-slate-400 hover:text-primary-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
              </button>
              <input type="file" ref={commentFileInputRef} onChange={handleCommentImageSelect} className="hidden" accept="image/*" />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="px-4 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isSubmittingComment ? '...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <div className="flex-shrink-0">
              {comment.userAvatarUrl ? (
                <img src={comment.userAvatarUrl} alt={comment.userName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs text-center">
                  {comment.userName?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className="flex-grow">
              <div className="bg-slate-50 rounded-lg p-3 inline-block max-w-full">
                <h4 className="font-semibold text-slate-900 text-sm">{comment.userName}</h4>
                <p className="text-slate-700 text-sm whitespace-pre-wrap mt-1">{renderCommentContent(comment.content)}</p>
                {comment.imageUrl && <img src={comment.imageUrl} className="mt-2 max-h-48 rounded" />}
              </div>
              <div className="mt-1 flex items-center space-x-2">
                {EMOJIS.map(emoji => {
                  const reaction = comment.reactions.find(r => r.emoji === emoji);
                  const count = reaction?.userIds.length || 0;
                  const hasReacted = user && reaction?.userIds.includes(user.id);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleToggleReaction(comment.id, emoji)}
                      className={`text-xs px-2 py-0.5 rounded-full border ${hasReacted ? 'bg-primary-50 border-primary-200' : 'bg-white border-slate-100'}`}
                    >
                      {emoji} {count > 0 ? count : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
