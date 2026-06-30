// app/api/users/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const body = await request.json();
    const { name, bio, location, website } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    updateData.updatedAt = new Date();

    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(session.user.id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      user: {
        _id: result._id.toString(),
        name: result.name,
        username: result.username,
        email: result.email,
        image: result.image,
        bio: result.bio,
        location: result.location,
        website: result.website,
        createdAt: result.createdAt,
      },
      message: "Profile updated successfully" 
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}