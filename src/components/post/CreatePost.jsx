import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Image, Link2, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useAuthStore } from '../../store/useAuthStore';
import { parseDriveLink } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { withTimeout } from '../../lib/apiUtils';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic'],
    [{ list: 'bullet' }, { list: 'ordered' }],
    ['blockquote'],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};

const formats = ['header', 'bold', 'italic', 'list', 'bullet', 'blockquote', 'align', 'link'];

const CreatePost = () => {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [rtContent, setRtContent] = useState('');

  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const driveLinkVal = watch('drive_link');

  const onImageChange = (e) => {
    if (e.target.files?.length > 0) {
      if (selectedImages.length + e.target.files.length > 4) {
        toast.error('You can only upload up to 4 images.');
        return;
      }
      setSelectedImages([...selectedImages, ...Array.from(e.target.files)]);
    }
  };

  const removeImage = (index) => setSelectedImages(selectedImages.filter((_, i) => i !== index));

  const isContentEmpty = !rtContent || rtContent === '<p><br></p>' || String(rtContent).trim() === '';

  const onSubmit = async (data) => {
    if (isContentEmpty && selectedImages.length === 0 && !data.drive_link) {
      toast.error("Can't publish an empty post.");
      return;
    }

    setLoading(true);
    let imageUrls = [];

    try {
      if (selectedImages.length > 0) {
        toast.loading('Uploading images...', { id: 'upload' });
        // Wrap entire upload loop as a task
        const uploadTask = (async () => {
          const urls = [];
          for (const file of selectedImages) {
            urls.push(await uploadToCloudinary(file));
          }
          return urls;
        })();
        
        imageUrls = await withTimeout(uploadTask, 60000, 'Image upload timed out. Check your connection.');
        toast.dismiss('upload');
      }

      let finalDriveLink = data.drive_link;
      if (!finalDriveLink && !isContentEmpty) {
        finalDriveLink = parseDriveLink(rtContent);
      } else if (finalDriveLink) {
        const parsed = parseDriveLink(finalDriveLink);
        if (!parsed) { toast.error('Invalid Google Drive Link.'); setLoading(false); return; }
        finalDriveLink = parsed;
      }

      // Add 30s timeout to Supabase insert
      const insertTask = supabase.from('posts').insert([{
        user_id: user.id,
        content: isContentEmpty ? null : rtContent,
        image_urls: imageUrls,
        drive_link: finalDriveLink || null,
      }]);

      const { error } = await withTimeout(insertTask, 30000, 'Publishing timed out. Please try again.');

      if (error) throw error;

      toast.success('Post published! ✨');
      reset();
      setRtContent('');
      setSelectedImages([]);
      setShowDriveInput(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create post.');
      toast.dismiss('upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-white/[0.06] bg-lekho-surface/60 sm:px-8 sm:py-6 p-4">
      {/* Header Row with Avatar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-gradient-lekho-soft flex items-center justify-center text-lekho-primary-light font-bold overflow-hidden shrink-0 ring-2 ring-lekho-primary/25">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="You" className="w-full h-full object-cover" />
          ) : (
            profile?.username?.charAt(0).toUpperCase()
          )}
        </div>
        <h2 className="text-[15px] font-bold text-lekho-text">Create Post</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Rich Text Editor */}
        <div className="mb-4 editor-container">
          <ReactQuill
            theme="snow"
            value={rtContent}
            onChange={setRtContent}
            modules={modules}
            formats={formats}
            placeholder="What's on your mind? Write your thoughts..."
            className="w-full text-lg outline-none font-bengali"
          />
        </div>

        {/* Image Previews */}
        {selectedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
            {selectedImages.map((file, i) => (
              <div key={i} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl border border-white/[0.08]"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drive Link Input */}
        {showDriveInput && (
          <div className="mt-4 mb-4 relative">
            <Link2 className="absolute left-3 top-3.5 w-5 h-5 text-lekho-muted" />
            <input
              {...register('drive_link')}
              type="text"
              placeholder="Paste Google Drive URL..."
              className="w-full pl-10 pr-10 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-lekho-primary/30 focus:border-lekho-primary/50 transition-all text-sm text-lekho-text placeholder-lekho-muted"
            />
            <button
              type="button"
              onClick={() => { setShowDriveInput(false); setValue('drive_link', ''); }}
              className="absolute right-3 top-3.5 text-lekho-muted hover:text-lekho-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 mt-2">
          <div className="flex items-center gap-1">
            <label className="cursor-pointer p-2.5 text-lekho-muted hover:text-lekho-primary-light hover:bg-lekho-primary/10 rounded-xl transition-all relative group">
              <Image className="w-5 h-5" />
              <input type="file" multiple accept="image/*" className="hidden" onChange={onImageChange} />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-lekho-elevated border border-white/10 text-lekho-text text-[10px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Add Images
              </span>
            </label>
            <button
              type="button"
              onClick={() => setShowDriveInput(!showDriveInput)}
              className="p-2.5 text-lekho-muted hover:text-lekho-primary-light hover:bg-lekho-primary/10 rounded-xl transition-all relative group"
            >
              <Link2 className="w-5 h-5" />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-lekho-elevated border border-white/10 text-lekho-text text-[10px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Drive Link
              </span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || (isContentEmpty && selectedImages.length === 0 && !driveLinkVal)}
            className="flex items-center gap-2 bg-gradient-lekho hover:opacity-90 text-white px-6 py-2.5 rounded-2xl font-bold transition-all shadow-glow-purple disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Publish
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
