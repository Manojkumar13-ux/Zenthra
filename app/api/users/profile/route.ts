// app/api/users/profile/route.ts
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

// GET /api/users/profile - Get current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select("-password").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PUT /api/users/profile - Update current user's profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, username, location, website, image } = body;

    await connectDB();

    // Check if username is taken by another user
    if (username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: session.user.id },
      });
      if (existingUser) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        name: name || session.user.name,
        bio: bio || "",
        username: username ? username.toLowerCase() : session.user.username,
        location: location || "",
        website: website || "",
        image: image || session.user.image,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
