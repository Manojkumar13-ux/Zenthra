// app/api/users/following/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    
    // ✅ Convert string ID to ObjectId
    const currentUserId = session.user.id;
    
    // Find all users that the current user is following
    const follows = await db.collection("follows")
      .find({ followerId: currentUserId })
      .toArray();

    const followingIds = follows.map(f => f.followingId);

    return NextResponse.json({ users: followingIds });
  } catch (error) {
    console.error("Error fetching following users:", error);
    return NextResponse.json(
      { error: "Failed to fetch following users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // ✅ Check if ID is valid
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const currentUserId = session.user.id;

    // Check if already following
    const existingFollow = await db.collection("follows").findOne({
      followerId: currentUserId,
      followingId: userId,
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    await db.collection("follows").insertOne({
      followerId: currentUserId,
      followingId: userId,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      message: "User followed successfully",
      following: true 
    });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const currentUserId = session.user.id;

    await db.collection("follows").deleteOne({
      followerId: currentUserId,
      followingId: userId,
    });

    return NextResponse.json({ 
      message: "User unfollowed successfully",
      following: false 
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}