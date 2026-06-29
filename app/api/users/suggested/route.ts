// app/api/users/suggested/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

export const dynamic = 'force-dynamic';
import { User } from "@/lib/db/models/User";

export const dynamic = 'force-dynamic';
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const currentUserId = session.user.id;

    await connectDB();

    // Get current user's following list
    const currentUser = await User.findById(currentUserId)
      .select("following")
      .lean();

    // Type assertion to handle the following array
    const currentUserData = currentUser as any;
    const followingIds = currentUserData?.following?.map((id: any) => id.toString()) || [];

    // Convert following IDs to ObjectId
    const followingObjectIds = followingIds
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));

    // Find suggested users (users not followed and not current user)
    const query: any = {
      _id: {
        $ne: new mongoose.Types.ObjectId(currentUserId),
        $nin: followingObjectIds,
      },
    };

    // Prioritize users with more followers
    const suggestedUsers = await User.find(query)
      .select("name username image bio followers following")
      .sort({ followersCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Format suggested users
    const formattedUsers = suggestedUsers.map((user: any) => ({
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      image: user.image || null,
      bio: user.bio || "",
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      isFollowing: false,
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch suggested users",
        message: error instanceof Error ? error.message : "Unknown error",
        users: [],
      },
      { status: 500 }
    );
  }
}
