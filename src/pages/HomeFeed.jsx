import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import CreatePost from '../components/post/CreatePost';
import PostCard from '../components/post/PostCard';
import { Loader2 } from 'lucide-react';
import logo from '../assets/logo.png';

const HomeFeed = () => {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 md:hidden">
        <h1 className="text-xl font-bold font-bengali text-gray-900 tracking-tight flex items-center gap-2">
          <img src={logo} alt="Lekho Logo" className="h-7 w-auto object-contain drop-shadow-sm" />
          লেখো
        </h1>
      </div>
      
      <CreatePost />
      
      <div className="divide-y divide-gray-100">
        {isLoading && (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
        
        {error && (
          <div className="p-8 text-center text-red-500">
            Failed to load feed. Please try again.
          </div>
        )}

        {posts?.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        
        {posts?.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No posts yet. Be the first to break the silence!
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeFeed;
