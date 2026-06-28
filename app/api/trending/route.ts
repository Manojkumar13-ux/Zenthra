import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const hashtag = searchParams.get("hashtag");

    // If a specific hashtag is requested, get posts with that hashtag
    if (hashtag) {
      const posts = await Post.find({
        hashtags: hashtag,
        isPublished: true,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("author", "name username image verified")
        .lean();

      return NextResponse.json({
        hashtag,
        posts,
        count: posts.length,
      });
    }

    // Get all posts with hashtags
    const allPostsWithHashtags = await Post.find({
      hashtags: { $exists: true, $ne: [] },
      isPublished: true,
    })
      .select("hashtags likesCount commentsCount createdAt")
      .lean();

    // Count hashtag occurrences
    const hashtagCountMap: Record<string, { count: number; posts: any[] }> = {};

    allPostsWithHashtags.forEach((post) => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((tag: string) => {
          if (!hashtagCountMap[tag]) {
            hashtagCountMap[tag] = { count: 0, posts: [] };
          }
          hashtagCountMap[tag].count += 1;
          hashtagCountMap[tag].posts.push(post._id);
        });
      }
    });

    // Sort hashtags by count (descending)
    const sortedHashtags = Object.entries(hashtagCountMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit);

    // Get the most recent posts for each hashtag
    const trendingData = await Promise.all(
      sortedHashtags.map(async ([tag, data]) => {
        const recentPosts = await Post.find({
          hashtags: tag,
          isPublished: true,
        })
          .sort({ createdAt: -1 })
          .limit(3)
          .populate("author", "name username image verified")
          .lean();

        return {
          tag,
          count: data.count,
          posts: recentPosts,
        };
      })
    );

    // Get all trending posts (posts with hashtags sorted by engagement)
    const trendingPosts = await Post.find({
      hashtags: { $exists: true, $ne: [] },
      isPublished: true,
    })
      .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
      .limit(20)
      .populate("author", "name username image verified")
      .lean();

    // Add like/bookmark/repost status for current user
    const userId = session.user.id;
    const trendingPostsWithStatus = trendingPosts.map((post) => ({
      ...post,
      liked: post.likedBy?.some((id: any) => id.toString() === userId) || false,
      bookmarked: post.bookmarkedBy?.some((id: any) => id.toString() === userId) || false,
      reposted: post.repostedBy?.some((id: any) => id.toString() === userId) || false,
    }));

    return NextResponse.json({
      trending: sortedHashtags.map(([tag, data]) => ({
        tag,
        count: data.count,
      })),
      trendingData,
      trendingPosts: trendingPostsWithStatus,
    });
  } catch (error) {
    console.error("GET /api/trending error:", error);
    return NextResponse.json(
      {
        trending: [],
        trendingData: [],
        trendingPosts: [],
        message: "Failed to fetch trending",
      },
      { status: 200 }
    );
  }
}

// POST /api/trending - Update trending (recalculate)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only admin can trigger recalculation
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Only admins can recalculate trending" },
        { status: 403 }
      );
    }

    await connectDB();

    // Force a recalc by fetching and counting all hashtags
    const allPosts = await Post.find({
      hashtags: { $exists: true, $ne: [] },
      isPublished: true,
    }).select("hashtags");

    const hashtagCount: Record<string, number> = {};
    allPosts.forEach((post) => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((tag: string) => {
          hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(hashtagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return NextResponse.json({
      message: "Trending recalculated",
      trending: sorted.map(([tag, count]) => ({ tag, count })),
    });
  } catch (error) {
    console.error("POST /api/trending error:", error);
    return NextResponse.json(
      { message: "Failed to recalculate trending" },
      { status: 500 }
    );
  }
}