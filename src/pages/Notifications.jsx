import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { useUnreadStore } from '../store/useUnreadStore';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, UserPlus, Bell, Loader2 } from 'lucide-react';

const Notifications = () => {
  const { user } = useAuthStore();
  const { clearNotifications } = useUnreadStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      markAllAsRead();
      clearNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, sender:sender_id(id, username, full_name, avatar_url), post:post_id(content)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          </div>
        );
      case 'comment':
        return (
          <div className="w-9 h-9 rounded-xl bg-lekho-primary/15 border border-lekho-primary/25 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-lekho-primary-light" />
          </div>
        );
      case 'follow':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 text-emerald-400" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-lekho-muted" />
          </div>
        );
    }
  };

  // Move stripHtml outside or memoize it
  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const getNotificationContent = (notification) => {
    const name = notification.sender?.full_name || notification.sender?.username || 'Someone';
    const postSnippet = notification.post?.content
      ? stripHtml(notification.post.content)
      : null;

    switch (notification.type) {
      case 'like':
        return (
          <>
            <p className="text-[14px] text-lekho-text leading-snug">
              <span className="font-bold">{name}</span>
              <span className="text-lekho-text/70 ms-1">liked your post</span>
            </p>
            {postSnippet && (
              <p className="text-[13px] text-lekho-muted italic mt-0.5 line-clamp-1 break-all">
                "{postSnippet}"
              </p>
            )}
          </>
        );
      case 'comment':
        return (
          <p className="text-[14px] text-lekho-text leading-snug">
            <span className="font-bold">{name}</span>
            <span className="text-lekho-text/70 ms-1">commented on your post</span>
          </p>
        );
      case 'follow':
        return (
          <p className="text-[14px] text-lekho-text leading-snug">
            <span className="font-bold">{name}</span>
            <span className="text-lekho-text/70 ms-1">started following you</span>
          </p>
        );
      default:
        return (
          <p className="text-[14px] text-lekho-text leading-snug">
            <span className="font-bold">{name}</span>
            <span className="text-lekho-text/70 ms-1">interacted with you</span>
          </p>
        );
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'like':
        return (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-lekho-base flex items-center justify-center">
            <Heart className="w-2.5 h-2.5 text-white fill-white" />
          </div>
        );
      case 'comment':
        return (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-lekho-primary border-2 border-lekho-base flex items-center justify-center">
            <MessageCircle className="w-2.5 h-2.5 text-white fill-white" />
          </div>
        );
      case 'follow':
        return (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-lekho-base flex items-center justify-center">
            <UserPlus className="w-2.5 h-2.5 text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-lekho-base pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-lekho-surface/85 backdrop-blur-xl border-b border-white/[0.06] px-5 py-4">
        <h1 className="text-2xl font-bold text-lekho-text font-bengali">Notifications</h1>
        <p className="text-sm text-lekho-muted mt-0.5">See who's interacting with you</p>
      </div>

      {/* List */}
      <div className="flex-1 w-full max-w-2xl mx-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-7 h-7 animate-spin text-lekho-primary-light" />
          </div>
        ) : error ? (
          <div className="p-16 text-center">
             <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
               <span className="text-2xl">⚠️</span>
             </div>
             <h3 className="text-xl font-bold text-lekho-text mb-2 tracking-tight">Something went wrong</h3>
             <p className="text-lekho-muted text-sm mb-6 px-10">Couldn't load your notifications. Please check your connection.</p>
             <button 
               onClick={() => fetchNotifications()}
               className="px-8 py-2.5 bg-gradient-lekho text-white font-bold rounded-full shadow-glow-purple hover:opacity-90 transition-all text-sm"
             >
               Retry Now
             </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-lekho-muted mt-20 p-8">
            <div className="w-20 h-20 bg-lekho-primary/10 border border-lekho-primary/20 rounded-2xl flex items-center justify-center mb-6">
              <Bell className="w-9 h-9 text-lekho-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-lekho-text mb-2">All caught up!</h3>
            <p className="max-w-[260px] text-sm text-lekho-muted">When someone likes, comments, or follows you, it'll show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 flex items-center gap-4 transition-colors hover:bg-white/[0.02] animate-fade-in relative ${
                  !notif.is_read ? 'bg-lekho-primary/5' : ''
                }`}
              >
                {!notif.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-lekho" />
                )}

                {/* Left: Avatar with Badge */}
                <div className="relative shrink-0">
                  <Link to={`/profile/${notif.sender?.username}`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-lekho-soft flex items-center justify-center font-bold text-lekho-primary-light overflow-hidden ring-2 ring-white/5 shadow-sm transition-transform active:scale-95">
                      {notif.sender?.avatar_url ? (
                        <img src={notif.sender.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                      ) : (
                        notif.sender?.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                  </Link>
                  {getTypeBadge(notif.type)}
                </div>

                {/* Center: Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col">
                    {getNotificationContent(notif)}
                    <span className="text-[11px] text-lekho-muted mt-1 font-medium tracking-tight">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Unread dot indicator on right */}
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-gradient-lekho shadow-glow-purple shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
