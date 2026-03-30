import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import CreatePost from '../components/post/CreatePost';
import PostCard from '../components/post/PostCard';
import { Loader2, Feather } from 'lucide-react';

const HomeFeed = () => {
  const queryClient = useQueryClient();
  const { data: posts, isPending, isError, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      // 15s timeout for the fetch
      const fetchPromise = supabase
        .from('posts')
        .select('*, profiles (id, username, full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network request timed out')), 15000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (error) throw error;
      return data;
    },
    retry: 1, // Retry once automatically
  });

  return (
    <div className="w-full">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-lekho-surface/80 backdrop-blur-xl border-b border-white/[0.06] px-5 py-4 md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-lekho flex items-center justify-center shadow-glow-purple">
            <Feather className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold font-bengali gradient-text tracking-tight">লেখো</h1>
        </div>
      </div>

      <CreatePost />

      <div>
        {isPending && (
          <div className="p-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-lekho-soft flex items-center justify-center animate-pulse">
              <Loader2 className="w-6 h-6 animate-spin text-lekho-primary-light" />
            </div>
            <p className="text-sm text-lekho-muted animate-pulse">Loading your feed...</p>
          </div>
        )}

        {isError && (
          <div className="p-16 text-center">
             <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
               <span className="text-2xl">⚠️</span>
             </div>
             <h3 className="text-lekho-text font-bold text-lg mb-2">Something went wrong</h3>
             <p className="text-lekho-muted text-sm mb-6 px-10">Failed to load the feed. Your connection might be slow or unstable.</p>
             <button 
               onClick={() => refetch()}
               className="px-8 py-2.5 bg-gradient-lekho text-white font-bold rounded-full shadow-glow-purple hover:opacity-90 transition-all"
             >
               Retry Now
             </button>
          </div>
        )}

        {posts?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
          />
        ))}

        {posts?.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-lekho-primary/10 border border-lekho-primary/20 flex items-center justify-center mx-auto mb-4">
              <Feather className="w-8 h-8 text-lekho-primary/60" />
            </div>
            <h3 className="text-lekho-text font-bold text-lg mb-2">The feed is empty</h3>
            <p className="text-lekho-muted text-sm">Be the first to break the silence!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeFeed;
