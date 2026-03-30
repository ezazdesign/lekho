import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Send, Loader2, Info, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { useUnreadStore } from '../store/useUnreadStore';
import { formatDistanceToNow, format } from 'date-fns';

const Messages = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const { clearMessages, fetchCounts } = useUnreadStore();
  
  const [targetUser, setTargetUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mutualFriends, setMutualFriends] = useState([]);
  
  const messagesEndRef = useRef(null);
  const realtimeChatChannelRef = useRef(null);

  useEffect(() => {
    if (!authUser) return;
    
    // Always clear the badge whenever the user opens ANY messages page
    clearMessages();

    if (username) {
      fetchTargetUserAndMessages();
    } else {
      fetchMutualFriends();
    }
  }, [username, authUser]);

  useEffect(() => {
    // Scroll to bottom on new messages
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMutualFriends = async () => {
    setLoading(true);
    try {
      // Very naive approach for MVP: Fetch all people I follow, then check who follows me back.
      const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', authUser.id);
      const { data: followers } = await supabase.from('follows').select('follower_id').eq('following_id', authUser.id);
      
      const followingIds = following?.map(f => f.following_id) || [];
      const followerIds = followers?.map(f => f.follower_id) || [];
      
      const mutualIds = followingIds.filter(id => followerIds.includes(id));

      if (mutualIds.length > 0) {
        const { data: friends } = await supabase.from('profiles').select('*').in('id', mutualIds);
        setMutualFriends(friends || []);
      } else {
        setMutualFriends([]);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const markMessagesAsRead = async (targetUsername) => {
    // Badge is already cleared by the useEffect above via clearMessages().
    // This function is kept as a placeholder for future is_read DB support.
    fetchCounts();
  };

  const fetchTargetUserAndMessages = async () => {
    setLoading(true);
    try {
      // 1. Get Target User
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
        
      if (userError || !user) {
        navigate('/messages');
        return;
      }
      setTargetUser(user);

      // 2. Double check Mutual Follow (Security/UI enforcement)
      const { data: iFollow } = await supabase.from('follows').select('*').eq('follower_id', authUser.id).eq('following_id', user.id).maybeSingle();
      const { data: followsMe } = await supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', authUser.id).maybeSingle();
      
      if (!iFollow || !followsMe) {
        // Not mutual!
        setTargetUser({ ...user, notMutual: true });
        setLoading(false);
        return;
      }

      // 3. Fetch Chat History
      const { data: chatHistory, error: chatError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${authUser.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${authUser.id})`)
        .order('created_at', { ascending: true });

      if (chatError) throw chatError;
      setMessages(chatHistory || []);

      // 🔥 Replace polling with Supabase Realtime for instant chat updates
      // Clean up any previous channel first
      if (realtimeChatChannelRef.current) {
        supabase.removeChannel(realtimeChatChannelRef.current);
      }

      const chatChannel = supabase
        .channel(`chat-${authUser.id}-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const msg = payload.new;
            const isThisConvo =
              (msg.sender_id === authUser.id && msg.receiver_id === user.id) ||
              (msg.sender_id === user.id && msg.receiver_id === authUser.id);

            if (isThisConvo) {
              // Skip messages that WE sent — already handled by optimistic UI
              // (they get replaced via the insert .select() in handleSendMessage)
              if (msg.sender_id === authUser.id) return;

              setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            }
          }
        )
        .subscribe();

      realtimeChatChannelRef.current = chatChannel;

      return () => {
        if (realtimeChatChannelRef.current) {
          supabase.removeChannel(realtimeChatChannelRef.current);
          realtimeChatChannelRef.current = null;
        }
      };

    } catch (error) {
      console.error("Error fetching chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !targetUser || targetUser.notMutual) return;

    const messageText = newMessage.trim();
    const tempId = 'temp-' + Date.now();
    setNewMessage('');
    setSending(true);

    // Optimistic UI — show immediately with temp id
    const optimisticMsg = {
      id: tempId,
      sender_id: authUser.id,
      receiver_id: targetUser.id,
      content: messageText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      // DB Insert — get back the real row with real id
      const { data: inserted, error } = await supabase
        .from('messages')
        .insert({ sender_id: authUser.id, receiver_id: targetUser.id, content: messageText })
        .select()
        .single();

      if (error) {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== tempId));
        throw error;
      }

      // Replace temp message with the real DB row (avoids duplicate from Realtime)
      setMessages(prev => prev.map(m => m.id === tempId ? inserted : m));
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-lekho-base">
        <Loader2 className="w-8 h-8 animate-spin text-lekho-primary-light" />
      </div>
    );
  }

  // --- VIEW: CHAT LIST (NO USER SELECTED) ---
  if (!username) {
    return (
      <div className="flex flex-col bg-lekho-base min-h-screen">
        <div className="sticky top-0 z-10 bg-lekho-surface/80 backdrop-blur-xl border-b border-white/[0.06] p-4 pt-safe">
          <h1 className="text-2xl font-bold text-lekho-text font-bengali">Messages</h1>
          <p className="text-sm text-lekho-muted mt-1">Chat with mutual followers</p>
        </div>
        
        <div className="p-4">
          {mutualFriends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-lekho-muted space-y-4 pt-20">
              <div className="w-24 h-24 bg-lekho-primary/10 border border-lekho-primary/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-lekho-primary/40" />
              </div>
              <p className="text-lg text-lekho-text font-semibold">No friends yet.</p>
              <p className="text-sm px-8 text-lekho-muted">Follow people and wait for them to follow you back to start chatting!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mutualFriends.map(friend => (
                <Link
                  key={friend.id}
                  to={`/messages/${friend.username}`}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.04] transition-colors border border-white/[0.05] hover:border-lekho-primary/20"
                >
                  <div className="w-14 h-14 font-bold text-xl rounded-full bg-gradient-lekho-soft text-lekho-primary-light flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-lekho-primary/20">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                    ) : (
                      friend.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lekho-text text-lg">{friend.full_name || friend.username}</h3>
                    <p className="text-sm text-lekho-muted">Tap to chat with @{friend.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW: ACTIVE CHAT ROOM ---
  if (!targetUser) return null;

  return (
    <div className="flex flex-col h-screen max-h-[100dvh] bg-lekho-base">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-lekho-surface/85 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 hover:bg-white/[0.06] rounded-full transition-colors text-lekho-muted hover:text-lekho-text"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {targetUser && (
          <Link to={`/profile/${targetUser.username}`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-lekho-soft flex items-center justify-center font-bold text-lekho-primary-light overflow-hidden ring-2 ring-lekho-primary/20">
              {targetUser.avatar_url ? (
                <img src={targetUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                targetUser.username?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="font-bold text-lekho-text leading-tight">{targetUser.full_name || targetUser.username}</h2>
              <p className="text-xs text-lekho-primary-light font-medium tracking-wide">Mutual Follower</p>
            </div>
          </Link>
        )}
      </div>

      {/* Warning: Not Mutual */}
      {targetUser?.notMutual ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Info className="w-12 h-12 text-lekho-muted mb-4" />
          <h3 className="text-xl font-bold text-lekho-text mb-2">Can't message this user</h3>
          <p className="text-lekho-muted">You must both follow each other to chat.</p>
          <button onClick={() => navigate(`/profile/${targetUser.username}`)} className="mt-6 px-6 py-2 bg-white/[0.07] border border-white/[0.1] text-lekho-text rounded-full font-bold hover:bg-white/[0.1] transition-all">
            View Profile
          </button>
        </div>
      ) : (
        <>
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center text-lekho-muted mt-10">
                Say hi to {targetUser.full_name || targetUser.username}! 👋
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender_id === authUser.id;
                const showTime = index === 0 || new Date(msg.created_at) - new Date(messages[index - 1].created_at) > 1000 * 60 * 30;
                const isTemp = msg.id?.toString().startsWith('temp-');

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showTime && (
                      <span className="text-[11px] text-lekho-muted font-medium mb-2 mt-4">
                        {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                    <div
                      className={`max-w-[75%] px-5 py-3 rounded-2xl font-bengali text-[15px] leading-relaxed transition-opacity ${
                        isMe
                          ? 'bg-gradient-lekho text-white rounded-br-sm shadow-glow-purple'
                          : 'bg-lekho-elevated text-lekho-text rounded-bl-sm border border-white/[0.07]'
                      } ${isTemp ? 'opacity-70' : 'opacity-100'}`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="sticky bottom-0 bg-lekho-surface/90 backdrop-blur-xl border-t border-white/[0.06] p-4 pb-safe">
            <form onSubmit={handleSendMessage} className="flex gap-3 items-end max-w-4xl mx-auto">
              <div className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-3xl focus-within:border-lekho-primary/40 focus-within:bg-white/[0.08] transition-all">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Message..."
                  rows="1"
                  className="w-full bg-transparent max-h-32 px-5 py-3.5 pt-4 text-[15px] text-lekho-text placeholder-lekho-muted focus:outline-none resize-none font-bengali leading-snug"
                  style={{ minHeight: '52px' }}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-12 h-12 bg-gradient-lekho rounded-full flex items-center justify-center text-white shrink-0 hover:opacity-90 transition-all disabled:opacity-40 shadow-glow-purple mb-0.5"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Messages;
