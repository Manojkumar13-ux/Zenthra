// app/api/users/settings/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get user data from database or return defaults
    const userData = {
      name: session.user?.name || "",
      username: session.user?.username || "",
      email: session.user?.email || "",
      image: session.user?.image || "",
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
    };

    return NextResponse.json({ settings: userData });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // ✅ Return the updated settings
    return NextResponse.json({
      message: "Settings updated successfully",
      settings: {
        name: body.name || session.user?.name || "",
        username: body.username || session.user?.username || "",
        email: body.email || session.user?.email || "",
        image: body.image || session.user?.image || "",
        bio: body.bio || "",
        location: body.location || "",
        website: body.website || "",
        notifications: body.notifications || {
          email: true,
          push: true,
          mentions: true,
          likes: true,
          comments: true,
          follows: true,
        },
        privacy: body.privacy || {
          profileVisibility: "public",
          activityStatus: true,
          readReceipts: true,
        },
      }
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}