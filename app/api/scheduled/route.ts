// app/api/scheduled/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { connectDB } from "@/lib/db/connect";

import { Post } from "@/lib/db/models/Post";


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
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    await connectDB();

    const query = {
      author: session.user.id,
      isScheduled: true,
      scheduledAt: { $gte: new Date() },
    };

    const scheduledPosts = await Post.find(query)
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limit)
      .select("content media hashtags scheduledAt category mood visibility")
      .lean();

    const total = await Post.countDocuments(query);

    const formattedPosts = scheduledPosts.map((post: any) => ({
      _id: post._id.toString(),
      content: post.content,
      media: post.media || [],
      hashtags: post.hashtags || [],
      scheduledAt: post.scheduledAt?.toISOString(),
      category: post.category || "general",
      mood: post.mood || null,
      visibility: post.visibility || "public",
      createdAt: post.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { content, media, hashtags, scheduledAt, category, mood, visibility } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "Scheduled date is required" },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate < new Date()) {
      return NextResponse.json(
        { error: "Scheduled date must be in the future" },
        { status: 400 }
      );
    }

    await connectDB();

    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    const extractedHashtags = matches
      ? matches.map((tag: string) => tag.slice(1).toLowerCase())
      : [];

    const allHashtags = [...new Set([...(hashtags || []), ...extractedHashtags])];

    const post = await Post.create({
      content: content.trim(),
      author: session.user.id,
      media: media || [],
      hashtags: allHashtags,
      category: category || "general",
      mood: mood || null,
      visibility: visibility || "public",
      isScheduled: true,
      scheduledAt: scheduledDate,
    });

    const populatedPost = await Post.findById(post._id)
      .populate("author", "name username image")
      .lean();

    // Check if populatedPost exists before using it
    if (!populatedPost) {
      return NextResponse.json(
        { error: "Failed to create scheduled post" },
        { status: 500 }
      );
    }

    const populatedPostData = populatedPost as any;

    return NextResponse.json({
      success: true,
      post: {
        _id: populatedPostData._id.toString(),
        content: populatedPostData.content,
        author: populatedPostData.author ? {
          _id: populatedPostData.author._id.toString(),
          name: populatedPostData.author.name,
          username: populatedPostData.author.username,
          image: populatedPostData.author.image,
        } : null,
        media: populatedPostData.media || [],
        hashtags: populatedPostData.hashtags || [],
        category: populatedPostData.category || "general",
        mood: populatedPostData.mood || null,
        visibility: populatedPostData.visibility || "public",
        isScheduled: true,
        scheduledAt: populatedPostData.scheduledAt?.toISOString(),
        createdAt: populatedPostData.createdAt?.toISOString(),
      },
      message: "Post scheduled successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Error scheduling post:", error);
    return NextResponse.json(
      { error: "Failed to schedule post" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const post = await Post.findOne({
      _id: postId,
      author: session.user.id,
      isScheduled: true,
    });

    if (!post) {
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 }
      );
    }

    await Post.findByIdAndDelete(postId);

    return NextResponse.json({
      success: true,
      message: "Scheduled post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to delete scheduled post" },
      { status: 500 }
    );
  }
}
