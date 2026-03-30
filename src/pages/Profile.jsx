import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Link as LinkIcon, Calendar, Loader2, MessageCircle, UserPlus, UserCheck, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import PostCard from '../components/post/PostCard';
import EditProfileModal from '../components/profile/EditProfileModal';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile, signOut } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const isOwnProfile = !username || (authProfile && authProfile.username === username);

  const fetchProfileData = async () => {
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
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*, profiles:user_id (id, username, full_name, avatar_url)')
          .eq('user_id', targetProfile.id)
          .order('created_at', { ascending: false });
        if (postsError) throw postsError;
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
  }, [username, authUser, authProfile]);

  const handleFollowToggle = async () => {
    if (!authUser) { toast.error('Please login to follow users.'); return; }
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', authUser.id).eq('following_id', profile.id);
        setIsFollowing(false);
        setFollowersCount(p => p - 1);
      } else {
        await supabase.from('follows').insert({ follower_id: authUser.id, following_id: profile.id });
        await supabase.from('notifications').insert({ user_id: profile.id, sender_id: authUser.id, type: 'follow' });
        setIsFollowing(true);
        setFollowersCount(p => p + 1);
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

  return (
    <div className="bg-lekho-base min-h-screen pb-20 sm:pb-0">
      {/* Cover Image */}
      <div className="h-44 sm:h-56 w-full overflow-hidden relative">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover opacity-90" />
        ) : (
          <div className="w-full h-full bg-gradient-lekho opacity-60" style={{ backgroundSize: '200% 200%', animation: 'gradientShift 8s ease infinite' }} />
        )}
        {/* Gradient overlay at bottom for smooth blend */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-lekho-base to-transparent" />
      </div>

      <div className="px-5 sm:px-8 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="relative flex justify-between items-end -mt-14 sm:-mt-16 mb-6 flex-wrap gap-4">
          {/* Avatar */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[1.75rem] border-4 border-lekho-base bg-gradient-lekho-soft flex items-center justify-center font-bold text-lekho-primary-light text-4xl overflow-hidden shadow-glow-purple shrink-0 relative z-10">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              profile.username?.charAt(0).toUpperCase()
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 sm:mb-4 z-10 w-full sm:w-auto mt-3 sm:mt-0">
            {isOwnProfile ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 sm:flex-none bg-white/[0.08] hover:bg-white/[0.13] border border-white/[0.12] text-lekho-text px-5 py-2.5 rounded-full font-semibold text-sm transition-all flex justify-center items-center"
                >
                  Edit Profile
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-white/[0.08] text-lekho-muted hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 font-semibold text-sm transition-all"
                  title="Log out"
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

        {/* Profile Info */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-lekho-text font-bengali">{profile.full_name || profile.username}</h1>
          <p className="text-lekho-muted mt-0.5">@{profile.username}</p>

          <div className="mt-3 max-w-2xl">
            <p className="text-lekho-text/80 leading-relaxed font-bengali">
              {profile.bio || (isOwnProfile ? 'Add a bio to tell people about yourself...' : 'No bio provided.')}
            </p>
          </div>

          <div className="flex flex-wrap text-lekho-muted mt-3 gap-y-2 gap-x-5 text-sm">
            <div className="flex items-center gap-1.5 hover:text-lekho-primary-light transition-colors cursor-pointer">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>lekho.app/{profile.username}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
            </div>
          </div>

          {/* Follow Stats */}
          <div className="flex gap-6 mt-5">
            <div className="cursor-pointer group">
              <span className="font-bold text-lekho-text text-lg group-hover:text-lekho-primary-light transition-colors">{followingCount}</span>
              <span className="text-lekho-muted ml-1.5 text-sm">Following</span>
            </div>
            <div className="cursor-pointer group">
              <span className="font-bold text-lekho-text text-lg group-hover:text-lekho-primary-light transition-colors">{followersCount}</span>
              <span className="text-lekho-muted ml-1.5 text-sm">Followers</span>
            </div>
            {isFollowedBy && !isOwnProfile && (
              <div className="flex items-center">
                <span className="bg-lekho-primary/15 text-lekho-primary-light text-xs font-bold px-2.5 py-1 rounded-lg border border-lekho-primary/25">
                  Follows you
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/[0.07] flex gap-6">
          {['Posts', 'Media', 'Liked', 'Articles'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-semibold transition-colors relative ${
                activeTab === tab ? 'text-lekho-primary-light' : 'text-lekho-muted hover:text-lekho-text'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-lekho rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'Posts' && (
            <div>
              {posts.length > 0 ? (
                posts.map(post => (
                  <div key={post.id} className="-mx-5 sm:-mx-8">
                    <PostCard
                      post={post}
                      onDelete={(deletedId) => setPosts(p => p.filter(x => x.id !== deletedId))}
                      onUpdate={(updated) => setPosts(p => p.map(x => x.id === updated.id ? updated : x))}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-14">
                  <div className="w-20 h-20 rounded-2xl bg-lekho-primary/10 border border-lekho-primary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📝</span>
                  </div>
                  <p className="text-lekho-muted">No posts yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'Posts' && (
            <div className="text-center py-14">
              <p className="text-lekho-muted">Nothing to show here yet.</p>
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentProfile={profile}
          onUpdate={fetchProfileData}
        />
      )}
    </div>
  );
};

export default Profile;
