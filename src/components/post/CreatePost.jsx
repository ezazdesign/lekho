import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Image, Link2, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useAuthStore } from '../../store/useAuthStore';
import { parseDriveLink } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

// Rich Text Editor Imports
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Customize the Toolbar specifically matching the user's screenshot
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic'],
    [{ 'list': 'bullet' }, { 'list': 'ordered'}],
    ['blockquote'],
    [{ 'align': [] }],
    ['link'],
    ['clean'] // format remover
  ],
};

const formats = [
  'header',
  'bold', 'italic',
  'list', 'bullet',
  'blockquote',
  'align',
  'link'
];

const CreatePost = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [showDriveInput, setShowDriveInput] = useState(false);
  
  // Rich Text Editor state
  const [rtContent, setRtContent] = useState("");

  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const driveLinkVal = watch('drive_link');

  const onImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (selectedImages.length + e.target.files.length > 4) {
        toast.error("You can only upload up to 4 images.");
        return;
      }
      setSelectedImages([...selectedImages, ...Array.from(e.target.files)]);
    }
  };

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

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
        toast.loading("Uploading images...", { id: "upload" });
        for (const file of selectedImages) {
          const url = await uploadToCloudinary(file);
          imageUrls.push(url);
        }
        toast.dismiss("upload");
      }

      // Check if user pasted a drive link in the content directly
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

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          content: isContentEmpty ? null : rtContent,
          image_urls: imageUrls,
          drive_link: finalDriveLink || null
        }
      ]);

      if (error) throw error;

      toast.success("Post published successfully!");
      reset();
      setRtContent(""); // Reset editor
      setSelectedImages([]);
      setShowDriveInput(false);
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create post.");
      toast.dismiss("upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-gray-100 bg-white sm:px-8 sm:py-6 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Create Post</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        
        {/* Rich Text Editor customized wrapping */}
        <div className="mb-4 editor-container">
          <ReactQuill 
            theme="snow" 
            value={rtContent} 
            onChange={setRtContent} 
            modules={modules}
            formats={formats}
            placeholder="What's on your mind? Write your thoughts..."
            className="w-full text-lg outline-none font-bengali text-gray-900"
          />
        </div>

        {/* Global style overrides for ReactQuill to match Tailwind look */}
        <style dangerouslySetInnerHTML={{__html: `
          .editor-container .ql-container.ql-snow {
             border: none;
             font-family: inherit;
             font-size: 1.125rem;
             min-height: 120px;
          }
          .editor-container .ql-toolbar.ql-snow {
             border: none;
             border-bottom: 1px solid #f3f4f6;
             padding-left: 0;
             padding-right: 0;
             margin-bottom: 0.5rem;
          }
          .editor-container .ql-editor {
             padding: 0;
             padding-top: 8px;
             font-family: '"Hind Siliguri"', sans-serif;
          }
          .editor-container .ql-editor.ql-blank::before {
             left: 0;
             font-style: normal;
             color: #9ca3af; 
             font-size: 1.125rem;
          }
        `}} />

        {selectedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
            {selectedImages.map((file, i) => (
              <div key={i} className="relative group">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Upload preview" 
                  className="w-full h-48 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 bg-gray-900/50 hover:bg-gray-900/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

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
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative group">
              <Image className="w-[22px] h-[22px]" />
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={onImageChange} 
              />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Add Images</span>
            </label>
            <button 
              type="button"
              onClick={() => setShowDriveInput(!showDriveInput)}
              className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative group"
            >
              <Link2 className="w-[22px] h-[22px]" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Attach Drive Link</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || (isContentEmpty && selectedImages.length === 0 && !driveLinkVal)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
