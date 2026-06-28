// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = params.id;

    const user = await User.findById(userId)
      .select("-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if current user is following this user
    const currentUser = await User.findById(session.user.id).select("following");
    const isFollowing = currentUser?.following?.some(
      (id: any) => id.toString() === userId
    ) || false;

    const formattedUser = {
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt?.toISOString(),
      followers: user.followers?.map((id: any) => id.toString()) || [],
      following: user.following?.map((id: any) => id.toString()) || [],
      isFollowing,
      stats: {
        postsCount: user.stats?.postsCount || 0,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
      },
    };

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    console.error("❌ Get User API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT - Update User Profile
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    // Only allow users to update their own profile
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { name, bio, location, website, socialLinks } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (socialLinks) user.socialLinks = socialLinks;

    await user.save();

    const formattedUser = {
      ...user.toObject(),
      _id: user._id.toString(),
      createdAt: user.createdAt?.toISOString(),
      followers: user.followers?.map((id: any) => id.toString()) || [],
      following: user.following?.map((id: any) => id.toString()) || [],
      isFollowing: false,
      stats: {
        postsCount: user.stats?.postsCount || 0,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
      },
    };

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    console.error("❌ Update User API Error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}