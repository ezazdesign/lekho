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

  const getNotificationText = (notification) => {
    const name = notification.sender?.full_name || notification.sender?.username || 'Someone';
    const postSnippet = notification.post?.content
      ? notification.post.content.replace(/<[^>]+>/g, '').substring(0, 40)
      : null;

    switch (notification.type) {
      case 'like':
        return (
          <>
            <span className="font-bold text-lekho-text">{name}</span>
            <span className="text-lekho-text/70"> liked your post</span>
            {postSnippet && (
              <span className="text-lekho-muted italic ml-1 text-sm">"{postSnippet}..."</span>
            )}
          </>
        );
      case 'comment':
        return (
          <>
            <span className="font-bold text-lekho-text">{name}</span>
            <span className="text-lekho-text/70"> commented on your post</span>
          </>
        );
      case 'follow':
        return (
          <>
            <span className="font-bold text-lekho-text">{name}</span>
            <span className="text-lekho-text/70"> started following you</span>
          </>
        );
      default:
        return (
          <>
            <span className="font-bold text-lekho-text">{name}</span>
            <span className="text-lekho-text/70"> interacted with you</span>
          </>
        );
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
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors hover:bg-white/[0.02] animate-fade-in ${
                  !notif.is_read ? 'border-l-2 border-lekho-primary bg-lekho-primary/5' : ''
                }`}
              >
                {/* Type icon */}
                {getIcon(notif.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Link to={`/profile/${notif.sender?.username}`}>
                      <div className="w-8 h-8 rounded-full bg-gradient-lekho-soft flex items-center justify-center font-bold text-lekho-primary-light overflow-hidden shrink-0 hover:ring-2 ring-lekho-primary/30 transition-all text-xs">
                        {notif.sender?.avatar_url ? (
                          <img src={notif.sender.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                        ) : (
                          notif.sender?.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                    </Link>
                  </div>

                  <div className="text-[14px] leading-snug">
                    {getNotificationText(notif)}
                  </div>

                  <div className="text-[12px] text-lekho-muted mt-1.5 font-medium">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </div>
                </div>

                {/* Unread dot */}
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-lekho-primary shrink-0 mt-2" />
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
