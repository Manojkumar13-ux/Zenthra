import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with error handling
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Log file details for debugging
    console.log("File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Validate file type
    const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    const validAudioTypes = ["audio/mpeg", "audio/webm", "audio/ogg"];
    
    const isValidType = [...validImageTypes, ...validVideoTypes, ...validAudioTypes].includes(file.type);
    
    if (!isValidType) {
      return NextResponse.json(
        { message: "Invalid file type. Supported: images, videos, and audio." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with resource type detection
    const resourceType = file.type.startsWith("video/") ? "video" : 
                        file.type.startsWith("audio/") ? "raw" : "image";

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `zenthra/posts/${session.user.id}`,
          resource_type: resourceType,
          transformation: resourceType === "image" ? [
            { quality: "auto:good" },
            { fetch_format: "auto" },
          ] : [],
          public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    const responseData = {
      url: (result as any).secure_url,
      public_id: (result as any).public_id,
      resource_type: (result as any).resource_type,
      format: (result as any).format,
    };

    console.log("Upload successful:", responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { 
        message: "Failed to upload file", 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}