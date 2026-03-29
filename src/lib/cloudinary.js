export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // Optional: you can add a generic upload preset here
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'lekho_preset');
  
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error("Missing Cloudinary cloud name context");
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
};
