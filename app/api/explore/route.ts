// app/api/explore/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { connectDB } from "@/lib/db/connect";

import { Post } from "@/lib/db/models/Post";

import { User } from "@/lib/db/models/User";

import { Hashtag } from "@/lib/db/models/Hashtag";


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
    const type = searchParams.get("type") || "all";
    const category = searchParams.get("category") || "all";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    await connectDB();

    const results: any = {};

    // Search Posts
    if (type === "all" || type === "posts") {
      const postQuery: any = {};
      
      if (q) {
        postQuery.$or = [
          { content: { $regex: q, $options: "i" } },
          { hashtags: { $in: [q.toLowerCase()] } },
        ];
      }

      if (category !== "all") {
        postQuery.category = category;
      }

      const posts = await Post.find(postQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name username image")
        .lean();

      const totalPosts = await Post.countDocuments(postQuery);

      const formattedPosts = posts.map((post: any) => ({
        _id: post._id.toString(),
        content: post.content,
        author: post.author ? {
          _id: post.author._id.toString(),
          name: post.author.name,
          username: post.author.username,
          image: post.author.image,
        } : null,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        repostsCount: post.reposts?.length || 0,
        hashtags: post.hashtags || [],
        media: post.media || [],
        category: post.category || "general",
        mood: post.mood || null,
        viewsCount: post.viewsCount || 0,
        isPinned: post.isPinned || false,
        createdAt: post.createdAt?.toISOString(),
      }));

      results.posts = formattedPosts;
      results.postsTotal = totalPosts;
      results.postsPagination = {
        page,
        limit,
        total: totalPosts,
        pages: Math.ceil(totalPosts / limit),
        hasNext: page < Math.ceil(totalPosts / limit),
        hasPrev: page > 1,
      };
    }

    // Search Hashtags
    if (type === "all" || type === "hashtags") {
      const hashtagQuery: any = {};
      if (q) {
        hashtagQuery.tag = { $regex: q, $options: "i" };
      }

      const hashtags = await Hashtag.find(hashtagQuery)
        .sort({ count: -1 })
        .limit(limit)
        .lean();

      const formattedHashtags = hashtags.map((tag: any) => ({
        tag: tag.tag,
        count: tag.count || 0,
        isTrending: tag.isTrending || false,
        lastUsed: tag.lastUsed?.toISOString(),
      }));

      results.hashtags = formattedHashtags;
    }

    // Search Users
    if (type === "all" || type === "users") {
      const userQuery: any = {};
      
      if (q) {
        userQuery.$or = [
          { name: { $regex: q, $options: "i" } },
          { username: { $regex: q, $options: "i" } },
        ];
      }

      const users = await User.find(userQuery)
        .select("name username image bio followers following")
        .limit(limit)
        .lean();

      // Get current user's following list
      const currentUser = await User.findById(session.user.id)
        .select("following")
        .lean();

      // Type assertion to handle the following array
      const currentUserData = currentUser as any;
      const followingIds = currentUserData?.following?.map((id: any) => id.toString()) || [];

      const usersWithFollow = users.map((user: any) => ({
        _id: user._id.toString(),
        name: user.name,
        username: user.username,
        image: user.image,
        bio: user.bio,
        isFollowing: followingIds.includes(user._id.toString()),
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
      }));

      results.users = usersWithFollow;
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Explore API Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to search",
        message: error instanceof Error ? error.message : "Unknown error",
        posts: [],
        hashtags: [],
        users: [],
      },
      { status: 500 }
    );
  }
}
