// app/api/users/me/cover/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

export const dynamic = 'force-dynamic';
import { User } from "@/lib/db/models/User";

export const dynamic = 'force-dynamic';
import { writeFile, mkdir } from "fs/promises";

export const dynamic = 'force-dynamic';
import path from "path";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("cover") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP)." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const ext = file.name.split(".").pop();
    const filename = `cover_${timestamp}_${session.user.id}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public/uploads/covers");
    const filePath = path.join(uploadDir, filename);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Save file
    await writeFile(filePath, buffer);

    const url = `/uploads/covers/${filename}`;

    // Update user in database
    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      coverImage: url,
    });

    return NextResponse.json({
      success: true,
      url,
      message: "Cover photo updated successfully",
    });
  } catch (error) {
    console.error("Cover upload error:", error);
    return NextResponse.json({ error: "Failed to upload cover photo" }, { status: 500 });
  }
}
