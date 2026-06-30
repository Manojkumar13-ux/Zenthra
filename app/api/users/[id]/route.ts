// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const userId = params.id;

    // ✅ Check if it's a valid ObjectId
    if (!userId || !ObjectId.isValid(userId)) {
      console.log(`❌ Invalid user ID: ${userId}`);
      // ✅ Return 404 instead of 400 for mock users
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count posts
    const postsCount = await db.collection("posts").countDocuments({
      "author.id": userId
    });

    // Count followers
    const followersCount = await db.collection("follows").countDocuments({
      followingId: userId
    });

    // Count following
    const followingCount = await db.collection("follows").countDocuments({
      followerId: userId
    });

    // Check if current user is following this user
    const isFollowing = await db.collection("follows").countDocuments({
      followerId: session.user.id,
      followingId: userId
    }) > 0;

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image || null,
        coverImage: user.coverImage || null,
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        createdAt: user.createdAt,
        posts: postsCount,
        followers: followersCount,
        following: followingCount,
        isFollowing,
      }
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}