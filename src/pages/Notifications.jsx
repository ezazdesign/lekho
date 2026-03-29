import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, UserPlus, Bell, Check, Loader2 } from 'lucide-react';

const Notifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      markAllAsRead();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:sender_id(id, username, full_name, avatar_url),
          post:post_id(content)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  // Helper to render the relevant icon
  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500 fill-blue-500" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Helper to render text based on action
  const getNotificationText = (notification) => {
    const nameStr = notification.sender?.full_name || notification.sender?.username || "Someone";
    
    switch (notification.type) {
      case 'like':
        return (
          <>
            <span className="font-bold text-gray-900">{nameStr}</span> liked your post
            {notification.post?.content ? (
               <span className="text-gray-500 truncate inline-block ml-1 max-w-[150px] align-bottom text-sm italic">
                  "{notification.post.content.replace(/<[^>]+>/g, '')}"
               </span>
            ) : ""}
          </>
        );
      case 'comment':
        return (
          <>
            <span className="font-bold text-gray-900">{nameStr}</span> commented on your post
          </>
        );
      case 'follow':
        return (
          <>
            <span className="font-bold text-gray-900">{nameStr}</span> started following you
          </>
        );
      default:
        return <span><span className="font-bold text-gray-900">{nameStr}</span> interacted with you</span>;
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-4 px-6 md:px-8 flex justify-between items-center backdrop-blur-md bg-white/80">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-bengali">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">See who's interacting with you</p>
        </div>
      </div>
      
      {/* List Area */}
      <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 mt-20 p-8">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Bell className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications yet</h3>
            <p className="max-w-[250px] text-sm">When someone likes, comments, or follows you, it'll show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 sm:p-6 flex items-start gap-4 transition-colors hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50/30' : 'bg-white'}`}
              >
                {/* Custom Icon col */}
                <div className="mt-1 shrink-0">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link to={`/profile/${notif.sender?.username}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 overflow-hidden shrink-0 hover:ring-2 ring-gray-200 transition-all">
                        {notif.sender?.avatar_url ? (
                           <img src={notif.sender.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                        ) : (
                           notif.sender?.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                    </Link>
                  </div>
                  
                  <div className="text-[15px] text-gray-800 leading-snug">
                    {getNotificationText(notif)}
                  </div>
                  
                  <div className="text-sm text-gray-400 mt-1.5 font-medium">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
