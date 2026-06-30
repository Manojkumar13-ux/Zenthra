// app/api/users/profile/cover/route.ts
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

    const formData = await request.formData();
    const file = formData.get("cover") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, you would upload to cloud storage
    // For demo, we'll use a placeholder
    const imageUrl = `https://picsum.photos/seed/${session.user.id}/1200/400`;

    const db = await connectToDatabase();
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { coverImage: imageUrl, updatedAt: new Date() } }
    );

    return NextResponse.json({ 
      imageUrl,
      message: "Cover photo updated successfully" 
    });
  } catch (error) {
    console.error("Error uploading cover photo:", error);
    return NextResponse.json(
      { error: "Failed to upload cover photo" },
      { status: 500 }
    );
  }
}