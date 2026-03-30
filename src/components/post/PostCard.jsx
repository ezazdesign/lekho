import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import DriveLinkCard from '../shared/DriveLinkCard';
import { toast } from 'react-hot-toast';
import DOMPurify from 'dompurify';
import EditPostModal from './EditPostModal';

const PostCard = ({ post, onDelete, onUpdate }) => {
  const { user: authUser } = useAuthStore();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchInitialCounts(); }, [post.id, authUser]);

  const fetchInitialCounts = async () => {
    const { count: totalLikes } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
    setLikesCount(totalLikes || 0);

    if (authUser) {
      const { data: userLike } = await supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', authUser.id).maybeSingle();
      setIsLiked(!!userLike);
    }

    const { count: totalComments } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
    setCommentsCount(totalComments || 0);
  };

  const fetchComments = async () => {
    setIsLoadingComments(true);
    const { data } = await supabase.from('comments').select('*, profiles:user_id(id, full_name, username, avatar_url)').eq('post_id', post.id).order('created_at', { ascending: true });
    if (data) setComments(data);
    setIsLoadingComments(false);
  };

  const toggleComments = () => {
    const newState = !showComments;
    setShowComments(newState);
    if (newState && comments.length === 0) fetchComments();
  };

  const handleLike = async () => {
    if (!authUser) { toast.error('Please login to like.'); return; }
    const prev = isLiked, prevCount = likesCount;
    setIsLiked(!prev);
    setLikesCount(prev ? prevCount - 1 : prevCount + 1);
    try {
      if (prev) {
        await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', authUser.id);
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: authUser.id });
        if (post.user_id !== authUser.id) {
          await supabase.from('notifications').insert({ user_id: post.user_id, sender_id: authUser.id, type: 'like', post_id: post.id });
        }
      }
    } catch {
      setIsLiked(prev); setLikesCount(prevCount);
      toast.error('Failed to update like.');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !authUser) return;
    setIsSubmittingComment(true);
    try {
      const { data, error } = await supabase.from('comments').insert({ post_id: post.id, user_id: authUser.id, content: newComment.trim() }).select('*, profiles:user_id(id, full_name, username, avatar_url)').single();
      if (error) throw error;
      if (post.user_id !== authUser.id) {
        await supabase.from('notifications').insert({ user_id: post.user_id, sender_id: authUser.id, type: 'comment', post_id: post.id });
      }
      setComments([...comments, data]);
      setCommentsCount((p) => p + 1);
      setNewComment('');
    } catch {
      toast.error('Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post permanently?')) return;
    setIsDeleting(true); setShowOptions(false);
    try {
      await supabase.from('likes').delete().eq('post_id', post.id);
      await supabase.from('comments').delete().eq('post_id', post.id);
      await supabase.from('notifications').delete().eq('post_id', post.id);
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      toast.success('Post deleted.');
      if (onDelete) onDelete(post.id);
    } catch {
      toast.error('Failed to delete post.');
      setIsDeleting(false);
    }
  };

  if (!post || !post.profiles || isDeleting) return null;

  const sanitize = (html) => typeof DOMPurify.sanitize === 'function' ? DOMPurify.sanitize(html || '') : (DOMPurify.default?.sanitize(html || '') || html);

  return (
    <article className="border-b border-white/[0.05] p-5 sm:p-7 bg-transparent hover:bg-white/[0.02] transition-all duration-200 group animate-fade-in">
      <div className="flex justify-between items-start min-w-0">
        <div className="flex gap-3.5 w-full min-w-0">
          {/* Avatar */}
          <Link to={`/profile/${post.profiles?.username}`} className="shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-lekho-soft flex items-center justify-center font-bold text-lekho-primary-light overflow-hidden ring-2 ring-transparent hover:ring-lekho-primary/40 transition-all">
              {post.profiles.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="Author" className="w-full h-full object-cover" />
              ) : (
                post.profiles.username?.charAt(0).toUpperCase()
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            {/* Author info */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Link to={`/profile/${post.profiles?.username}`} className="font-bold text-lekho-text text-[14px] hover:text-lekho-primary-light transition-colors">
                {post.profiles.full_name || post.profiles.username}
              </Link>
              <Link to={`/profile/${post.profiles?.username}`} className="text-lekho-muted text-[13px] hover:text-lekho-muted-light transition-colors">
                @{post.profiles.username}
              </Link>
              <span className="text-lekho-muted/40">·</span>
              <span className="text-lekho-muted text-[12px]">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Content */}
            <div
              className="text-[15px] leading-relaxed text-lekho-text/90 font-bengali whitespace-pre-wrap prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-img:rounded-xl prose-img:my-4 [&_img]:!max-w-full [&_img]:!h-auto overflow-hidden break-words"
              dangerouslySetInnerHTML={{ __html: sanitize(post.content) }}
            />

            {/* Images */}
            {post.image_urls?.length > 0 && (
              <div className={`mt-4 grid gap-2 ${post.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {post.image_urls.map((url, i) => (
                  <img key={i} src={url} alt="Post" className="rounded-2xl border border-white/[0.08] w-full object-cover max-h-96" />
                ))}
              </div>
            )}

            {post.drive_link && <DriveLinkCard url={post.drive_link} />}

            {/* Action Bar */}
            <div className="flex items-center gap-6 mt-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 group/like transition-all ${isLiked ? 'text-rose-400' : 'text-lekho-muted hover:text-rose-400'}`}
              >
                <div className={`p-1.5 rounded-full transition-all ${isLiked ? 'bg-rose-500/15' : 'group-hover/like:bg-rose-500/10'}`}>
                  <Heart className={`w-4 h-4 transition-all ${isLiked ? 'scale-110' : ''}`} fill={isLiked ? 'currentColor' : 'none'} />
                </div>
                <span className="text-[13px] font-medium">{likesCount > 0 ? likesCount : 'Like'}</span>
              </button>

              <button
                onClick={toggleComments}
                className={`flex items-center gap-2 group/cmt transition-all ${showComments ? 'text-lekho-primary-light' : 'text-lekho-muted hover:text-lekho-primary-light'}`}
              >
                <div className={`p-1.5 rounded-full transition-all ${showComments ? 'bg-lekho-primary/15' : 'group-hover/cmt:bg-lekho-primary/10'}`}>
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-[13px] font-medium">{commentsCount > 0 ? commentsCount : 'Comment'}</span>
              </button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] animate-fade-in">
                <div className="space-y-3 mb-4">
                  {isLoadingComments ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-lekho-muted" />
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Link to={`/profile/${c.profiles?.username}`}>
                          <div className="w-7 h-7 rounded-full bg-gradient-lekho-soft flex items-center justify-center font-bold text-lekho-primary-light text-xs overflow-hidden shrink-0">
                            {c.profiles.avatar_url ? (
                              <img src={c.profiles.avatar_url} alt="Commenter" className="w-full h-full object-cover" />
                            ) : c.profiles.username?.charAt(0).toUpperCase()}
                          </div>
                        </Link>
                        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-2.5 flex-1">
                          <Link to={`/profile/${c.profiles?.username}`} className="font-bold text-[12px] text-lekho-text hover:text-lekho-primary-light transition-colors">
                            {c.profiles.full_name || c.profiles.username}
                          </Link>
                          <p className="text-[13px] text-lekho-text/80 font-bengali mt-0.5">{c.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-lekho-muted py-2">No comments yet. Be the first!</p>
                  )}
                </div>

                {authUser ? (
                  <form onSubmit={handlePostComment} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-full px-5 py-2.5 text-sm text-lekho-text placeholder-lekho-muted focus:outline-none focus:ring-2 focus:ring-lekho-primary/30 focus:border-lekho-primary/40 transition-all font-bengali"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="p-2.5 bg-gradient-lekho text-white rounded-full hover:opacity-90 transition-all disabled:opacity-40"
                    >
                      {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                ) : (
                  <p className="text-center text-sm text-lekho-muted">Please login to comment.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="text-lekho-muted hover:text-lekho-text p-1.5 rounded-full hover:bg-white/[0.06] transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showOptions && authUser?.id === post.user_id && (
            <div className="absolute right-0 mt-1 w-44 glass rounded-2xl shadow-card py-1.5 z-50 animate-scale-in">
              <button
                onClick={() => { setShowOptions(false); setIsEditModalOpen(true); }}
                className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-lekho-text hover:bg-white/[0.06] transition-colors"
              >
                Edit post
              </button>
              <button
                onClick={handleDeletePost}
                className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                Delete post
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          post={post}
          onUpdate={(updated) => { if (onUpdate) onUpdate(updated); }}
        />
      )}
    </article>
  );
};

export default PostCard;
