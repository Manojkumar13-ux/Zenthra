// app/api/users/settings/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    
    // Get user settings
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { 
          name: 1, 
          username: 1, 
          email: 1, 
          image: 1,
          bio: 1,
          location: 1,
          website: 1,
          notifications: 1,
          privacy: 1,
        } 
      }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      settings: {
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image,
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        notifications: user.notifications || {
          email: true,
          push: true,
          mentions: true,
          likes: true,
          comments: true,
          follows: true,
        },
        privacy: user.privacy || {
          profileVisibility: "public",
          activityStatus: true,
          readReceipts: true,
        },
      }
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    // ✅ Return default settings instead of error
    return NextResponse.json({
      settings: {
        name: session.user.name,
        username: session.user.username,
        email: session.user.email,
        image: session.user.image,
        bio: "",
        location: "",
        website: "",
        notifications: {
          email: true,
          push: true,
          mentions: true,
          likes: true,
          comments: true,
          follows: true,
        },
        privacy: {
          profileVisibility: "public",
          activityStatus: true,
          readReceipts: true,
        },
      }
    });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const body = await request.json();
    const { name, bio, location, website, notifications, privacy } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (notifications !== undefined) updateData.notifications = notifications;
    if (privacy !== undefined) updateData.privacy = privacy;
    updateData.updatedAt = new Date();

    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: updateData }
    );

    return NextResponse.json({ 
      message: "Settings updated successfully",
      settings: updateData
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}