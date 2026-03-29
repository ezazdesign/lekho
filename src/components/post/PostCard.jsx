import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import DriveLinkCard from '../shared/DriveLinkCard';

const PostCard = ({ post }) => {
  if (!post || !post.profiles) return null;

  return (
    <article className="border-b border-gray-100 p-6 sm:p-8 bg-white hover:bg-gray-50/50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 overflow-hidden shrink-0">
            {post.profiles.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="Author" className="w-full h-full object-cover" />
            ) : (
              post.profiles.username?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-[15px]">{post.profiles.full_name || post.profiles.username}</h3>
              <span className="text-gray-500 text-[15px]">@{post.profiles.username}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 text-sm">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <div className="mt-2 text-[16px] leading-relaxed text-gray-900 font-bengali whitespace-pre-wrap">
              {post.content}
            </div>

            {/* Images Render (Max 4 for grid) */}
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

            {/* Drive Link Detection Render */}
            {post.drive_link && (
              <DriveLinkCard url={post.drive_link} />
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-8 mt-6">
              <button className="flex items-center gap-2 group text-gray-500 hover:text-rose-600 transition-colors">
                <div className="p-2 rounded-full group-hover:bg-rose-50 transition-colors">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Like</span>
              </button>
              
              <button className="flex items-center gap-2 group text-gray-500 hover:text-blue-600 transition-colors">
                <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Comment</span>
              </button>
            </div>
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
