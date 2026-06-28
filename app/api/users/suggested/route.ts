// app/api/users/suggested/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const currentUserId = session.user.id;

    // Get current user to check following list
    const currentUser = await User.findById(currentUserId);
    const followingIds = currentUser?.following?.map((id: any) => id.toString()) || [];

    // Get suggested users (excluding self and already followed)
    const suggestedUsers = await User.find({
      _id: { 
        $ne: new mongoose.Types.ObjectId(currentUserId),
        $nin: followingIds.map(id => new mongoose.Types.ObjectId(id))
      }
    })
      .select("name username image bio followers following")
      .limit(10)
      .lean();

    // Add isFollowing flag
    const usersWithFollowStatus = suggestedUsers.map((user: any) => ({
      ...user,
      isFollowing: false, // Since we already excluded followed users
      followersCount: user.followers?.length || 0,
    }));

    return NextResponse.json({
      users: usersWithFollowStatus,
    });

  } catch (error) {
    console.error("Suggested users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggested users" },
      { status: 500 }
    );
  }
}