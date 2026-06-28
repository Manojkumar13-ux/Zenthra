// app/api/feed/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import { User } from "@/lib/db/models/User";

export async function GET(req: Request) {
  try {
    console.log("🔵 Feed API: Starting request");
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("🔴 Feed API: Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized", posts: [] },
        { status: 401 }
      );
    }

    console.log(`🟢 Feed API: User ${session.user.id} authenticated`);

    await connectDB();
    console.log("✅ Feed API: Database connected");

    const url = new URL(req.url);
    const tab = url.searchParams.get("tab") || "for-you";
    const category = url.searchParams.get("category") || "all";
    const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
    const skip = (page - 1) * limit;

    console.log(`📊 Feed API: tab=${tab}, category=${category}, page=${page}`);

    // Build query
    let query: any = {};
    let sort: any = { createdAt: -1 };

    switch (tab) {
      case "following": {
        const currentUser = await User.findById(session.user.id)
          .select("following")
          .lean();
        
        const followingIds = currentUser?.following?.map((id: any) => id.toString()) || [];
        const userId = session.user.id;
        query.author = { $in: [...followingIds, userId] };
        console.log(`📊 Following: ${followingIds.length} users`);
        break;
      }
      case "trending": {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query.createdAt = { $gte: sevenDaysAgo };
        sort = { likes: -1, comments: -1, createdAt: -1 };
        console.log("📊 Trending: Last 7 days");
        break;
      }
      case "communities": {
        query.hashtags = { $in: ["community", "zenthra"] };
        console.log("📊 Communities");
        break;
      }
      case "for-you":
      default: {
        console.log("📊 For-You: All posts");
        break;
      }
    }

    // Apply category filter
    if (category !== "all") {
      const categoryLower = category.toLowerCase();
      query.hashtags = { 
        $in: [
          categoryLower,
          `#${categoryLower}`,
        ] 
      };
      console.log(`📊 Category filter: ${category}`);
    }

    console.log("🔍 Feed API: Query:", JSON.stringify(query));

    // Get total count
    const total = await Post.countDocuments(query);
    console.log(`📊 Total posts: ${total}`);

    // ✅ FIX: Remove comment population to avoid the error
    const posts = await Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("author", "name username image")
      // .populate("comments") // ❌ Remove this - Comment model doesn't exist yet
      .lean();

    console.log(`✅ Found ${posts.length} posts`);

    // Format posts
    const formattedPosts = posts.map((post: any) => ({
      ...post,
      _id: post._id.toString(),
      author: post.author ? {
        ...post.author,
        _id: post.author._id.toString(),
      } : null,
      likes: post.likes?.map((id: any) => id.toString()) || [],
      comments: post.comments?.map((id: any) => id.toString()) || [],
      reposts: post.reposts?.map((id: any) => id.toString()) || [],
      createdAt: post.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        hasNext: skip + posts.length < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Feed API Error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to fetch feed",
        posts: [],
        pagination: { page: 1, limit: 10, total: 0, hasNext: false, hasPrev: false }
      },
      { status: 500 }
    );
  }
}