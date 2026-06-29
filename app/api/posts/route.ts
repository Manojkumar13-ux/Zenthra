// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import { Hashtag } from "@/lib/db/models/Hashtag";

export async function POST(req: Request) {
  try {
    console.log("🔵 Create Post API: Starting");

    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("🔴 Create Post API: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    console.log("📝 Create Post API: Body received:", body);

    const { content, media, hashtags, isPublic, mood } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await connectDB();

    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    const extractedHashtags = matches
      ? matches.map((tag: string) => tag.slice(1).toLowerCase())
      : [];

    const allHashtags = [...new Set([...(hashtags || []), ...extractedHashtags])];

    console.log("🏷️ Hashtags found:", allHashtags);

    // Create post
    const postData = {
      content: content.trim(),
      author: session.user.id,
      media: media || [],
      hashtags: allHashtags,
      isPublic: isPublic !== undefined ? isPublic : true,
      mood: mood || null,
    };

    const post = await Post.create(postData);
    console.log("✅ Post created:", post._id);

    // ============================================
    // UPDATE HASHTAG COUNTS FOR EACH HASHTAG
    // ============================================
    if (allHashtags.length > 0) {
      for (const tag of allHashtags) {
        try {
          const cleanTag = tag.toLowerCase().trim();

          // Find or create hashtag and increment count
          const hashtag = await Hashtag.findOneAndUpdate(
            { tag: cleanTag },
            {
              $inc: { count: 1 },
              $addToSet: { posts: post._id },
              $set: { lastUsed: new Date() },
            },
            { upsert: true, new: true }
          );

          // Check if it should be trending (count > 3)
          if (hashtag.count >= 3) {
            await Hashtag.updateOne({ _id: hashtag._id }, { $set: { isTrending: true } });
          }

          console.log(`📊 Hashtag #${cleanTag} updated: ${hashtag.count} posts`);
        } catch (error) {
          console.error(`❌ Error updating hashtag #${tag}:`, error);
          // Continue with other hashtags even if one fails
        }
      }
    }

    // Populate author
    await post.populate("author", "name username image");

    // Format response
    const formattedPost = {
      ...post.toObject(),
      _id: post._id.toString(),
      author: post.author
        ? {
            ...post.author.toObject(),
            _id: post.author._id.toString(),
          }
        : null,
      likes: [],
      comments: [],
      reposts: [],
      createdAt: post.createdAt?.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        post: formattedPost,
        message: "Post created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Create Post API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    let query: any = {};
    if (userId) {
      query.author = userId;
    }
    query.isPublic = true;

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name username image")
      .lean();

    const total = await Post.countDocuments(query);

    const formattedPosts = posts.map((post: any) => ({
      ...post,
      _id: post._id.toString(),
      author: post.author
        ? {
            ...post.author,
            _id: post.author._id.toString(),
          }
        : null,
      createdAt: post.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        hasNext: skip + posts.length < total,
      },
    });
  } catch (error) {
    console.error("❌ Get Posts API Error:", error);
    return NextResponse.json({ error: "Failed to fetch posts", posts: [] }, { status: 500 });
  }
}
