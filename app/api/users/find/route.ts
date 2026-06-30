// app/api/users/find/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "all";
    const query = searchParams.get("q") || "";

    let filter: any = {};

    // ✅ Exclude current user - use string comparison
    filter._id = { $ne: session.user.id };

    // ✅ Search by name or username
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ];
    }

    // ✅ Get ALL users from database
    const users = await db.collection("users")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    console.log(`📊 Found ${users.length} users in database`);

    // ✅ Get follows to check if current user follows them
    const follows = await db.collection("follows")
      .find({ followerId: session.user.id })
      .toArray();
    const followingIds = follows.map(f => f.followingId);

    // ✅ Format users
    const formattedUsers = users.map(user => ({
      _id: user._id.toString(),
      name: user.name || "User",
      username: user.username || "user",
      image: user.image || null,
      bio: user.bio || "",
      isFollowing: followingIds.includes(user._id.toString()),
      followersCount: 0,
      postsCount: 0,
    }));

    return NextResponse.json({ 
      users: formattedUsers,
      total: formattedUsers.length 
    });
  } catch (error) {
    console.error("Error finding users:", error);
    return NextResponse.json(
      { error: "Failed to find users" },
      { status: 500 }
    );
  }
}