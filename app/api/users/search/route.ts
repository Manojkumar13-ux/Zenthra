import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: new mongoose.Types.ObjectId(session.user.id) },
    })
      .select("name username image bio followers following")
      .limit(limit)
      .lean();

    const currentUser = await User.findById(session.user.id).select("following");
    const followingIds = currentUser?.following?.map((id: any) => id.toString()) || [];

    const usersWithFollow = users.map((user) => ({
      ...user,
      isFollowing: followingIds.includes(user._id.toString()),
      followersCount: user.followers?.length || 0,
    }));

    return NextResponse.json({ users: usersWithFollow });
  } catch (error) {
    console.error("GET /api/users/search error:", error);
    return NextResponse.json(
      { users: [], message: "Failed to search users" },
      { status: 200 }
    );
  }
}