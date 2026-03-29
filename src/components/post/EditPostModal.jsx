import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Image, Link2, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { parseDriveLink } from '../../lib/utils';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic'],
    [{ 'list': 'bullet' }, { 'list': 'ordered'}],
    ['blockquote'],
    [{ 'align': [] }],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header', 'bold', 'italic', 'list', 'bullet', 'blockquote', 'align', 'link'
];

const EditPostModal = ({ isOpen, onClose, post, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  // Existing state from the post
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]); // new files
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [rtContent, setRtContent] = useState("");

  const { register, handleSubmit, setValue, watch } = useForm();
  const driveLinkVal = watch('drive_link');

  useEffect(() => {
    if (post) {
      setRtContent(post.content || "");
      setExistingImages(post.image_urls || []);
      if (post.drive_link) {
        setShowDriveInput(true);
        setValue("drive_link", post.drive_link);
      }
    }
  }, [post, setValue]);

  if (!isOpen || !post) return null;

  const onImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (existingImages.length + selectedImages.length + e.target.files.length > 4) {
        toast.error("You can only have up to 4 images max.");
        return;
      }
      setSelectedImages([...selectedImages, ...Array.from(e.target.files)]);
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const isContentEmpty = !rtContent || rtContent === '<p><br></p>' || String(rtContent).trim() === '';

  const onSubmit = async (data) => {
    if (isContentEmpty && existingImages.length === 0 && selectedImages.length === 0 && !data.drive_link) {
      toast.error("Can't save an empty post.");
      return;
    }

    setLoading(true);
    let finalImageUrls = [...existingImages];

    try {
      if (selectedImages.length > 0) {
        toast.loading("Uploading new images...", { id: "upload" });
        for (const file of selectedImages) {
          const url = await uploadToCloudinary(file);
          finalImageUrls.push(url);
        }
        toast.dismiss("upload");
      }

      let finalDriveLink = data.drive_link;
      if (!finalDriveLink && !isContentEmpty) {
         finalDriveLink = parseDriveLink(rtContent);
      } else if (finalDriveLink) {
         const parsed = parseDriveLink(finalDriveLink);
         if (!parsed) {
           toast.error("Invalid Google Drive Link format.");
           setLoading(false);
           return;
         }
         finalDriveLink = parsed;
      }

      const updatedRecord = {
        content: isContentEmpty ? null : rtContent,
        image_urls: finalImageUrls,
        drive_link: finalDriveLink || null
      };

      const { data: updatedPost, error } = await supabase
        .from('posts')
        .update(updatedRecord)
        .eq('id', post.id)
        .select(`*, profiles:user_id (id, username, full_name, avatar_url)`)
        .single();

      if (error) throw error;

      toast.success("Post updated successfully!");
      if (onUpdate) onUpdate(updatedPost);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update post.");
      toast.dismiss("upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold font-bengali text-gray-900">Edit Post</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 bg-gray-50 rounded-full hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="mb-4 editor-container">
            <ReactQuill 
              theme="snow" 
              value={rtContent} 
              onChange={setRtContent} 
              modules={modules}
              formats={formats}
              placeholder="Edit your post..."
              className="w-full text-lg outline-none font-bengali text-gray-900"
            />
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            .editor-container .ql-container.ql-snow { border: none; font-family: inherit; font-size: 1.125rem; min-height: 120px; }
            .editor-container .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid #f3f4f6; padding-left: 0; padding-right: 0; margin-bottom: 0.5rem; }
            .editor-container .ql-editor { padding: 0; padding-top: 8px; font-family: '"Hind Siliguri"', sans-serif; }
          `}} />

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4 mb-4 opacity-90">
              {existingImages.map((url, i) => (
                <div key={'old-'+i} className="relative group">
                  <img src={url} alt="Old preview" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
                  <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-2 right-2 bg-gray-900/60 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}

          {/* New Images */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
              {selectedImages.map((file, i) => (
                <div key={'new-'+i} className="relative group">
                  <img src={URL.createObjectURL(file)} alt="New preview" className="w-full h-32 object-cover rounded-xl border border-gray-200 ring-2 ring-blue-500" />
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute top-2 right-2 bg-gray-900/60 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}

          {/* Drive Link Input */}
          {showDriveInput && (
            <div className="mt-4 mb-4 relative">
              <Link2 className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                {...register("drive_link")}
                type="text"
                placeholder="Paste Google Drive URL here..."
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm"
              />
              <button 
                type="button" 
                onClick={() => { setShowDriveInput(false); setValue("drive_link", ""); }}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-4">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors relative group">
                <Image className="w-[20px] h-[20px]" />
                <input type="file" multiple accept="image/*" className="hidden" onChange={onImageChange} />
              </label>
              <button 
                type="button"
                onClick={() => setShowDriveInput(!showDriveInput)}
                className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors relative group"
              >
                <Link2 className="w-[20px] h-[20px]" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (isContentEmpty && existingImages.length === 0 && selectedImages.length === 0 && !driveLinkVal)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 p-2.5 rounded-full font-semibold transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
