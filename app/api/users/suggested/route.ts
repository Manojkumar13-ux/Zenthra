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
    
    // ✅ Only include valid ObjectId strings
    const followingIds = follows
      .map(f => f.followingId)
      .filter(id => id && ObjectId.isValid(id));

    // Build query to exclude current user and followed users
    const query: any = {};
    
    // Exclude current user
    if (ObjectId.isValid(session.user.id)) {
      query._id = { $ne: new ObjectId(session.user.id) };
    }
    
    // Exclude followed users
    if (followingIds.length > 0) {
      const validObjectIds = followingIds
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));
      
      if (validObjectIds.length > 0) {
        // If we already have $ne for current user, combine with $nin
        if (query._id) {
          query._id = {
            ...query._id,
            $nin: validObjectIds
          };
        } else {
          query._id = { $nin: validObjectIds };
        }
      }
    }

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