// app/api/users/[id]/follow/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
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
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const currentUserId = session.user.id;

    // Check if already following
    const existingFollow = await db.collection("follows").findOne({
      followerId: currentUserId,
      followingId: userId,
    });

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 400 });
    }

    await db.collection("follows").insertOne({
      followerId: currentUserId,
      followingId: userId,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Followed successfully" });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const currentUserId = session.user.id;

    await db.collection("follows").deleteOne({
      followerId: currentUserId,
      followingId: userId,
    });

    return NextResponse.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}