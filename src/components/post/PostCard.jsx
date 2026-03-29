import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import DriveLinkCard from '../shared/DriveLinkCard';
import { toast } from 'react-hot-toast';
import DOMPurify from 'dompurify';

const PostCard = ({ post }) => {
  const { user: authUser } = useAuthStore();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    fetchInitialCounts();
  }, [post.id, authUser]);

  const fetchInitialCounts = async () => {
    // Fetch total likes
    const { count: totalLikes } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    setLikesCount(totalLikes || 0);

    // Fetch if current user liked
    if (authUser) {
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', authUser.id)
        .maybeSingle();
      setIsLiked(!!userLike);
    }

    // Fetch total comments
    const { count: totalComments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    setCommentsCount(totalComments || 0);
  };

  const fetchComments = async () => {
    setIsLoadingComments(true);
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id(id, full_name, username, avatar_url)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    if (data) setComments(data);
    setIsLoadingComments(false);
  };

  const toggleComments = () => {
    const newState = !showComments;
    setShowComments(newState);
    if (newState && comments.length === 0) {
      fetchComments();
    }
  };

  const handleLike = async () => {
    if (!authUser) {
      toast.error('Please login to like this post.');
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic UI update
    setIsLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      if (previousLiked) {
        await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', authUser.id);
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: authUser.id });
      }
    } catch (error) {
      // Revert UI on failure
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      toast.error('Failed to update like status.');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !authUser) return;

    setIsSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: authUser.id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles:user_id(id, full_name, username, avatar_url)
        `)
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setCommentsCount(prev => prev + 1);
      setNewComment("");
    } catch (error) {
      toast.error("Failed to post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!post || !post.profiles) return null;

  return (
    <article className="border-b border-gray-100 p-6 sm:p-8 bg-white hover:bg-gray-50/50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 w-full">
          {/* Clickable Avatar */}
          <Link to={`/profile/${post.profiles?.username}`} className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 overflow-hidden shrink-0 hover:ring-2 ring-blue-500 transition-all">
            {post.profiles.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="Author" className="w-full h-full object-cover" />
            ) : (
              post.profiles.username?.charAt(0).toUpperCase()
            )}
          </Link>
          
          <div className="flex-1">
            {/* Clickable Name */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${post.profiles?.username}`} className="font-bold text-gray-900 text-[15px] hover:underline decoration-blue-500">
                {post.profiles.full_name || post.profiles.username}
              </Link>
              <Link to={`/profile/${post.profiles?.username}`} className="text-gray-500 text-[15px] hover:text-blue-600 transition-colors">
                @{post.profiles.username}
              </Link>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 text-sm">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <div 
              className="mt-2 text-[16px] leading-relaxed text-gray-900 font-bengali whitespace-pre-wrap prose prose-blue max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }}
            />

            {/* Images Render */}
            {post.image_urls && post.image_urls.length > 0 && (
              <div className={`mt-4 grid gap-2 ${
                post.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {post.image_urls.map((url, i) => (
                  <img 
                    key={i} 
                    src={url} 
                    alt="Post Image" 
                    className="rounded-2xl border border-gray-100 w-full object-cover max-h-96"
                  />
                ))}
              </div>
            )}

            {/* Drive Link Render */}
            {post.drive_link && <DriveLinkCard url={post.drive_link} />}

            {/* Action Bar */}
            <div className="flex items-center gap-8 mt-4">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-2 group transition-colors ${isLiked ? 'text-rose-600' : 'text-gray-500 hover:text-rose-600'}`}
              >
                <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-rose-50' : 'group-hover:bg-rose-50'}`}>
                  <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
                </div>
                <span className="text-sm font-medium">{likesCount > 0 ? likesCount : 'Like'}</span>
              </button>
              
              <button 
                onClick={toggleComments}
                className={`flex items-center gap-2 group transition-colors ${showComments ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
              >
                <div className={`p-2 rounded-full transition-colors ${showComments ? 'bg-blue-50' : 'group-hover:bg-blue-50'}`}>
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{commentsCount > 0 ? commentsCount : 'Comment'}</span>
              </button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                {/* Comments List */}
                <div className="space-y-4 mb-4">
                  {isLoadingComments ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <Link to={`/profile/${c.profiles?.username}`} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 overflow-hidden shrink-0 text-xs hover:ring-2 ring-blue-500 transition-all">
                          {c.profiles.avatar_url ? (
                            <img src={c.profiles.avatar_url} alt="Commenter" className="w-full h-full object-cover" />
                          ) : (
                            c.profiles.username?.charAt(0).toUpperCase()
                          )}
                        </Link>
                        <div className="bg-gray-50 rounded-2xl px-4 py-2 flex-1">
                          <Link to={`/profile/${c.profiles?.username}`} className="font-bold text-[13px] text-gray-900 hover:underline">
                            {c.profiles.full_name || c.profiles.username}
                          </Link>
                          <p className="text-[14px] text-gray-800 font-bengali mt-0.5">{c.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-gray-500 py-2">No comments yet. Be the first to comment!</p>
                  )}
                </div>

                {/* Comment Input */}
                {authUser ? (
                  <form onSubmit={handlePostComment} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-bengali"
                    />
                    <button 
                      type="submit"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
                    >
                      {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                ) : (
                  <p className="text-center text-sm text-gray-400">Please login to write a comment.</p>
                )}
              </div>
            )}
            
          </div>
        </div>
        
        <button className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
};

export default PostCard;
