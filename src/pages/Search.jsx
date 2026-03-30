import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Users, FileText, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import PostCard from '../components/post/PostCard';

const Search = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'posts'
  
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce the typed query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch Logic based on tab and debouncedQuery
  useEffect(() => {
    if (!debouncedQuery) {
      setUsers([]);
      setPosts([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      
      try {
        if (activeTab === 'users') {
          // Search Profiles
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.%${debouncedQuery}%,full_name.ilike.%${debouncedQuery}%`)
            .limit(20);
            
          if (error) throw error;
          setUsers(data || []);
        } 
        else if (activeTab === 'posts') {
          // Search Posts and include author info
          const { data, error } = await supabase
            .from('posts')
            .select(`
              *,
              profiles:user_id(id, full_name, username, avatar_url)
            `)
            .ilike('content', `%${debouncedQuery}%`)
            .order('created_at', { ascending: false })
            .limit(20);
            
          if (error) throw error;
          setPosts(data || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
    
  }, [debouncedQuery, activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header & Sticky Search Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 pt-safe font-bengali">
        <div className="p-4 px-6 md:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Search</h1>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-bengali text-gray-900 placeholder-gray-400 font-medium"
              placeholder="Search for people or posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100 px-4 mt-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3.5 text-[15px] font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
            }`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3.5 text-[15px] font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'posts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Posts
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {!debouncedQuery ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100/50">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Find what you're looking for</h3>
            <p className="text-gray-500 font-bengali text-[15px] max-w-sm">Type a name, username, or any word to discover new people and stories.</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {activeTab === 'users' && (
              <div className="divide-y divide-gray-100 bg-white border-y border-gray-100 mt-2">
                {users.length > 0 ? (
                  users.map(user => (
                    <Link 
                      key={user.id} 
                      to={`/profile/${user.username}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xl overflow-hidden shrink-0 border border-gray-100">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          user.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-[16px] leading-tight">{user.full_name || user.username}</h3>
                        <p className="text-[14px] text-gray-500 mt-0.5">@{user.username}</p>
                      </div>
                    </Link>
                  ))
                ) : !loading && (
                    <div className="p-10 text-center text-gray-500 font-bengali">
                      No users found matching "{debouncedQuery}"
                    </div>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="bg-gray-50">
                {posts.length > 0 ? (
                  posts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                      onUpdate={(updatedPost) => setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p))}
                    />
                  ))
                ) : !loading && (
                    <div className="p-10 text-center text-gray-500 bg-white border-y border-gray-100 mt-2 font-bengali">
                      No posts found containing "{debouncedQuery}"
                    </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
