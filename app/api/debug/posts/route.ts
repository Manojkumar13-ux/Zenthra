// app/api/debug/posts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import { User } from "@/lib/db/models/User";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all posts with pagination
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = parseInt(searchParams.get("skip") || "0");

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name username email image")
      .lean();

    const totalPosts = await Post.countDocuments();

    // Get user count
    const totalUsers = await User.countDocuments();

    // Get post statistics
    const stats = {
      total: totalPosts,
      withHashtags: await Post.countDocuments({ hashtags: { $exists: true, $ne: [] } }),
      withMedia: await Post.countDocuments({ media: { $exists: true, $ne: [] } }),
      withLikes: await Post.countDocuments({ likes: { $exists: true, $ne: [] } }),
      withComments: await Post.countDocuments({ comments: { $exists: true, $ne: [] } }),
    };

    // Get recent posts from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPosts = await Post.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get posts by category
    const categoryStats = await Post.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get posts with most likes
    const topLikedPosts = await Post.find({})
      .sort({ likes: -1 })
      .limit(5)
      .populate("author", "name username")
      .lean();

    // Format response
    const formattedPosts = posts.map((post: any) => ({
      _id: post._id.toString(),
      content: post.content,
      author: post.author ? {
        _id: post.author._id.toString(),
        name: post.author.name,
        username: post.author.username,
        email: post.author.email,
        image: post.author.image,
      } : null,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      repostsCount: post.reposts?.length || 0,
      hashtags: post.hashtags || [],
      media: post.media || [],
      category: post.category || "general",
      mood: post.mood || null,
      isPinned: post.isPinned || false,
      viewsCount: post.viewsCount || 0,
      createdAt: post.createdAt?.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
    }));

    // Get database stats using mongoose
    let dbStats = null;
    try {
      if (mongoose.connection.db) {
        const collection = mongoose.connection.db.collection("posts");
        const count = await collection.countDocuments();
        dbStats = {
          count,
          collectionName: "posts",
        };
      }
    } catch (dbError) {
      console.error("Error getting DB stats:", dbError);
    }

    return NextResponse.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          total: totalPosts,
          limit,
          skip,
          hasMore: skip + limit < totalPosts,
        },
        stats: {
          ...stats,
          recentPosts,
          totalUsers,
        },
        categoryStats,
        topLikedPosts: topLikedPosts.map((post: any) => ({
          _id: post._id.toString(),
          content: post.content?.slice(0, 50) || "",
          author: post.author?.username || "Unknown",
          likes: post.likes?.length || 0,
        })),
        dbStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Debug posts API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch debug data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}