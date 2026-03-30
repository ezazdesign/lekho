import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Link as LinkIcon, Calendar, Loader2, MessageCircle, UserPlus, UserCheck, LogOut, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import PostCard from '../components/post/PostCard';
import EditProfileModal from '../components/profile/EditProfileModal';
import { toast } from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────
   Follow List Modal (Following / Followers)
───────────────────────────────────────────────────────── */
const FollowListModal = ({ type, profileId, authUserId, onClose }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        if (type === 'following') {
          // people this profile follows
          const { data, error } = await supabase
            .from('follows')
            .select('following_id, profiles:following_id(id, username, full_name, avatar_url)')
            .eq('follower_id', profileId);
          if (error) throw error;
          setList(data?.map((r) => r.profiles) || []);
        } else {
          // people who follow this profile
          const { data, error } = await supabase
            .from('follows')
            .select('follower_id, profiles:follower_id(id, username, full_name, avatar_url)')
            .eq('following_id', profileId);
          if (error) throw error;
          setList(data?.map((r) => r.profiles) || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [type, profileId]);

  const handleUnfollow = async (targetId) => {
    setUnfollowingId(targetId);
    try {
      await supabase.from('follows').delete().eq('follower_id', authUserId).eq('following_id', targetId);
      setList((prev) => prev.filter((p) => p.id !== targetId));
      toast.success('Unfollowed!');
    } catch {
      toast.error('Failed to unfollow.');
    } finally {
      setUnfollowingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="glass-elevated w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[75vh] sm:max-h-[80vh] flex flex-col shadow-card animate-slide-up sm:animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.07] shrink-0">
          <h3 className="font-bold text-lekho-text text-lg capitalize">{type}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.08] rounded-full text-lekho-muted hover:text-lekho-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="w-6 h-6 animate-spin text-lekho-primary-light" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center p-12 text-lekho-muted">
              <p>No {type} yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {list.map((person) => (
                <div key={person.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                  {/* Avatar */}
                  <button
                    onClick={() => { onClose(); navigate(`/profile/${person.username}`); }}
                    className="shrink-0"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-lekho-soft flex items-center justify-center font-bold text-lekho-primary-light overflow-hidden ring-2 ring-lekho-primary/20 hover:ring-lekho-primary/50 transition-all">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt={person.username} className="w-full h-full object-cover" />
                      ) : (
                        person.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                  </button>

                  {/* Name */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => { onClose(); navigate(`/profile/${person.username}`); }}
                  >
                    <p className="font-bold text-lekho-text text-[14px] truncate">{person.full_name || person.username}</p>
                    <p className="text-lekho-muted text-[12px]">@{person.username}</p>
                  </div>

                  {/* Unfollow button — only in "following" and only for own profile */}
                  {type === 'following' && authUserId === profileId && (
                    <button
                      disabled={unfollowingId === person.id}
                      onClick={() => handleUnfollow(person.id)}
                      className="shrink-0 text-[12px] font-bold px-3.5 py-1.5 rounded-full border border-white/[0.12] text-lekho-muted hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                    >
                      {unfollowingId === person.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Unfollow'
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Profile Page
───────────────────────────────────────────────────────── */
const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile, signOut } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Modal: 'following' | 'followers' | null
  const [followModal, setFollowModal] = useState(null);

  const isOwnProfile = !username || (authProfile && authProfile.username === username);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      let targetProfile = null;
      if (isOwnProfile) {
        targetProfile = authProfile;
      } else {
        const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single();
        if (error) { if (error.code === 'PGRST116') { navigate('/'); return; } throw error; }
        targetProfile = data;
      }
      setProfile(targetProfile);
      if (targetProfile) {
        await fetchFollowStats(targetProfile.id);

        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*, profiles:user_id (id, username, full_name, avatar_url)')
          .eq('user_id', targetProfile.id)
          .order('created_at', { ascending: false });
        if (postsError) throw postsError;
        setPosts(postsData || []);

        // Fetch liked posts
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('posts:post_id(*, profiles:user_id(id, username, full_name, avatar_url))')
          .eq('user_id', targetProfile.id)
          .order('created_at', { ascending: false });
        if (likesError) throw likesError;
        setLikedPosts(likesData?.map((l) => l.posts).filter(Boolean) || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [username, authProfile, isOwnProfile]);

  const fetchFollowStats = async (targetId) => {
    try {
      const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetId);
      setFollowersCount(followers || 0);
      const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetId);
      setFollowingCount(following || 0);
      if (authUser && authUser.id !== targetId) {
        const { data: fd } = await supabase.from('follows').select('follower_id').eq('follower_id', authUser.id).eq('following_id', targetId).maybeSingle();
        setIsFollowing(!!fd);
        const { data: fbd } = await supabase.from('follows').select('follower_id').eq('follower_id', targetId).eq('following_id', authUser.id).maybeSingle();
        setIsFollowedBy(!!fbd);
      }
    } catch (error) { console.error('Error fetching follows', error); }
  };

  useEffect(() => {
    if (authUser === undefined) return;
    fetchProfileData();
  }, [fetchProfileData, authUser]);

  const handleFollowToggle = async () => {
    if (!authUser) { toast.error('Please login to follow users.'); return; }
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', authUser.id).eq('following_id', profile.id);
        setIsFollowing(false);
        setFollowersCount((p) => p - 1);
      } else {
        await supabase.from('follows').insert({ follower_id: authUser.id, following_id: profile.id });
        await supabase.from('notifications').insert({ user_id: profile.id, sender_id: authUser.id, type: 'follow' });
        setIsFollowing(true);
        setFollowersCount((p) => p + 1);
      }
    } catch { toast.error('Failed to update follow status.'); }
    finally { setIsFollowLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] bg-lekho-base">
        <Loader2 className="w-8 h-8 animate-spin text-lekho-primary-light" />
      </div>
    );
  }

  if (!profile) return null;

  const TABS = [
    { key: 'Posts', count: posts.length },
    { key: 'Liked', count: likedPosts.length },
    { key: 'Media', count: 0 },
  ];

  return (
    <div className="bg-lekho-base min-h-screen pb-20 md:pb-0">
      {/* Cover */}
      <div className="h-44 sm:h-56 w-full overflow-hidden relative">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover opacity-90" />
        ) : (
          <div
            className="w-full h-full bg-gradient-lekho"
            style={{ backgroundSize: '200% 200%', animation: 'gradientShift 8s ease infinite', opacity: 0.6 }}
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-lekho-base to-transparent" />
      </div>

      <div className="px-5 sm:px-8">
        {/* Profile Header Row */}
        <div className="relative flex justify-between items-end -mt-14 sm:-mt-16 mb-6 flex-wrap gap-4">
          {/* Avatar */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[1.75rem] border-4 border-lekho-base bg-gradient-lekho-soft flex items-center justify-center font-bold text-lekho-primary-light text-4xl overflow-hidden shadow-glow-purple shrink-0 relative z-10">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : profile.username?.charAt(0).toUpperCase()}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2 z-10 w-full sm:w-auto mt-3 sm:mt-0 sm:mb-4">
            {isOwnProfile ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 sm:flex-none bg-white/[0.08] hover:bg-white/[0.13] border border-white/[0.12] text-lekho-text px-5 py-2.5 rounded-full font-semibold text-sm transition-all"
                >
                  Edit Profile
                </button>
                <button
                  onClick={signOut}
                  title="Log out"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-white/[0.08] text-lekho-muted hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 font-semibold text-sm transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="sm:hidden">Log out</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                {isFollowing && isFollowedBy && (
                  <button
                    onClick={() => navigate(`/messages/${profile.username}`)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-lekho-primary/40 text-lekho-primary-light hover:bg-lekho-primary/10 px-5 py-2.5 rounded-full font-semibold text-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4" /> Message
                  </button>
                )}
                <button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-2.5 rounded-full font-bold text-sm transition-all disabled:opacity-60 ${
                    isFollowing
                      ? 'bg-white/[0.08] border border-white/[0.1] text-lekho-text hover:text-rose-400 hover:border-rose-500/30'
                      : 'bg-gradient-lekho text-white shadow-glow-purple hover:opacity-90'
                  }`}
                >
                  {isFollowLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    isFollowing
                      ? <><UserCheck className="w-4 h-4" /> Following</>
                      : <><UserPlus className="w-4 h-4" /> Follow</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-lekho-text font-bengali">{profile.full_name || profile.username}</h1>
          <p className="text-lekho-muted mt-0.5">@{profile.username}</p>
          <p className="text-lekho-text/75 leading-relaxed font-bengali mt-3 max-w-xl">
            {profile.bio || (isOwnProfile ? 'Add a bio to tell people about yourself...' : 'No bio provided.')}
          </p>
          <div className="flex flex-wrap text-lekho-muted mt-3 gap-y-2 gap-x-5 text-sm">
            <span className="flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />lekho.app/{profile.username}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
            </span>
          </div>

          {/* Follow Stats — CLICKABLE */}
          <div className="flex gap-6 mt-5">
            <button
              onClick={() => setFollowModal('following')}
              className="group text-left hover:text-lekho-primary-light transition-colors"
            >
              <span className="font-bold text-lekho-text text-lg group-hover:text-lekho-primary-light">{followingCount}</span>
              <span className="text-lekho-muted ml-1.5 text-sm group-hover:text-lekho-primary-light/70">Following</span>
            </button>
            <button
              onClick={() => setFollowModal('followers')}
              className="group text-left hover:text-lekho-primary-light transition-colors"
            >
              <span className="font-bold text-lekho-text text-lg group-hover:text-lekho-primary-light">{followersCount}</span>
              <span className="text-lekho-muted ml-1.5 text-sm group-hover:text-lekho-primary-light/70">Followers</span>
            </button>
            {isFollowedBy && !isOwnProfile && (
              <span className="flex items-center">
                <span className="bg-lekho-primary/15 text-lekho-primary-light text-xs font-bold px-2.5 py-1 rounded-lg border border-lekho-primary/25">
                  Follows you
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/[0.07] flex gap-6 -mx-5 sm:-mx-8 px-5 sm:px-8">
          {TABS.map(({ key, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-4 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
                activeTab === key ? 'text-lekho-primary-light' : 'text-lekho-muted hover:text-lekho-text'
              }`}
            >
              {key}
              {count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === key ? 'bg-lekho-primary/20 text-lekho-primary-light' : 'bg-white/[0.06] text-lekho-muted'
                }`}>{count}</span>
              )}
              {activeTab === key && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-lekho rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-1 -mx-5 sm:-mx-8">
          {/* Posts Tab */}
          {activeTab === 'Posts' && (
            posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={(id) => setPosts((p) => p.filter((x) => x.id !== id))}
                  onUpdate={(upd) => setPosts((p) => p.map((x) => x.id === upd.id ? { ...x, ...upd } : x))}
                />
              ))
            ) : (
              <EmptyState emoji="📝" message="No posts yet." />
            )
          )}

          {/* Liked Tab */}
          {activeTab === 'Liked' && (
            likedPosts.length > 0 ? (
              likedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={(id) => setLikedPosts((p) => p.filter((x) => x.id !== id))}
                  onUpdate={(upd) => setLikedPosts((p) => p.map((x) => x.id === upd.id ? { ...x, ...upd } : x))}
                />
              ))
            ) : (
              <EmptyState emoji="❤️" message="No liked posts yet." />
            )
          )}

          {/* Media Tab */}
          {activeTab === 'Media' && <EmptyState emoji="🖼️" message="No media posts yet." />}
        </div>
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentProfile={profile}
          onUpdate={fetchProfileData}
        />
      )}

      {followModal && (
        <FollowListModal
          type={followModal}
          profileId={profile.id}
          authUserId={authUser?.id}
          onClose={() => {
            setFollowModal(null);
            // Refresh follow counts after unfollow
            fetchFollowStats(profile.id);
          }}
        />
      )}
    </div>
  );
};

/* Small helper */
const EmptyState = ({ emoji, message }) => (
  <div className="text-center py-14 px-5">
    <div className="w-20 h-20 rounded-2xl bg-lekho-primary/10 border border-lekho-primary/20 flex items-center justify-center mx-auto mb-4">
      <span className="text-3xl">{emoji}</span>
    </div>
    <p className="text-lekho-muted text-sm">{message}</p>
  </div>
);

export default Profile;
