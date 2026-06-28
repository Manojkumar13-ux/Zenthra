import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
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

    // Tab-specific filters
    const currentUser = await User.findById(session.user.id)
      .select("following")
      .lean();

    if (tab === "following") {
      query._id = { $in: currentUser?.following || [] };
    } else if (tab === "suggested") {
      // Users not followed and not current user
      query._id = { 
        $nin: [...(currentUser?.following || []), session.user.id] 
      };
      // Prioritize users with more followers
    }

    // Fetch users with pagination
    const users = await User.find(query)
      .select("name username email image bio followers following posts")
      .sort({ followersCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await User.countDocuments(query);

    // Check if current user is following each user
    const followingIds = new Set(
      currentUser?.following?.map((id: any) => id.toString()) || []
    );

    const usersWithFollowStatus = users.map((user: any) => ({
      ...user,
      _id: user._id.toString(),
      isFollowing: followingIds.has(user._id.toString()),
      isCurrentUser: user._id.toString() === session.user.id,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      postsCount: user.posts?.length || 0,
    }));

    return NextResponse.json({
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
      { error: "Failed to find users" },
      { status: 500 }
    );
  }
}