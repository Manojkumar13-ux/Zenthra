// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadOptions {
  folder?: string;
  public_id?: string;
  transformation?: any;
  width?: number;
  height?: number;
  quality?: number;
}

export async function uploadToCloudinary(
  file: string | Buffer,
  options: UploadOptions = {}
) {
  try {
    // Convert Buffer to base64 string if needed
    let fileToUpload: string = file as string;
    
    if (Buffer.isBuffer(file)) {
      // Convert Buffer to base64 data URI
      fileToUpload = `data:image/jpeg;base64,${file.toString('base64')}`;
    }

    const result = await cloudinary.uploader.upload(fileToUpload, {
      folder: options.folder || "zenthra",
      public_id: options.public_id,
      transformation: options.transformation,
      width: options.width,
      height: options.height,
      quality: options.quality || 80,
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === "ok",
      result,
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

export async function getCloudinaryImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
  } = {}
) {
  const { width, height, crop = "fill", quality = 80, format } = options;

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

export { cloudinary };