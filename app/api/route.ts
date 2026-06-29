// app/api/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json([]);
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    const objectIds = userIds.map((id: string) => new ObjectId(id));

    const users = await usersCollection
      .find({
        _id: { $in: objectIds },
      })
      .project({ _id: 1, name: 1, username: 1, image: 1 })
      .toArray();

    const formattedUsers = users.map((user: any) => ({
      ...user,
      _id: user._id.toString(),
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    let query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const users = await usersCollection.find(query).limit(limit).toArray();

    // Get current user's following list
    const currentUser = await usersCollection.findOne({
      _id: new ObjectId(session.user.id),
    });

    const followingIds = currentUser?.following?.map((id: string) => id.toString()) || [];

    const usersWithStatus = users.map((user: any) => ({
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      isFollowing: followingIds.includes(user._id.toString()),
    }));

    return NextResponse.json(usersWithStatus);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
