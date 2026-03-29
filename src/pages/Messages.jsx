import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Send, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistanceToNow, format } from 'date-fns';

const Messages = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  
  const [targetUser, setTargetUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mutualFriends, setMutualFriends] = useState([]);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!authUser) return;
    
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

      // 4. Setup Real-time Subscription (Supabase)
      const channel = supabase
        .channel('realtime:messages')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${authUser.id}` 
        }, payload => {
            // Only add if it's from the current open chat
            if (payload.new.sender_id === user.id) {
                setMessages(prev => [...prev, payload.new]);
            }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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
    setNewMessage("");
    setSending(true);

    try {
      // Optimistic UI Update
      const optimisticMsg = {
        id: 'temp-' + Date.now(),
        sender_id: authUser.id,
        receiver_id: targetUser.id,
        content: messageText,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);

      // Database Insert
      const { error } = await supabase.from('messages').insert({
        sender_id: authUser.id,
        receiver_id: targetUser.id,
        content: messageText
      });

      if (error) {
        // Remove optimistic message if failed
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        throw error;
      }
    } catch (error) {
      console.error("Failed to send:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- VIEW: CHAT LIST (NO USER SELECTED) ---
  if (!username) {
    return (
      <div className="flex flex-col h-screen max-h-screen bg-white">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-4">
          <h1 className="text-2xl font-bold text-gray-900 font-bengali">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">Chat with your mutual followers</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {mutualFriends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4 pt-20">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                <MessageCircle className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg">No friends yet.</p>
              <p className="text-sm px-8">Follow people and wait for them to follow you back to start chatting!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mutualFriends.map(friend => (
                <Link 
                  key={friend.id} 
                  to={`/messages/${friend.username}`}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className="w-14 h-14 font-bold text-xl rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                    ) : (
                      friend.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{friend.full_name || friend.username}</h3>
                    <p className="text-sm text-gray-500">Tap to chat with @{friend.username}</p>
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
  return (
    <div className="flex flex-col h-screen max-h-[100dvh]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 pb-safe-top flex items-center gap-4">
        <button 
          onClick={() => navigate('/messages')} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        {targetUser && (
          <Link to={`/profile/${targetUser.username}`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 overflow-hidden">
              {targetUser.avatar_url ? (
                <img src={targetUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                targetUser.username?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight">{targetUser.full_name || targetUser.username}</h2>
              <p className="text-xs text-blue-600 font-medium tracking-wide">Mutual Follower</p>
            </div>
          </Link>
        )}
      </div>

      {/* Warning State: Not Mutual anymore */}
      {targetUser?.notMutual ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
           <Info className="w-12 h-12 text-gray-400 mb-4" />
           <h3 className="text-xl font-bold text-gray-900 mb-2">You can't message this user</h3>
           <p className="text-gray-500">You must both follow each other to send private messages.</p>
           <button onClick={() => navigate(`/profile/${targetUser.username}`)} className="mt-6 px-6 py-2 bg-white border border-gray-200 rounded-full font-bold shadow-sm">View Profile</button>
        </div>
      ) : (
        <>
          {/* Chat History Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50/50 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                 Say hi to {targetUser.full_name || targetUser.username}! 👋
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender_id === authUser.id;
                const showTime = index === 0 || new Date(msg.created_at) - new Date(messages[index-1].created_at) > 1000 * 60 * 30; // 30 mins

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showTime && (
                      <span className="text-[11px] text-gray-400 font-medium mb-2 mt-4">
                        {format(new Date(msg.created_at), "MMM d, h:mm a")}
                      </span>
                    )}
                    <div 
                      className={`max-w-[75%] px-5 py-3 rounded-2xl font-bengali text-[15px] leading-relaxed relative
                        ${isMe 
                          ? 'bg-blue-600 text-white rounded-br-sm shadow-sm' 
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'}
                      `}
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
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-safe">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-4xl mx-auto">
              <div className="flex-1 bg-gray-100 rounded-3xl pb-2">
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
                  className="w-full bg-transparent max-h-32 px-5 py-3.5 pt-4 text-[15px] focus:outline-none resize-none font-bengali leading-snug"
                  style={{ minHeight: '52px' }}
                />
              </div>
              <button 
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 mb-0.5"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Messages;
