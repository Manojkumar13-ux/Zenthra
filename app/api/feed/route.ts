// app/api/feed/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

export const dynamic = 'force-dynamic';
import { Post } from "@/lib/db/models/Post";

export const dynamic = 'force-dynamic';
import { User } from "@/lib/db/models/User";

export const dynamic = 'force-dynamic';

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
    const tab = searchParams.get("tab") || "for-you";
    const category = searchParams.get("category") || "all";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    await connectDB();

    let query: any = {};
    let sort: any = { createdAt: -1 };

    // Build query based on tab
    if (tab === "for-you") {
      // Show posts from followed users and popular posts
      const currentUser = await User.findById(session.user.id).select("following").lean();
      
      // Type assertion to handle the following array
      const currentUserData = currentUser as any;
      const followingIds = currentUserData?.following?.map((id: any) => id.toString()) || [];
      const userId = session.user.id;
      
      // Include posts from followed users and the current user
      query.$or = [
        { author: { $in: [...followingIds, userId] } },
        { isPinned: true },
      ];
      
      // Also include popular posts
      sort = { likes: -1, createdAt: -1 };
    } else if (tab === "following") {
      // Show posts only from followed users
      const currentUser = await User.findById(session.user.id).select("following").lean();
      
      // Type assertion to handle the following array
      const currentUserData = currentUser as any;
      const followingIds = currentUserData?.following?.map((id: any) => id.toString()) || [];
      
      if (followingIds.length === 0) {
        return NextResponse.json({
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
      
      query.author = { $in: followingIds };
    } else if (tab === "trending") {
      // Show trending posts (most liked/commented/reposted)
      query.isPinned = false;
      sort = { likes: -1, comments: -1, reposts: -1, createdAt: -1 };
    } else if (tab === "communities") {
      // Show posts from communities the user is part of
      // For now, show all posts with community category
      query.category = { $exists: true, $ne: null };
    }

    // Apply category filter
    if (category !== "all") {
      query.category = category;
    }

    // Filter out scheduled posts
    query.isScheduled = { $ne: true };

    // Fetch posts
    const posts = await Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("author", "name username image bio")
      .lean();

    const total = await Post.countDocuments(query);

    // Format posts
    const formattedPosts = posts.map((post: any) => ({
      _id: post._id.toString(),
      content: post.content,
      author: post.author ? {
        _id: post.author._id.toString(),
        name: post.author.name,
        username: post.author.username,
        image: post.author.image,
        bio: post.author.bio,
      } : null,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      repostsCount: post.reposts?.length || 0,
      liked: post.likes?.includes(session.user.id) || false,
      bookmarked: post.bookmarks?.includes(session.user.id) || false,
      reposted: post.reposts?.includes(session.user.id) || false,
      media: post.media || [],
      hashtags: post.hashtags || [],
      mood: post.mood || null,
      category: post.category || "general",
      viewsCount: post.viewsCount || 0,
      isPinned: post.isPinned || false,
      aiSummary: post.aiSummary || null,
      createdAt: post.createdAt?.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
    }));

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Feed API Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch feed",
        message: error instanceof Error ? error.message : "Unknown error",
        posts: [],
      },
      { status: 500 }
    );
  }
}
