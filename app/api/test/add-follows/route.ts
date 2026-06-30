// app/api/test/add-follows/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection("users");
    const followsCollection = db.collection("follows");

    // Get current user
    const currentUser = await usersCollection.findOne({ 
      _id: session.user.id 
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all other users
    const otherUsers = await usersCollection
      .find({ _id: { $ne: session.user.id } })
      .limit(10)
      .toArray();

    let followedCount = 0;
    const followedUsers = [];

    // Follow each other user
    for (const user of otherUsers) {
      const existingFollow = await followsCollection.findOne({
        followerId: session.user.id,
        followingId: user._id.toString(),
      });

      if (!existingFollow) {
        await followsCollection.insertOne({
          followerId: session.user.id,
          followingId: user._id.toString(),
          createdAt: new Date(),
        });
        followedCount++;
        followedUsers.push(user.name);
      }
    }

    return NextResponse.json({
      message: `✅ Followed ${followedCount} users!`,
      followedUsers,
      totalUsers: otherUsers.length,
    });
  } catch (error) {
    console.error("Error adding follows:", error);
    return NextResponse.json(
      { error: "Failed to add follows" },
      { status: 500 }
    );
  }
}