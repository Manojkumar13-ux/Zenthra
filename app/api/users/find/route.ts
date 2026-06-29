// app/api/users/find/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { connectDB } from "@/lib/db/connect";

import { User } from "@/lib/db/models/User";


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const tab = searchParams.get("tab") || "all";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    await connectDB();

    // Build search query
    let query: any = {};

    // Exclude current user
    query._id = { $ne: session.user.id };

    // Search by name or username
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ];
    }

    // Get current user's following list
    const currentUser = await User.findById(session.user.id)
      .select("following")
      .lean();

    // Type assertion to handle the following array
    const currentUserData = currentUser as any;
    const followingIds = currentUserData?.following?.map((id: any) => id.toString()) || [];

    // Tab-specific filters
    if (tab === "following") {
      query._id = { $in: followingIds };
    } else if (tab === "suggested") {
      // Users not followed and not current user
      query._id = {
        $nin: [...followingIds, session.user.id]
      };
      // Prioritize users with more followers
      query.followersCount = { $gt: 0 };
    }

    // Fetch users with pagination
    const users = await User.find(query)
      .select("name username email image bio followers following postsCount")
      .sort({ followersCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await User.countDocuments(query);

    // Format users with follow status
    const followingIdsSet = new Set(followingIds);

    const usersWithFollowStatus = users.map((user: any) => ({
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image || null,
      bio: user.bio || "",
      isFollowing: followingIdsSet.has(user._id.toString()),
      isCurrentUser: user._id.toString() === session.user.id,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      postsCount: user.postsCount || 0,
      createdAt: user.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      users: usersWithFollowStatus,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error finding users:", error);
    return NextResponse.json(
      { 
        error: "Failed to find users",
        message: error instanceof Error ? error.message : "Unknown error",
        users: [],
      },
      { status: 500 }
    );
  }
}
