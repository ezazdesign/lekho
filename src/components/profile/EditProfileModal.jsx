import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Camera, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useAuthStore } from '../../store/useAuthStore';

const EditProfileModal = ({ isOpen, onClose, currentProfile, onUpdate }) => {
  const { user, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentProfile?.avatar_url || null);
  
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(currentProfile?.cover_url || null);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: currentProfile?.full_name || '',
      bio: currentProfile?.bio || '',
    }
  });

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let finalAvatarUrl = currentProfile?.avatar_url;
      let finalCoverUrl = currentProfile?.cover_url;

      if (avatarFile) {
        toast.loading("Uploading profile picture...", { id: "upload_avatar" });
        finalAvatarUrl = await uploadToCloudinary(avatarFile);
        toast.success("Profile picture uploaded!", { id: "upload_avatar" });
      }

      if (coverFile) {
        toast.loading("Uploading cover photo...", { id: "upload_cover" });
        finalCoverUrl = await uploadToCloudinary(coverFile);
        toast.success("Cover photo uploaded!", { id: "upload_cover" });
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          bio: data.bio,
          avatar_url: finalAvatarUrl,
          cover_url: finalCoverUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      await fetchProfile(user.id); // Refresh global store
      if (onUpdate) onUpdate(); // Refresh local profile page data
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update profile");
      toast.dismiss("upload_avatar");
      toast.dismiss("upload_cover");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold font-bengali">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
          {/* Cover Photo Upload */}
          <div className="relative h-32 sm:h-40 bg-gray-100 rounded-xl overflow-hidden group">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-gray-200" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition-colors text-white">
                <Camera className="w-6 h-6" />
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </label>
            </div>
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
              Cover Photo
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="relative -mt-16 ml-4 w-24 h-24 rounded-2xl border-4 border-white bg-gray-100 overflow-hidden shadow-sm group z-10">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold text-2xl">
                {currentProfile?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition-colors text-white">
                <Camera className="w-5 h-5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                {...register('full_name')}
                type="text" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm font-bengali"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea 
                {...register('bio')}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm resize-none h-24 font-bengali"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-full font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
