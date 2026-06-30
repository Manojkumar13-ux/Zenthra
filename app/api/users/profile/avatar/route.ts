export const dynamic = 'force-dynamic';

// app/api/users/profile/avatar/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real app, you would:
    // 1. Save the file to cloud storage (S3, Cloudinary, etc.)
    // 2. Get the URL back
    // 3. Save the URL to the database
    
    // For demo purposes, we'll just simulate the upload
    // In production, use a library like multer, cloudinary, etc.
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, you would get the URL from your cloud storage
    // For now, we'll return a placeholder URL
    const imageUrl = `https://ui-avatars.com/api/?name=${session.user.name}&size=200&background=random`;

    const db = await connectToDatabase();
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { image: imageUrl, updatedAt: new Date() } }
    );

    return NextResponse.json({ 
      imageUrl,
      message: "Avatar updated successfully" 
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}