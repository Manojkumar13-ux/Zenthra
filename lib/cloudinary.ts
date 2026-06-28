import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload image to Cloudinary
export async function uploadImage(
  file: Buffer | string,
  options: {
    folder?: string;
    public_id?: string;
    transformation?: any;
    tags?: string[];
  } = {}
) {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: options.folder || "zenthra",
      public_id: options.public_id,
      transformation: options.transformation,
      tags: options.tags,
      resource_type: "auto",
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
}

// Delete image from Cloudinary
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete image");
  }
}

// Get image URL with transformations
export function getImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
  } = {}
) {
  const { width, height, crop = "fill", quality = 80, format = "auto" } = options;
  
  let url = cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    format,
    secure: true,
  });

  return url;
}

// Upload multiple images
export async function uploadMultipleImages(
  files: Buffer[],
  options: {
    folder?: string;
    tags?: string[];
  } = {}
) {
  const uploadPromises = files.map((file) =>
    uploadImage(file, {
      folder: options.folder || "zenthra",
      tags: options.tags,
    })
  );
  return await Promise.all(uploadPromises);
}

// Generate video thumbnail
export async function generateVideoThumbnail(videoPublicId: string) {
  return cloudinary.url(videoPublicId, {
    resource_type: "video",
    transformation: [
      { width: 400, height: 400, crop: "fill" },
      { start_offset: "0" },
      { format: "jpg" },
    ],
  });
}

export { cloudinary };