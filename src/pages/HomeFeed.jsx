import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import CreatePost from '../components/post/CreatePost';
import PostCard from '../components/post/PostCard';
import { Loader2, Feather } from 'lucide-react';

const HomeFeed = () => {
  const queryClient = useQueryClient();
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles (id, username, full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
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
        {isLoading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-lekho-soft flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-lekho-primary-light" />
            </div>
            <p className="text-sm text-lekho-muted">Loading your feed...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-rose-400 text-sm">Failed to load feed. Please try again.</p>
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
