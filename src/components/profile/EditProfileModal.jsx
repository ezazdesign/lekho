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
    },
  });

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let finalAvatarUrl = currentProfile?.avatar_url;
      let finalCoverUrl = currentProfile?.cover_url;

      if (avatarFile) {
        toast.loading('Uploading profile picture...', { id: 'upload_avatar' });
        finalAvatarUrl = await uploadToCloudinary(avatarFile);
        toast.success('Profile picture uploaded!', { id: 'upload_avatar' });
      }
      if (coverFile) {
        toast.loading('Uploading cover photo...', { id: 'upload_cover' });
        finalCoverUrl = await uploadToCloudinary(coverFile);
        toast.success('Cover photo uploaded!', { id: 'upload_cover' });
      }

      const { error } = await supabase.from('profiles').update({
        full_name: data.full_name,
        bio: data.bio,
        avatar_url: finalAvatarUrl,
        cover_url: finalCoverUrl,
      }).eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated! ✨');
      await fetchProfile(user.id);
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to update profile');
      toast.dismiss('upload_avatar');
      toast.dismiss('upload_cover');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-elevated rounded-3xl w-full max-w-lg overflow-hidden shadow-card max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Modal Header */}
        <div className="sticky top-0 bg-lekho-elevated/80 backdrop-blur-xl z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2 className="text-lg font-bold text-lekho-text font-bengali">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.08] rounded-full transition-colors text-lekho-muted hover:text-lekho-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Cover Photo */}
          <div className="relative h-32 sm:h-40 rounded-2xl overflow-hidden group border border-white/[0.08]">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-lekho opacity-40" />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-white/15 hover:bg-white/25 p-2.5 rounded-full backdrop-blur-sm transition-colors text-white">
                <Camera className="w-5 h-5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </label>
            </div>
            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm uppercase tracking-wider">
              Cover Photo
            </div>
          </div>

          {/* Avatar */}
          <div className="relative -mt-14 ml-4 w-20 h-20 rounded-2xl border-4 border-lekho-elevated bg-gradient-lekho-soft overflow-hidden shadow-glow-purple group z-10 flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lekho-primary-light font-bold text-2xl">
                {currentProfile?.username?.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-white/15 hover:bg-white/25 p-2 rounded-full backdrop-blur-sm text-white">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-lekho-muted mb-1.5 uppercase tracking-wider">Full Name</label>
              <input
                {...register('full_name')}
                type="text"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[14px] text-lekho-text placeholder-lekho-muted focus:outline-none focus:ring-2 focus:ring-lekho-primary/30 focus:border-lekho-primary/50 transition-all font-bengali"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-lekho-muted mb-1.5 uppercase tracking-wider">Bio</label>
              <textarea
                {...register('bio')}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[14px] text-lekho-text placeholder-lekho-muted focus:outline-none focus:ring-2 focus:ring-lekho-primary/30 focus:border-lekho-primary/50 transition-all resize-none h-24 font-bengali"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end gap-3 border-t border-white/[0.07]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full font-semibold text-sm text-lekho-muted hover:bg-white/[0.06] hover:text-lekho-text transition-all border border-white/[0.07]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm bg-gradient-lekho text-white hover:opacity-90 transition-all shadow-glow-purple disabled:opacity-50"
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
