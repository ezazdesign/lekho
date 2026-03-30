import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Users, FileText, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import PostCard from '../components/post/PostCard';

const Search = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) { setUsers([]); setPosts([]); return; }
    const performSearch = async () => {
      setLoading(true);
      try {
        if (activeTab === 'users') {
          const { data, error } = await supabase.from('profiles').select('*').or(`username.ilike.%${debouncedQuery}%,full_name.ilike.%${debouncedQuery}%`).limit(20);
          if (error) throw error;
          setUsers(data || []);
        } else {
          const { data, error } = await supabase.from('posts').select('*, profiles:user_id(id, full_name, username, avatar_url)').ilike('content', `%${debouncedQuery}%`).order('created_at', { ascending: false }).limit(20);
          if (error) throw error;
          setPosts(data || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [debouncedQuery, activeTab]);

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-lekho-base">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-lekho-surface/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="p-4 px-5 md:px-6">
          <h1 className="text-2xl font-bold text-lekho-text mb-4 tracking-tight">Search</h1>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className={`h-5 w-5 transition-colors ${loading ? 'text-lekho-primary-light' : 'text-lekho-muted group-focus-within:text-lekho-primary-light'}`} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-[14px] text-lekho-text placeholder-lekho-muted focus:ring-2 focus:ring-lekho-primary/30 focus:border-lekho-primary/50 focus:bg-white/[0.08] transition-all outline-none font-bengali"
              placeholder="Search people or posts..."
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Loader2 className="h-4 w-4 text-lekho-primary-light animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-white/[0.06] px-2">
          {[
            { key: 'users', label: 'People', icon: Users },
            { key: 'posts', label: 'Posts', icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3.5 text-[14px] font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === key
                  ? 'border-lekho-primary text-lekho-primary-light'
                  : 'border-transparent text-lekho-muted hover:text-lekho-text hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {!debouncedQuery ? (
          <div className="flex flex-col items-center justify-center h-[55vh] text-center px-4">
            <div className="w-16 h-16 bg-gradient-lekho-soft border border-lekho-primary/20 rounded-2xl flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-lekho-primary-light" />
            </div>
            <h3 className="text-xl font-bold text-lekho-text mb-2">Discover Lekho</h3>
            <p className="text-lekho-muted font-bengali text-[14px] max-w-xs">
              Type a name, username, or any word to find people and stories.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'users' && (
              <div>
                {users.length > 0 ? users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-4 p-4 px-5 hover:bg-white/[0.03] transition-colors border-b border-white/[0.05]"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-lekho-soft flex items-center justify-center font-bold text-lekho-primary-light text-lg overflow-hidden shrink-0 ring-2 ring-lekho-primary/20">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lekho-text text-[15px] leading-tight">{user.full_name || user.username}</h3>
                      <p className="text-[13px] text-lekho-muted mt-0.5">@{user.username}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs font-semibold text-lekho-primary-light bg-lekho-primary/10 border border-lekho-primary/20 px-3 py-1 rounded-full">
                        View
                      </span>
                    </div>
                  </Link>
                )) : !loading && (
                  <div className="p-12 text-center">
                    <p className="text-lekho-muted font-bengali">No users found for "{debouncedQuery}"</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div>
                {posts.length > 0 ? posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDelete={(id) => setPosts((p) => p.filter((x) => x.id !== id))}
                    onUpdate={(updated) => setPosts((p) => p.map((x) => x.id === updated.id ? { ...x, ...updated } : x))}
                  />
                )) : !loading && (
                  <div className="p-12 text-center">
                    <p className="text-lekho-muted font-bengali">No posts found for "{debouncedQuery}"</p>
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
