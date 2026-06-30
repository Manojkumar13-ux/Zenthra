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

    // Get users the current user is following
    const follows = await db.collection("follows")
      .find({ followerId: currentUserId })
      .toArray();
    
    const followingIds = follows.map(f => f.followingId);

    // ✅ Get REAL users from database - use string comparison
    const excludedIds = [currentUserId, ...followingIds];
    
    const users = await db.collection("users")
      .find({
        _id: { $nin: excludedIds }
      })
      .limit(5)
      .toArray();

    console.log(`📊 Suggested users found: ${users.length}`);

    // ✅ Format and return ONLY real users
    const formattedUsers = users.map(user => ({
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
    return NextResponse.json({ users: [] });
  }
}