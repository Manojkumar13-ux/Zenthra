// app/api/users/suggested/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const currentUserId = session.user.id;

    console.log("🔍 Current user ID:", currentUserId);

    // Get all users EXCEPT the current user
    const allUsers = await db.collection("users")
      .find({ 
        _id: { $ne: currentUserId }  // ✅ Exclude current user
      })
      .toArray();

    console.log("📊 Other users:", allUsers.length);

    // Get users the current user is following
    const follows = await db.collection("follows")
      .find({ followerId: currentUserId })
      .toArray();
    
    const followingIds = follows.map(f => f.followingId);
    console.log("📊 Following users:", followingIds);

    // Filter out followed users
    const suggestedUsers = allUsers.filter(user => {
      const userId = user._id.toString();
      return !followingIds.includes(userId);
    });

    console.log("📊 Suggested users:", suggestedUsers.length);

    // Format users
    const formattedUsers = suggestedUsers.map(user => ({
      id: user._id.toString(),
      name: user.name || "User",
      username: user.username || "user",
      image: user.image || null,
      bio: user.bio || "",
      mutualFollowers: 0,
      isFollowing: false,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return NextResponse.json({ error: "Failed to fetch suggested users" }, { status: 500 });
  }
}