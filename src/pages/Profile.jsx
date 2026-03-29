import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Link as LinkIcon, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import PostCard from '../components/post/PostCard';
import EditProfileModal from '../components/profile/EditProfileModal';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile } = useAuthStore();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');

  const isOwnProfile = !username || (authProfile && authProfile.username === username);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      let targetProfile = null;

      if (isOwnProfile) {
        targetProfile = authProfile;
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
             // User not found
             navigate('/');
             return;
          }
          throw error;
        }
        targetProfile = data;
      }

      setProfile(targetProfile);

      if (targetProfile) {
        // Fetch User Posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (id, username, full_name, avatar_url)
          `)
          .eq('user_id', targetProfile.id)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser === undefined) return; // Wait until init
    fetchProfileData();
  }, [username, authUser, authProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="bg-white min-h-screen border-r border-gray-100 pb-20 sm:pb-0">
      {/* Cover Image */}
      <div className="h-48 sm:h-64 w-full bg-slate-900 overflow-hidden relative group">
        {profile.cover_url ? (
          <img 
            src={profile.cover_url} 
            alt="Cover" 
            className="w-full h-full object-cover opacity-90"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900" />
        )}
      </div>

      <div className="px-6 sm:px-8 max-w-4xl mx-auto">
        {/* Profile Header section */}
        <div className="relative flex justify-between items-end -mt-16 sm:-mt-20 mb-6">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] border-4 border-white bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-5xl overflow-hidden shadow-sm shrink-0 relative z-10">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              profile.username?.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="flex gap-3 mb-4 sm:mb-6">
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-2.5 rounded-full font-semibold transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-full font-semibold transition-colors">
                  Message
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-semibold transition-colors">
                  Follow
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-bengali">{profile.full_name || profile.username}</h1>
          <p className="text-gray-500 text-lg">@{profile.username}</p>
          
          <div className="mt-4 max-w-2xl">
            <p className="text-gray-800 text-lg leading-relaxed font-bengali whitespace-pre-wrap">
              {profile.bio || (isOwnProfile ? "Add a bio to tell people about yourself..." : "No bio provided.")}
            </p>
          </div>

          <div className="flex flex-wrap text-gray-500 mt-4 gap-y-2 gap-x-6 text-sm">
            <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer">
              <LinkIcon className="w-4 h-4" />
              <span>{isOwnProfile ? 'lexo.app/' + profile.username : 'lexo.app/' + profile.username}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
            </div>
          </div>

          <div className="flex gap-6 mt-6">
            <div className="hover:underline cursor-pointer group rounded-lg transition-colors py-1">
              <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">0</span> <span className="text-gray-500">Following</span>
            </div>
            <div className="hover:underline cursor-pointer group rounded-lg transition-colors py-1">
              <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">0</span> <span className="text-gray-500">Followers</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 flex gap-8">
          {['Posts', 'Media', 'Liked', 'Articles'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-base font-medium transition-colors relative ${
                activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'Posts' && (
            <div className="space-y-0">
              {posts.length > 0 ? (
                posts.map(post => (
                    <div className="-mx-6 sm:-mx-8">
                  <PostCard key={post.id} post={post} />
                    </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                    <span className="text-4xl text-gray-300">📝</span>
                  </div>
                  <p className="text-lg">No posts yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'Posts' && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Nothing to show here yet.</p>
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
