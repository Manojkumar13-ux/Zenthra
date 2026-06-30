// app/api/users/suggested/route.ts
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
    
    // Get users the current user is following
    const follows = await db.collection("follows")
      .find({ followerId: session.user.id })
      .toArray();
    const followingIds = follows.map(f => f.followingId);

    // ✅ Alternative: Use $nor
    const excludedIds = [new ObjectId(session.user.id), ...followingIds.map(id => new ObjectId(id))];
    
    const query = {
      _id: { $nin: excludedIds }
    };

    // Get users not followed by current user
    const users = await db.collection("users")
      .find(query)
      .limit(5)
      .toArray();

    // Format users
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      username: user.username,
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