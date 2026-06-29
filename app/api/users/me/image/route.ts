// app/api/users/me/image/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { connectDB } from "@/lib/db/connect";

import { User } from "@/lib/db/models/User";

import { writeFile, mkdir } from "fs/promises";

import path from "path";


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;

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

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 2MB." }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const ext = file.name.split(".").pop();
    const filename = `avatar_${timestamp}_${session.user.id}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
    const filePath = path.join(uploadDir, filename);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Save file
    await writeFile(filePath, buffer);

    const url = `/uploads/avatars/${filename}`;

    // Update user in database
    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      image: url,
    });

    return NextResponse.json({
      success: true,
      image: url,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Failed to upload profile picture" }, { status: 500 });
  }
}
